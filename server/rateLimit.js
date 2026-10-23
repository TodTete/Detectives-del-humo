/**
 * Límite de solicitudes en memoria por IP (ventana fija). Protege la API de abuso básico.
 * @param {{ windowMs: number, max: number }} options
 */
export function rateLimit({ windowMs, max }) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const hits = new Map()
  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip ?? 'unknown'
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
      }
      return next()
    }
    entry.count += 1
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return res.status(429).json({
        error: 'rate_limited',
        message: 'Hiciste muchas solicitudes seguidas. Espera unos minutos e inténtalo de nuevo.',
      })
    }
    next()
  }
}
