import { expect, type APIRequestContext, type Page } from '@playwright/test'

export async function createGroup(
  request: APIRequestContext,
  schoolName = 'Primaria Prueba E2E',
  grade = '5',
) {
  const res = await request.post('/api/groups', { data: { schoolName, grade, groupLabel: 'A' } })
  expect(res.status()).toBe(201)
  const body = (await res.json()) as { group: { code: string } }
  return body.group.code
}

/** Las respuestas correctas del cuestionario, en orden. */
export const CORRECT = ['Falso', 'Verdadero', 'Verdadero', 'Verdadero', 'Falso']

export async function answerQuiz(page: Page, answers: string[], confidence: string) {
  for (const answer of answers) {
    await page.getByRole('radio', { name: answer, exact: true }).check()
    await page.getByRole('button', { name: 'Siguiente' }).click()
  }
  await page.getByRole('radio', { name: confidence }).check()
}

/** Página sin desplazamiento horizontal. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, 'la página no debe desplazarse horizontalmente').toBeLessThanOrEqual(0)
}

export async function clearStorage(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
}
