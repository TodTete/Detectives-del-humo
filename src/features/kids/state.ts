import { useSyncExternalStore } from 'react'
import { createPersistentStore } from '../../lib/storage'
import { AVATARS, CASES, type AvatarId } from './data/cases'
import { QUIZ, gradeQuiz, type QuizChoice } from './data/quiz'

export interface QuizAttempt {
  choices: QuizChoice[]
  confidence: 0 | 1 | 2
}

export interface KidsState {
  version: 1
  avatar: AvatarId | null
  badgeNumber: number
  groupCode: string | null
  groupLabel: string | null
  pre: QuizAttempt | null
  caseAnswers: Record<string, number>
  response: string | null
  post: QuizAttempt | null
  clientId: string | null
}

export type KidsStep = 'intro' | 'pre' | 'cases' | 'response' | 'post' | 'done'

export const initialKidsState: KidsState = {
  version: 1,
  avatar: null,
  badgeNumber: 0,
  groupCode: null,
  groupLabel: null,
  pre: null,
  caseAnswers: {},
  response: null,
  post: null,
  clientId: null,
}

function isAttempt(value: unknown): value is QuizAttempt {
  if (!value || typeof value !== 'object') return false
  const v = value as QuizAttempt
  return (
    Array.isArray(v.choices) &&
    v.choices.length === QUIZ.length &&
    v.choices.every((c) => c === 'true' || c === 'false' || c === 'unknown') &&
    [0, 1, 2].includes(v.confidence)
  )
}

export function parseKidsState(raw: unknown): KidsState | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Partial<KidsState>
  if (v.version !== 1) return null
  return {
    ...initialKidsState,
    avatar: v.avatar && (AVATARS as readonly string[]).includes(v.avatar) ? v.avatar : null,
    badgeNumber: typeof v.badgeNumber === 'number' ? v.badgeNumber : 0,
    groupCode: typeof v.groupCode === 'string' ? v.groupCode : null,
    groupLabel: typeof v.groupLabel === 'string' ? v.groupLabel : null,
    pre: isAttempt(v.pre) ? v.pre : null,
    caseAnswers:
      v.caseAnswers && typeof v.caseAnswers === 'object'
        ? Object.fromEntries(
            Object.entries(v.caseAnswers).filter(
              ([id, ans]) => CASES.some((c) => c.id === id) && typeof ans === 'number',
            ),
          )
        : {},
    response: typeof v.response === 'string' ? v.response : null,
    post: isAttempt(v.post) ? v.post : null,
    clientId: typeof v.clientId === 'string' ? v.clientId : null,
  }
}

export const kidsStore = createPersistentStore<KidsState>(
  'ddh.kids.v1',
  initialKidsState,
  parseKidsState,
)

export function useKidsState(): KidsState {
  return useSyncExternalStore(kidsStore.subscribe, kidsStore.get, kidsStore.get)
}

export function currentStep(state: KidsState): KidsStep {
  if (!state.avatar) return 'intro'
  if (!state.pre) return 'pre'
  if (Object.keys(state.caseAnswers).length < CASES.length) return 'cases'
  if (!state.response) return 'response'
  if (!state.post) return 'post'
  return 'done'
}

export const STEP_ORDER: KidsStep[] = ['intro', 'pre', 'cases', 'response', 'post', 'done']

export const STEP_PATHS: Record<KidsStep, string> = {
  intro: '/ninos',
  pre: '/ninos/antes',
  cases: '/ninos/casos',
  response: '/ninos/mi-frase',
  post: '/ninos/despues',
  done: '/ninos/resultado',
}

export function canVisit(state: KidsState, step: KidsStep): boolean {
  return STEP_ORDER.indexOf(step) <= STEP_ORDER.indexOf(currentStep(state))
}

export function casesCorrect(state: KidsState): number {
  return CASES.filter((c) => state.caseAnswers[c.id] === c.correct).length
}

export function scoreAttempt(attempt: QuizAttempt | null): number {
  if (!attempt) return 0
  return gradeQuiz(attempt.choices).filter(Boolean).length
}

export function detectiveName(
  state: Pick<KidsState, 'avatar' | 'badgeNumber'>,
  names: Record<string, string>,
): string {
  if (!state.avatar) return 'Detective'
  return `Detective ${names[state.avatar]} ${String(state.badgeNumber).padStart(2, '0')}`
}
