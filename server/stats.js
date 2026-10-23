import { QUESTION_COUNT } from './schemas.js'

const pct = (n, d) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10)

/**
 * Agrega resultados anónimos de un grupo. Nunca devuelve resultados individuales.
 * @param {Array<{ pre: {answers: boolean[], confidence: number}, post: {answers: boolean[], confidence: number}, casesCorrect: number }>} results
 */
export function aggregate(results) {
  const n = results.length
  const perQuestion = Array.from({ length: QUESTION_COUNT }, (_, i) => {
    const pre = results.filter((r) => r.pre.answers[i]).length
    const post = results.filter((r) => r.post.answers[i]).length
    return { pre: pct(pre, n), post: pct(post, n) }
  })
  const sumCorrect = (key) =>
    results.reduce((acc, r) => acc + r[key].answers.filter(Boolean).length, 0)
  const confidence = (key) =>
    [0, 1, 2].map((level) => results.filter((r) => r[key].confidence === level).length)
  return {
    participants: n,
    preScore: pct(sumCorrect('pre'), n * QUESTION_COUNT),
    postScore: pct(sumCorrect('post'), n * QUESTION_COUNT),
    perQuestion,
    confidence: { pre: confidence('pre'), post: confidence('post') },
    casesAverage:
      n === 0 ? 0 : Math.round((results.reduce((a, r) => a + r.casesCorrect, 0) / n) * 10) / 10,
  }
}
