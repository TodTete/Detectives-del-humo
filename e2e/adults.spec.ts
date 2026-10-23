import { expect, test } from '@playwright/test'
import { clearStorage } from './helpers'

async function createPlan(page: import('@playwright/test').Page) {
  await page.goto('/adultos')
  await page.getByRole('radio', { name: 'Vapeador o cigarro electrónico' }).check()
  await page.getByLabel('¿Cuántas veces al día lo usas, más o menos?').fill('20')
  await page.getByLabel('¿Cuánto gastas a la semana?').fill('280')
  await page.getByRole('radio', { name: 'De 1 a 3 años' }).check()
  await page.getByRole('checkbox', { name: 'Cuando siento estrés o ansiedad' }).check()
  await page.getByRole('checkbox', { name: 'Después de comer' }).check()
  await page.getByRole('radio', { name: /Dejarlo por completo/ }).check()
  await page.getByLabel('¿Por qué quieres hacerlo? (opcional)').fill('Quiero correr sin cansarme')
  await page.getByRole('button', { name: 'Crear mi plan' }).click()
}

test.describe('Plan para personas adultas', () => {
  test.beforeEach(async ({ page }) => clearStorage(page))

  test('valida el formulario y enfoca el primer error', async ({ page }) => {
    await page.goto('/adultos')
    await page.getByRole('button', { name: 'Crear mi plan' }).click()
    await expect(page.getByRole('alert')).toContainText('Revisa')
    await expect(page.getByText('Elige qué consumes.')).toBeVisible()
    await expect(
      page.getByText('Elige al menos un momento en el que te dan más ganas.'),
    ).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Vapeador o cigarro electrónico' })).toBeFocused()

    await page.getByRole('radio', { name: 'Bolsas de nicotina' }).check()
    await page.getByLabel('¿Cuántas bolsas usas al día?').fill('10')
    await page.getByRole('radio', { name: /Reducir primero/ }).check()
    await page.getByLabel('¿A cuántas bolsas al día quieres llegar?').fill('12')
    await page.getByRole('button', { name: 'Crear mi plan' }).click()
    await expect(page.getByText(/Tu meta debe ser menor a lo que usas hoy/)).toBeVisible()
  })

  test('crea el plan, registra el día, supera un antojo y edita registros', async ({ page }) => {
    await createPlan(page)
    await expect(page).toHaveURL(/\/adultos\/plan$/)
    await expect(page.getByText('Plan creado. Hoy empieza la primera semana.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mi plan para dejarlo' })).toBeVisible()
    await expect(page.locator('.week')).toHaveCount(4)
    await expect(page.locator('.week--current')).toContainText('15 veces')
    await expect(page.locator('.week').first()).toContainText('estrés')

    await page.getByRole('link', { name: 'Hoy' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hoy tu límite es 15 veces')
    await expect(page.getByText('Tus razones: “Quiero correr sin cansarme”')).toBeVisible()
    const input = page.getByLabel(/¿Cuántas veces usaste hoy\?/)
    await page.getByRole('button', { name: 'Sumar una vez' }).click()
    await expect(input).toHaveValue('1')
    await input.fill('12')
    await page.getByRole('button', { name: 'Guardar registro' }).click()
    await expect(page.getByText('Vas dentro de tu límite: 12 de 15.')).toBeVisible()
    await expect(page.locator('.stat').nth(1)).toContainText('$16')
    await expect(page.locator('.stat').first()).toContainText('1 día')

    // Tabla alternativa de la gráfica.
    await page.getByRole('button', { name: 'Tabla' }).click()
    await expect(page.getByRole('table')).toContainText('Límite del día')

    // Editar y borrar con confirmación.
    await page.getByRole('button', { name: /Editar registro del/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Editar registro' })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/¿Cuántas veces usaste/).fill('18')
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByText(/Hoy pasaste tu límite \(18 de 15\)/)).toBeVisible()
    await page.getByRole('button', { name: /Borrar registro del/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Borrar registro' }).click()
    await expect(page.locator('.history')).toHaveCount(0)

    // Antojo superado.
    await page.getByRole('link', { name: 'Tengo ganas' }).first().click()
    await page.getByRole('button', { name: 'Empezar 10 minutos' }).click()
    await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible()
    await page.getByRole('button', { name: 'Superé el antojo' }).click()
    await expect(page.getByText('Antojo superado. Hoy llevas 1.')).toBeVisible()
    await page.getByRole('link', { name: 'Hoy' }).click()
    await expect(page.locator('.stat').nth(2)).toContainText('1')

    // Persistencia al recargar.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hoy tu límite es 15 veces')
  })

  test('edita y borra el plan completo', async ({ page }) => {
    await createPlan(page)
    await page.getByRole('button', { name: 'Editar mi plan' }).click()
    await page.getByRole('radio', { name: /Reducir primero/ }).check()
    await page.getByLabel('¿A cuántas veces al día quieres llegar?').fill('5')
    await page.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(page.getByRole('heading', { name: 'Mi plan para reducir' })).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar mis datos' }).click()
    expect((await downloadPromise).suggestedFilename()).toMatch(
      /^mi-plan-detectives-del-humo-.*\.json$/,
    )
    await page.getByRole('button', { name: 'Borrar mi plan y registros' }).click()
    await page.getByRole('button', { name: 'Borrar todo' }).click()
    await expect(page).toHaveURL(/\/adultos$/)
    await expect(
      page.getByRole('heading', { name: 'Armemos tu plan para dejar la nicotina' }),
    ).toBeVisible()
  })

  test('el asistente responde con la guía verificada, con y sin conexión', async ({
    page,
    context,
  }) => {
    await page.goto('/adultos/preguntar')
    await page.getByRole('button', { name: '¿Cuánto duran los antojos?' }).click()
    await expect(page.locator('.answer').first()).toContainText('Los primeros tres días')
    await expect(page.locator('.answer').first()).toContainText('Respuesta de la guía verificada')
    await expect(page.locator('.answer__q').first()).toBeFocused()

    await page.getByLabel('Tu pregunta').fill('a')
    await page.getByRole('button', { name: 'Preguntar' }).click()
    await expect(page.getByText('Escribe una pregunta un poco más larga.')).toBeVisible()

    await page.getByLabel('Tu pregunta').fill('ya no quiero vivir')
    await page.getByRole('button', { name: 'Preguntar' }).click()
    await expect(page.locator('.answer--crisis')).toContainText('800 911 2000')
    await expect(page.getByRole('link', { name: 'Llamar a la Línea de la Vida' })).toHaveAttribute(
      'href',
      'tel:8009112000',
    )

    await context.setOffline(true)
    await page.getByLabel('Tu pregunta').fill('¿es legal vender vapeadores?')
    await page.getByRole('button', { name: 'Preguntar' }).click()
    await expect(page.locator('.answer').first()).toContainText('(sin conexión)')
    await expect(page.locator('.answer').first()).toContainText('Constitución')
    await context.setOffline(false)
  })

  test('si el servidor falla, responde con la guía local', async ({ page }) => {
    await page.route('**/api/ask', (route) =>
      route.fulfill({
        status: 500,
        body: '{"error":"server_error","message":"x"}',
        contentType: 'application/json',
      }),
    )
    await page.goto('/adultos/preguntar')
    await page.getByRole('button', { name: '¿El vapor es solo agua?' }).click()
    await expect(page.locator('.answer').first()).toContainText(
      'No pudimos conectar con el asistente',
    )
    await expect(page.locator('.answer').first()).toContainText('metales pesados')
  })

  test('la ayuda tiene enlaces para llamar', async ({ page }) => {
    await page.goto('/adultos/ayuda')
    await expect(page.getByRole('link', { name: 'Llamar al 800 911 2000' })).toHaveAttribute(
      'href',
      'tel:8009112000',
    )
    await expect(page.getByRole('link', { name: 'Llamar al 911' })).toHaveAttribute(
      'href',
      'tel:911',
    )
  })
})
