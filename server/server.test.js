// @vitest-environment node
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createAiClient, guideAnswer, isCrisis, parseModelAnswer, resolveAiConfig } from './ai.js'
import { createApp, generateCode } from './app.js'
import { aggregate } from './stats.js'
import { createStore } from './store.js'
import { GROUP_CODE_REGEX } from './schemas.js'

const silentLogger = { error: () => {}, info: () => {} }

async function setup(ai = null) {
  const store = await createStore()
  const app = createApp({ store, ai, logger: silentLogger })
  return { app, store }
}

const attempt = (answers, confidence = 1) => ({ answers, confidence })

describe('códigos de grupo', () => {
  it('genera códigos con el formato esperado y sin caracteres ambiguos', () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(GROUP_CODE_REGEX)
  })
})

describe('POST /api/groups', () => {
  it('crea un grupo válido', async () => {
    const { app } = await setup()
    const res = await request(app)
      .post('/api/groups')
      .send({ schoolName: 'Primaria Benito Juárez', grade: '5', groupLabel: 'B' })
    expect(res.status).toBe(201)
    expect(res.body.group.code).toMatch(GROUP_CODE_REGEX)
    expect(res.body.group.schoolName).toBe('Primaria Benito Juárez')
  })

  it('rechaza datos inválidos con mensajes en español', async () => {
    const { app } = await setup()
    const res = await request(app).post('/api/groups').send({ schoolName: 'A', grade: '9' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('validation_error')
    const paths = res.body.issues.map((i) => i.path)
    expect(paths).toContain('schoolName')
    expect(paths).toContain('grade')
  })

  it('rechaza JSON mal formado', async () => {
    const { app } = await setup()
    const res = await request(app)
      .post('/api/groups')
      .set('content-type', 'application/json')
      .send('{"schoolName":')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_json')
  })
})

describe('resultados y estadísticas', () => {
  it('guarda resultados anónimos, evita duplicados y agrega estadísticas', async () => {
    const { app } = await setup()
    const created = await request(app)
      .post('/api/groups')
      .send({ schoolName: 'Escuela Primaria 21', grade: '4' })
    const code = created.body.group.code
    const payload = {
      clientId: '7f1c2a8e-3b4d-4c5e-8f9a-0b1c2d3e4f5a',
      groupCode: code.toLowerCase(),
      pre: attempt([true, false, false, true, false], 0),
      post: attempt([true, true, true, true, true], 2),
      casesCorrect: 5,
    }
    const first = await request(app).post('/api/results').send(payload)
    expect(first.status).toBe(201)
    const retry = await request(app).post('/api/results').send(payload)
    expect(retry.status).toBe(200)
    expect(retry.body.duplicate).toBe(true)

    const stats = await request(app).get(`/api/groups/${code}`)
    expect(stats.status).toBe(200)
    expect(stats.body.stats.participants).toBe(1)
    expect(stats.body.stats.preScore).toBe(40)
    expect(stats.body.stats.postScore).toBe(100)
    expect(JSON.stringify(stats.body)).not.toContain(payload.clientId)
  })

  it('responde 404 para un grupo inexistente', async () => {
    const { app } = await setup()
    const res = await request(app).get('/api/groups/ABCD-2345')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('group_not_found')
  })

  it('valida la forma de las respuestas', async () => {
    const { app } = await setup()
    const res = await request(app)
      .post('/api/results')
      .send({
        clientId: 'x',
        groupCode: 'ABCD-2345',
        pre: attempt([true]),
        post: attempt([]),
        casesCorrect: 9,
      })
    expect(res.status).toBe(400)
  })

  it('agrega correctamente varios participantes', () => {
    const stats = aggregate([
      {
        pre: attempt([true, true, false, false, false], 0),
        post: attempt([true, true, true, true, false], 2),
        casesCorrect: 4,
      },
      {
        pre: attempt([false, true, false, false, false], 1),
        post: attempt([true, true, true, true, true], 2),
        casesCorrect: 6,
      },
    ])
    expect(stats.participants).toBe(2)
    expect(stats.preScore).toBe(30)
    expect(stats.postScore).toBe(90)
    expect(stats.perQuestion[0]).toEqual({ pre: 50, post: 100 })
    expect(stats.confidence.post).toEqual([0, 0, 2])
    expect(stats.casesAverage).toBe(5)
    expect(aggregate([]).preScore).toBe(0)
  })
})

describe('POST /api/ask', () => {
  it('responde con la guía verificada cuando no hay IA configurada', async () => {
    const { app } = await setup()
    const res = await request(app).post('/api/ask').send({ question: '¿Cuánto duran los antojos?' })
    expect(res.status).toBe(200)
    expect(res.body.mode).toBe('guide')
    expect(res.body.factIds).toContain('antojos')
  })

  it('prioriza la Línea de la Vida ante señales de crisis', async () => {
    const ai = { ask: vi.fn() }
    const { app } = await setup(ai)
    const res = await request(app)
      .post('/api/ask')
      .send({ question: 'ya no quiero vivir, quiero hacerme daño' })
    expect(res.body.mode).toBe('crisis')
    expect(res.body.answer).toContain('800 911 2000')
    expect(ai.ask).not.toHaveBeenCalled()
  })

  it('usa la IA y vuelve a la guía si la IA falla', async () => {
    const ai = { ask: vi.fn().mockRejectedValue(new Error('boom')) }
    const { app } = await setup(ai)
    const res = await request(app).post('/api/ask').send({ question: 'el vapor es solo agua?' })
    expect(res.body.mode).toBe('guide')
    expect(res.body.notice).toBe('ai_unavailable')
  })

  it('rechaza preguntas vacías o demasiado largas', async () => {
    const { app } = await setup()
    expect((await request(app).post('/api/ask').send({ question: 'a' })).status).toBe(400)
    expect(
      (
        await request(app)
          .post('/api/ask')
          .send({ question: 'a'.repeat(501) })
      ).status,
    ).toBe(400)
  })

  it('aplica límite de solicitudes', async () => {
    const { app } = await setup()
    let last
    for (let i = 0; i < 31; i++)
      last = await request(app).post('/api/ask').send({ question: 'antojos' })
    expect(last.status).toBe(429)
  })
})

describe('cliente de IA', () => {
  it('no se crea sin clave', () => {
    expect(createAiClient({})).toBeNull()
  })

  it('envía la guía en el system prompt y separa las fuentes', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'Espera 10 minutos.\nFUENTES: estrategias, inventado' }],
      }),
    })
    const client = createAiClient({ apiKey: 'test-key', fetchImpl })
    const out = await client.ask('¿Qué hago con un antojo?')
    expect(out).toEqual({ mode: 'ai', answer: 'Espera 10 minutos.', factIds: ['estrategias'] })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.headers['x-api-key']).toBe('test-key')
    const body = JSON.parse(init.body)
    expect(body.system).toContain('GUÍA VERIFICADA')
    expect(body.messages[0].content).toBe('¿Qué hago con un antojo?')
  })

  it('lanza error si el proveedor responde con error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const client = createAiClient({ apiKey: 'k', fetchImpl })
    await expect(client.ask('hola')).rejects.toThrow()
  })

  it('detecta crisis y arma respuestas de guía', () => {
    expect(isCrisis('Pienso en el SUICIDIO')).toBe(true)
    expect(isCrisis('quiero dejar el vape')).toBe(false)
    expect(guideAnswer('xyz qwerty').factIds).toEqual(['linea-vida'])
    expect(parseModelAnswer('Hola').factIds).toEqual([])
  })
})

describe('DeepSeek', () => {
  it('usa /chat/completions con Bearer, system prompt y sin modo de razonamiento', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { role: 'assistant', content: 'Respira profundo.\nFUENTES: estrategias' },
            finish_reason: 'stop',
          },
        ],
      }),
    })
    const client = createAiClient({ provider: 'deepseek', apiKey: 'ds-key', fetchImpl })
    expect(client.provider).toBe('deepseek')
    expect(client.model).toBe('deepseek-flash')
    const out = await client.ask('¿Qué hago con un antojo?')
    expect(out).toEqual({ mode: 'ai', answer: 'Respira profundo.', factIds: ['estrategias'] })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.deepseek.com/chat/completions')
    expect(init.headers.authorization).toBe('Bearer ds-key')
    expect(init.headers['x-api-key']).toBeUndefined()
    const body = JSON.parse(init.body)
    expect(body.model).toBe('deepseek-flash')
    expect(body.thinking).toEqual({ type: 'disabled' })
    expect(body.stream).toBe(false)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toContain('GUÍA VERIFICADA')
    expect(body.messages[1]).toEqual({ role: 'user', content: '¿Qué hago con un antojo?' })
  })

  it('respeta modelo y dirección personalizados', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Hola' } }] }),
    })
    const client = createAiClient({
      provider: 'deepseek',
      apiKey: 'k',
      model: 'deepseek-v4-pro',
      baseUrl: 'https://proxy.example.com/',
      fetchImpl,
    })
    await client.ask('hola')
    expect(fetchImpl.mock.calls[0][0]).toBe('https://proxy.example.com/chat/completions')
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).model).toBe('deepseek-v4-pro')
  })

  it('falla si responde vacío o con error (y el servidor vuelve a la guía)', async () => {
    const empty = createAiClient({
      provider: 'deepseek',
      apiKey: 'k',
      fetchImpl: vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ choices: [{ message: { content: null } }] }),
        }),
    })
    await expect(empty.ask('hola')).rejects.toThrow(/empty/)
    const failing = createAiClient({
      provider: 'deepseek',
      apiKey: 'k',
      fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 402 }),
    })
    await expect(failing.ask('hola')).rejects.toThrow(/402/)
    const { app } = await setup(failing)
    const res = await request(app).post('/api/ask').send({ question: '¿cuánto duran los antojos?' })
    expect(res.body.mode).toBe('guide')
    expect(res.body.notice).toBe('ai_unavailable')
  })

  it('el estado de salud informa el proveedor', async () => {
    const client = createAiClient({ provider: 'deepseek', apiKey: 'k', fetchImpl: vi.fn() })
    const { app } = await setup(client)
    const res = await request(app).get('/api/health')
    expect(res.body).toEqual({ ok: true, ai: true, provider: 'deepseek' })
  })
})

describe('selección de proveedor', () => {
  it('elige según AI_PROVIDER o según la clave disponible', () => {
    expect(resolveAiConfig({}).provider).toBe('anthropic')
    expect(createAiClient(resolveAiConfig({}))).toBeNull()
    expect(resolveAiConfig({ DEEPSEEK_API_KEY: 'd' })).toMatchObject({
      provider: 'deepseek',
      apiKey: 'd',
    })
    expect(resolveAiConfig({ ANTHROPIC_API_KEY: 'a', DEEPSEEK_API_KEY: 'd' }).provider).toBe(
      'anthropic',
    )
    expect(
      resolveAiConfig({
        AI_PROVIDER: 'DeepSeek',
        ANTHROPIC_API_KEY: 'a',
        DEEPSEEK_API_KEY: 'd',
        DEEPSEEK_MODEL: 'deepseek-v4-pro',
      }),
    ).toMatchObject({ provider: 'deepseek', apiKey: 'd', model: 'deepseek-v4-pro' })
    expect(resolveAiConfig({ AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'a' })).toMatchObject({
      provider: 'anthropic',
      apiKey: 'a',
    })
  })

  it('rechaza un proveedor desconocido con un mensaje claro', () => {
    expect(() => resolveAiConfig({ AI_PROVIDER: 'gpt' })).toThrow(/anthropic, deepseek/)
  })

  it('AI_PROVIDER=deepseek sin clave deja la IA desactivada', () => {
    expect(
      createAiClient(resolveAiConfig({ AI_PROVIDER: 'deepseek', ANTHROPIC_API_KEY: 'a' })),
    ).toBeNull()
  })
})

describe('almacenamiento en archivo', () => {
  it('persiste y recarga datos', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'ddh-'))
    const store = await createStore({ dataDir: dir })
    await store.addGroup({ code: 'ABCD-2345', schoolName: 'X', grade: '3' })
    await store.flush()
    const raw = JSON.parse(await readFile(path.join(dir, 'db.json'), 'utf8'))
    expect(raw.groups['ABCD-2345'].schoolName).toBe('X')
    const reloaded = await createStore({ dataDir: dir })
    expect(reloaded.getGroup('ABCD-2345')).not.toBeNull()
  })
})

describe('encabezados de seguridad', () => {
  it('incluye CSP y nosniff y no expone x-powered-by', async () => {
    const { app } = await setup()
    const res = await request(app).get('/api/health')
    expect(res.headers['content-security-policy']).toContain("default-src 'self'")
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
