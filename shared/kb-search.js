// Búsqueda por palabras clave sobre la guía verificada.
// Se comparte entre el cliente (respuesta sin conexión) y el servidor (contexto para la IA).

const STOPWORDS = new Set([
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'de',
  'del',
  'y',
  'o',
  'a',
  'en',
  'es',
  'que',
  'por',
  'para',
  'con',
  'me',
  'mi',
  'se',
  'si',
  'lo',
  'al',
  'no',
  'su',
  'te',
  'yo',
  'tu',
  'mas',
  'pero',
  'como',
  'cuando',
])

/** @param {string} text */
export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
}

/** @param {string} text */
export function tokenize(text) {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
}

/**
 * @param {string} query
 * @param {Array<{id: string, title: string, text: string, keywords: string[]}>} facts
 * @param {number} [limit]
 */
export function searchFacts(query, facts, limit = 3) {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []
  const scored = facts.map((fact) => {
    const keywords = fact.keywords.map(normalize)
    const titleTokens = tokenize(fact.title)
    let score = 0
    for (const token of tokens) {
      for (const kw of keywords) {
        if (kw === token) score += 3
        else if (token.length >= 4 && (kw.startsWith(token) || token.startsWith(kw))) score += 2
      }
      if (titleTokens.includes(token)) score += 1
    }
    return { fact, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.fact)
}
