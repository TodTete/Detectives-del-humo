import { expect, test } from '@playwright/test'
import { CORRECT, answerQuiz, clearStorage, createGroup } from './helpers'

test.describe('Misión detective', () => {
  test.beforeEach(async ({ page }) => clearStorage(page))

  test('flujo completo con código de grupo, envío anónimo y certificado', async ({
    page,
    request,
  }) => {
    const code = await createGroup(request)
    await page.goto('/ninos')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu misión')

    // Validación: sin animal no se puede empezar.
    await page.getByRole('button', { name: 'Empezar la misión' }).click()
    await expect(page.getByText('Elige un animal para tu placa de detective.')).toBeVisible()

    await page.getByRole('radio', { name: 'Búho' }).check()
    await page.getByLabel('Código de grupo (opcional)').fill(code.replace('-', '').toLowerCase())
    await expect(page.getByLabel('Código de grupo (opcional)')).toHaveValue(code)
    await page.getByRole('button', { name: 'Empezar la misión' }).click()

    // Antes: no se puede avanzar sin responder.
    await expect(page).toHaveURL(/\/ninos\/antes$/)
    await page.getByRole('button', { name: 'Siguiente' }).click()
    await expect(page.getByText(/Elige una respuesta/)).toBeVisible()
    await answerQuiz(
      page,
      ['No sé', 'Verdadero', 'No sé', 'Falso', 'Verdadero'],
      'No sabría qué decir',
    )
    await page.getByRole('button', { name: 'Ir a los casos' }).click()

    // Casos: la lupa exige elegir antes.
    await expect(page).toHaveURL(/\/ninos\/casos$/)
    await page.getByRole('button', { name: 'Usar la lupa' }).click()
    await expect(page.getByText(/Primero elige lo que crees/)).toBeVisible()
    for (let i = 0; i < 6; i++) {
      await expect(page.getByText(`Caso ${i + 1} de 6`)).toBeVisible()
      // Elige siempre la primera opción: algunas serán correctas y otras no.
      await page.locator('.case .choice').first().click()
      await page.getByRole('button', { name: 'Usar la lupa' }).click()
      await expect(page.locator('.truth')).toBeVisible()
      await expect(page.locator('.truth__title')).toBeFocused()
      await expect(page.getByText(/Truco descubierto/)).toBeVisible()
      await page
        .getByRole('button', { name: i < 5 ? 'Siguiente caso' : 'Elegir mi frase detective' })
        .click()
    }

    await expect(page).toHaveURL(/\/ninos\/mi-frase$/)
    await page.getByRole('radio', { name: /Ya sé qué trucos usan/ }).check()
    await page.getByRole('button', { name: 'Ir a las preguntas finales' }).click()

    await expect(page).toHaveURL(/\/ninos\/despues$/)
    await answerQuiz(page, CORRECT, 'Sí, sabría qué decir')
    await page.getByRole('button', { name: 'Ver mi certificado' }).click()

    await expect(page).toHaveURL(/\/ninos\/resultado$/)
    await expect(page.getByRole('heading', { name: '¡Misión cumplida!' })).toBeVisible()
    await expect(page.locator('.compare')).toContainText('1 de 5')
    await expect(page.locator('.compare')).toContainText('5 de 5')
    await expect(page.getByText(/Tus resultados llegaron a tu grupo/)).toBeVisible()
    await expect(page.locator('.certificate__name')).toContainText('Detective Búho')

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar certificado' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('certificado-detective-del-humo.png')

    // El panel escolar recibe un resultado agregado.
    await page.goto(`/escuelas/grupo/${code}`)
    await expect(page.locator('.stat').first()).toContainText('1')
    await expect(page.getByText('Aciertos después')).toBeVisible()

    // Repaso de casos desde el resultado.
    await page.goto('/ninos/resultado')
    await page.getByRole('button', { name: 'Repasar los casos' }).click()
    await expect(page.getByRole('heading', { name: 'Repaso de los casos' })).toBeVisible()
    await expect(page.getByText('Caso 1 de 6')).toBeVisible()
  })

  test('no permite saltarse pasos y conserva el avance al recargar', async ({ page }) => {
    await page.goto('/ninos/resultado')
    await expect(page).toHaveURL(/\/ninos$/)
    await page.getByRole('radio', { name: 'Gato' }).check()
    await page.getByRole('button', { name: 'Empezar la misión' }).click()
    await expect(page).toHaveURL(/\/ninos\/antes$/)
    await page.goto('/ninos/casos')
    await expect(page).toHaveURL(/\/ninos\/antes$/)
    await page.reload()
    await expect(page).toHaveURL(/\/ninos\/antes$/)
    await page.goto('/ninos')
    await expect(page.getByText('Tienes una misión a medias en este dispositivo')).toBeVisible()
    await page.getByRole('button', { name: 'Empezar de nuevo' }).click()
    const dialog = page.getByRole('dialog', { name: '¿Empezar una misión nueva?' })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Empezar de nuevo' })).toBeFocused()
    await page.getByRole('button', { name: 'Empezar de nuevo' }).click()
    await page.getByRole('button', { name: 'Sí, empezar de nuevo' }).click()
    await expect(page.getByRole('radio', { name: 'Gato' })).toBeVisible()
  })

  test('rechaza un código de grupo inexistente', async ({ page }) => {
    await page.goto('/ninos')
    await page.getByRole('radio', { name: 'Conejo' }).check()
    await page.getByLabel('Código de grupo (opcional)').fill('ZZZZ-9999')
    await page.getByRole('button', { name: 'Empezar la misión' }).click()
    await expect(page.getByText(/No encontramos ese código/)).toBeVisible()
    await expect(page.getByLabel('Código de grupo (opcional)')).toBeFocused()
    await page.getByLabel('Código de grupo (opcional)').fill('ABC')
    await page.getByRole('button', { name: 'Empezar la misión' }).click()
    await expect(page.getByText(/El código tiene 8 letras y números/)).toBeVisible()
  })

  test('sin internet, los resultados quedan en cola y se envían al reconectar', async ({
    page,
    request,
    context,
  }) => {
    const code = await createGroup(request, 'Primaria Sin Red')
    await page.goto('/ninos')
    await page.getByRole('radio', { name: 'Tortuga' }).check()
    await page.getByLabel('Código de grupo (opcional)').fill(code)
    await page.getByRole('button', { name: 'Empezar la misión' }).click()
    await answerQuiz(page, CORRECT, 'Más o menos')
    await page.getByRole('button', { name: 'Ir a los casos' }).click()
    for (let i = 0; i < 6; i++) {
      await page.locator('.case .choice').nth(1).click()
      await page.getByRole('button', { name: 'Usar la lupa' }).click()
      await page
        .getByRole('button', { name: i < 5 ? 'Siguiente caso' : 'Elegir mi frase detective' })
        .click()
    }
    await page.getByRole('radio', { name: /No, gracias/ }).check()
    await page.getByRole('button', { name: 'Ir a las preguntas finales' }).click()
    await answerQuiz(page, CORRECT, 'Sí, sabría qué decir')

    await context.setOffline(true)
    await page.getByRole('button', { name: 'Ver mi certificado' }).click()
    await expect(page.getByText('Se enviarán cuando haya internet')).toBeVisible()
    await expect(page.locator('.pill--offline')).toBeVisible()

    await context.setOffline(false)
    await expect(page.getByText(/Tus resultados llegaron a tu grupo/)).toBeVisible({
      timeout: 15000,
    })
    const stats = await (await request.get(`/api/groups/${code}`)).json()
    expect(stats.stats.participants).toBe(1)
  })
})
