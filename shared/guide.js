// Respuestas sin IA a partir de la guía verificada. Compartido por cliente y servidor.
import { normalize, searchFacts } from './kb-search.js'

export const LINEA_VIDA =
  'Línea de la Vida: 800 911 2000 (gratuita, 24 horas, los 365 días del año).'

export const CRISIS_ANSWER = `Lo que cuentas es importante y no tienes que enfrentarlo a solas. Habla ahora con alguien de confianza o llama a la ${LINEA_VIDA} Si estás en peligro inmediato, llama al 911.`

const CRISIS_PATTERNS = [
  'suicid',
  'matarme',
  'quitarme la vida',
  'hacerme dano',
  'lastimarme',
  'no quiero vivir',
  'morirme',
]

/** @param {string} question */
export function isCrisis(question) {
  const q = normalize(question)
  return CRISIS_PATTERNS.some((p) => q.includes(p))
}

/**
 * @param {string} question
 * @param {Array<{id: string, title: string, text: string, keywords: string[]}>} facts
 */
export function guideAnswer(question, facts) {
  if (isCrisis(question)) {
    return { mode: 'crisis', answer: CRISIS_ANSWER, factIds: ['linea-vida'] }
  }
  const matches = searchFacts(question, facts, 2)
  if (matches.length === 0) {
    return {
      mode: 'guide',
      answer: `No encontré esa respuesta en la guía verificada. Para dudas sobre tu salud consulta a un profesional o llama a la ${LINEA_VIDA}`,
      factIds: ['linea-vida'],
    }
  }
  return {
    mode: 'guide',
    answer: matches.map((m) => m.text).join('\n\n'),
    factIds: matches.map((m) => m.id),
  }
}
