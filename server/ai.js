import knowledge from '../shared/knowledge.json' with { type: 'json' }
import {
  CRISIS_ANSWER,
  LINEA_VIDA,
  guideAnswer as baseGuideAnswer,
  isCrisis,
} from '../shared/guide.js'

export { CRISIS_ANSWER, isCrisis }

const LINEA = LINEA_VIDA

const SYSTEM_PROMPT = `Eres el asistente del módulo "Mi plan" de la app Detectives del Humo. Acompañas a personas adultas en México que quieren reducir o dejar el consumo de vapeadores, bolsas de nicotina, tabaco calentado o cigarros.

Reglas:
- Responde en español de México, con tono cálido, directo y sin regaños. Máximo 120 palabras.
- Usa ÚNICAMENTE la información de la GUÍA VERIFICADA que aparece abajo. Si la guía no responde la pregunta, dilo con claridad y sugiere consultar a un profesional de la salud o la ${LINEA}
- No inventes cifras, estudios ni datos. No des diagnósticos, dosis ni indicaciones de medicamentos.
- No recomiendes otros productos de nicotina como alternativa.
- Si la persona menciona una crisis o riesgo para su vida, prioriza la ${LINEA}
- Termina SIEMPRE con una línea final con este formato exacto: FUENTES: id1,id2 (los id de los hechos de la guía que usaste; vacío si no usaste ninguno).`

function buildGuide() {
  return knowledge.facts.map((f) => `[${f.id}] ${f.title}: ${f.text}`).join('\n')
}

/**
 * Respuesta construida solo con la guía verificada (sin IA).
 * @param {string} question
 */
export function guideAnswer(question) {
  return baseGuideAnswer(question, knowledge.facts)
}

/** @param {string} raw */
export function parseModelAnswer(raw) {
  const validIds = new Set(knowledge.facts.map((f) => f.id))
  const match = raw.match(/\n?\s*FUENTES:\s*([^\n]*)\s*$/i)
  const answer = (match ? raw.slice(0, match.index) : raw).trim()
  const factIds = match
    ? match[1]
        .split(',')
        .map((s) => s.trim())
        .filter((id) => validIds.has(id))
    : []
  return { answer, factIds }
}

function systemPrompt() {
  return `${SYSTEM_PROMPT}\n\nGUÍA VERIFICADA:\n${buildGuide()}`
}

/**
 * Proveedores compatibles. Cada uno sabe armar la solicitud y leer la respuesta.
 * - anthropic: API de Claude (Messages API).
 * - deepseek: API de DeepSeek, formato compatible con OpenAI (/chat/completions).
 */
export const PROVIDERS = {
  anthropic: {
    label: 'Claude (Anthropic)',
    defaultModel: 'claude-haiku-5-5',
    defaultBaseUrl: 'https://api.anthropic.com',
    /** @param {{ apiKey: string, model: string, version: string, baseUrl: string }} cfg @param {string} question */
    request(cfg, question) {
      return {
        url: `${cfg.baseUrl}/v1/messages`,
        headers: {
          'content-type': 'application/json',
          'x-api-key': cfg.apiKey,
          'anthropic-version': cfg.version,
        },
        body: {
          model: cfg.model,
          max_tokens: 400,
          system: systemPrompt(),
          messages: [{ role: 'user', content: question }],
        },
      }
    },
    /** @param {any} data */
    readText(data) {
      return (data?.content ?? [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('')
    },
  },
  deepseek: {
    label: 'DeepSeek',
    defaultModel: 'deepseek-flash',
    defaultBaseUrl: 'https://api.deepseek.com',
    /** @param {{ apiKey: string, model: string, baseUrl: string }} cfg @param {string} question */
    request(cfg, question) {
      return {
        url: `${cfg.baseUrl}/chat/completions`,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${cfg.apiKey}`,
        },
        body: {
          model: cfg.model,
          messages: [
            { role: 'system', content: systemPrompt() },
            { role: 'user', content: question },
          ],
          max_tokens: 400,
          temperature: 0.3,
          // El "modo de razonamiento" viene activado por defecto; para respuestas cortas
          // de una guía no hace falta y solo agrega tiempo y costo.
          thinking: { type: 'disabled' },
          stream: false,
        },
      }
    },
    /** @param {any} data */
    readText(data) {
      return data?.choices?.[0]?.message?.content ?? ''
    },
  },
}

/**
 * Decide qué proveedor usar a partir de las variables de entorno.
 * AI_PROVIDER manda; si no está, se usa el que tenga clave (Anthropic primero).
 * @param {Record<string, string | undefined>} env
 */
export function resolveAiConfig(env) {
  const explicit = (env.AI_PROVIDER ?? '').trim().toLowerCase()
  if (explicit && !(explicit in PROVIDERS)) {
    throw new Error(
      `AI_PROVIDER="${explicit}" no es válido. Usa: ${Object.keys(PROVIDERS).join(', ')}.`,
    )
  }
  const provider =
    explicit ||
    (env.ANTHROPIC_API_KEY ? 'anthropic' : env.DEEPSEEK_API_KEY ? 'deepseek' : 'anthropic')
  if (provider === 'deepseek') {
    return {
      provider,
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL || undefined,
      baseUrl: env.DEEPSEEK_BASE_URL || undefined,
    }
  }
  return {
    provider,
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.ANTHROPIC_MODEL || undefined,
    version: env.ANTHROPIC_VERSION || undefined,
  }
}

/**
 * Cliente de IA. Si no hay clave configurada, devuelve null y el servidor usa la guía.
 * @param {{ provider?: keyof typeof PROVIDERS, apiKey?: string, model?: string, version?: string, baseUrl?: string, fetchImpl?: typeof fetch, timeoutMs?: number }} options
 */
export function createAiClient({
  provider = 'anthropic',
  apiKey,
  model,
  version = '2023-06-01',
  baseUrl,
  fetchImpl = fetch,
  timeoutMs = 20000,
} = {}) {
  if (!apiKey) return null
  const impl = PROVIDERS[provider]
  if (!impl) throw new Error(`Proveedor de IA desconocido: ${provider}`)
  const cfg = {
    apiKey,
    model: model || impl.defaultModel,
    version,
    baseUrl: (baseUrl || impl.defaultBaseUrl).replace(/\/+$/, ''),
  }
  return {
    provider,
    label: impl.label,
    model: cfg.model,
    /** @param {string} question */
    async ask(question) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const { url, headers, body } = impl.request(cfg, question)
        const response = await fetchImpl(url, {
          method: 'POST',
          signal: controller.signal,
          headers,
          body: JSON.stringify(body),
        })
        if (!response.ok) {
          throw new Error(`${impl.label} responded ${response.status}`)
        }
        const text = impl.readText(await response.json())
        if (!text.trim()) throw new Error(`${impl.label} returned an empty answer`)
        return { mode: 'ai', ...parseModelAnswer(text) }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
