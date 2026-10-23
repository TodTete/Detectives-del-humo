export const LINEA_VIDA: string
export const CRISIS_ANSWER: string
export function isCrisis(question: string): boolean
export function guideAnswer(
  question: string,
  facts: { id: string; title: string; text: string; keywords: string[] }[],
): { mode: 'guide' | 'crisis'; answer: string; factIds: string[] }
