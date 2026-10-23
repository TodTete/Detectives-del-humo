import { describe, expect, it } from 'vitest'
import { CASES } from './data/cases'
import { QUIZ, gradeQuiz } from './data/quiz'
import {
  canVisit,
  casesCorrect,
  currentStep,
  detectiveName,
  initialKidsState,
  parseKidsState,
  scoreAttempt,
} from './state'

const allCorrect = QUIZ.map((q) => q.answer)

describe('cuestionario', () => {
  it('califica respuestas; "No sé" cuenta como incorrecta', () => {
    expect(gradeQuiz(allCorrect)).toEqual([true, true, true, true, true])
    expect(gradeQuiz(['unknown', 'true', 'false', 'true', 'false'])).toEqual([
      false,
      true,
      false,
      true,
      true,
    ])
    expect(scoreAttempt({ choices: allCorrect, confidence: 1 })).toBe(5)
    expect(scoreAttempt(null)).toBe(0)
  })

  it('cada caso tiene una opción correcta válida y su fuente', () => {
    for (const c of CASES) {
      expect(c.options[c.correct]).toBeDefined()
      expect(c.sourceId).toBeTruthy()
    }
  })
})

describe('avance de la misión', () => {
  it('avanza paso a paso y no permite saltarse pasos', () => {
    let s = { ...initialKidsState }
    expect(currentStep(s)).toBe('intro')
    s = { ...s, avatar: 'gato', badgeNumber: 7 }
    expect(currentStep(s)).toBe('pre')
    expect(canVisit(s, 'cases')).toBe(false)
    s = { ...s, pre: { choices: allCorrect, confidence: 0 } }
    expect(currentStep(s)).toBe('cases')
    s = { ...s, caseAnswers: Object.fromEntries(CASES.map((c) => [c.id, c.correct])) }
    expect(casesCorrect(s)).toBe(6)
    expect(currentStep(s)).toBe('response')
    s = { ...s, response: 'no-gracias' }
    expect(currentStep(s)).toBe('post')
    s = { ...s, post: { choices: allCorrect, confidence: 2 } }
    expect(currentStep(s)).toBe('done')
    expect(canVisit(s, 'pre')).toBe(true)
    expect(detectiveName(s, { gato: 'Gato' })).toBe('Detective Gato 07')
  })

  it('ignora datos guardados inválidos', () => {
    expect(parseKidsState({ version: 9 })).toBeNull()
    const parsed = parseKidsState({
      version: 1,
      avatar: 'dragón',
      pre: { choices: ['true'], confidence: 1 },
      caseAnswers: { sabores: 1, inventado: 2 },
    })
    expect(parsed?.avatar).toBeNull()
    expect(parsed?.pre).toBeNull()
    expect(parsed?.caseAnswers).toEqual({ sabores: 1 })
  })
})
