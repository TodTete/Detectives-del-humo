import compression from 'compression'
import express from 'express'
import { randomInt } from 'node:crypto'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { CRISIS_ANSWER, guideAnswer, isCrisis } from './ai.js'
import { rateLimit } from './rateLimit.js'
import { askSchema, createGroupSchema, groupCodeSchema, resultSchema } from './schemas.js'
import { aggregate } from './stats.js'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCode() {
  const part = () =>
    Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('')
  return `${part()}-${part()}`
}

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

/** @param {import('zod').ZodError} error */
function validationError(res, error) {
  return res.status(400).json({
    error: 'validation_error',
    message: 'Revisa los datos enviados.',
    issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  })
}

/**
 * @param {{
 *   store: Awaited<ReturnType<typeof import('./store.js').createStore>>,
 *   ai?: ReturnType<typeof import('./ai.js').createAiClient>,
 *   staticDir?: string | null,
 *   logger?: Pick<Console, 'error' | 'info'>,
 *   allowedOrigins?: string[],
 * }} deps
 */
export function createApp({
  store,
  ai = null,
  staticDir = null,
  logger = console,
  allowedOrigins = [],
}) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(compression())

  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
    })
    const origin = req.get('origin')
    if (origin && allowedOrigins.includes(origin)) {
      res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        Vary: 'Origin',
      })
      if (req.method === 'OPTIONS') return res.sendStatus(204)
    }
    next()
  })

  const api = express.Router()
  api.use(express.json({ limit: '10kb' }))
  api.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  api.get('/health', (_req, res) => {
    res.json({ ok: true, ai: Boolean(ai), provider: ai?.provider ?? null })
  })

  api.post('/groups', rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), async (req, res, next) => {
    try {
      const parsed = createGroupSchema.safeParse(req.body)
      if (!parsed.success) return validationError(res, parsed.error)
      let code = generateCode()
      while (store.getGroup(code)) code = generateCode()
      const group = { code, ...parsed.data, createdAt: new Date().toISOString() }
      await store.addGroup(group)
      res.status(201).json({ group })
    } catch (error) {
      next(error)
    }
  })

  api.get('/groups/:code', rateLimit({ windowMs: 10 * 60 * 1000, max: 300 }), (req, res) => {
    const parsed = groupCodeSchema.safeParse(req.params.code)
    if (!parsed.success) return validationError(res, parsed.error)
    const group = store.getGroup(parsed.data)
    if (!group) {
      return res.status(404).json({
        error: 'group_not_found',
        message: 'No existe un grupo con ese código. Revisa que esté bien escrito.',
      })
    }
    res.json({ group, stats: aggregate(store.getResults(parsed.data)) })
  })

  api.post(
    '/results',
    rateLimit({ windowMs: 10 * 60 * 1000, max: 200 }),
    async (req, res, next) => {
      try {
        const parsed = resultSchema.safeParse(req.body)
        if (!parsed.success) return validationError(res, parsed.error)
        const { groupCode, clientId, pre, post, casesCorrect } = parsed.data
        if (!store.getGroup(groupCode)) {
          return res.status(404).json({
            error: 'group_not_found',
            message: 'No existe un grupo con ese código.',
          })
        }
        // Solo se guarda la fecha (sin hora) para no permitir identificar a nadie.
        const day = new Date().toISOString().slice(0, 10)
        const { created } = await store.addResult(groupCode, {
          clientId,
          pre,
          post,
          casesCorrect,
          day,
        })
        res.status(created ? 201 : 200).json({ ok: true, duplicate: !created })
      } catch (error) {
        next(error)
      }
    },
  )

  api.post('/ask', rateLimit({ windowMs: 10 * 60 * 1000, max: 30 }), async (req, res) => {
    const parsed = askSchema.safeParse(req.body)
    if (!parsed.success) return validationError(res, parsed.error)
    const { question } = parsed.data
    if (isCrisis(question)) {
      return res.json({ mode: 'crisis', answer: CRISIS_ANSWER, factIds: ['linea-vida'] })
    }
    if (!ai) return res.json(guideAnswer(question))
    try {
      res.json(await ai.ask(question))
    } catch (error) {
      logger.error('[ask] AI request failed:', error instanceof Error ? error.message : error)
      res.json({ ...guideAnswer(question), notice: 'ai_unavailable' })
    }
  })

  api.use((_req, res) => {
    res.status(404).json({ error: 'not_found', message: 'Ruta de API inexistente.' })
  })

  app.use('/api', api)

  if (staticDir && existsSync(staticDir)) {
    app.use(
      express.static(staticDir, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.set('Cache-Control', 'public, max-age=31536000, immutable')
          } else {
            res.set('Cache-Control', 'no-cache')
          }
          if (filePath.endsWith('.webmanifest')) res.type('application/manifest+json')
        },
      }),
    )
    app.get('/{*splat}', (_req, res) => {
      res.set('Cache-Control', 'no-cache')
      res.sendFile(path.join(staticDir, 'index.html'))
    })
  }

  // Manejador de errores: nunca expone detalles internos.
  app.use((error, req, res, _next) => {
    if (error?.type === 'entity.parse.failed') {
      return res
        .status(400)
        .json({ error: 'invalid_json', message: 'El cuerpo de la solicitud no es JSON válido.' })
    }
    if (error?.type === 'entity.too.large') {
      return res
        .status(413)
        .json({ error: 'payload_too_large', message: 'La solicitud es demasiado grande.' })
    }
    logger.error('[server] Unexpected error on', req.method, req.path, error)
    res.status(500).json({
      error: 'server_error',
      message: 'Ocurrió un error en el servidor. Inténtalo más tarde.',
    })
  })

  return app
}
