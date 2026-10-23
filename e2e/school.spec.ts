import { expect, test } from '@playwright/test'

test.describe('Panel escolar', () => {
  test('crea un grupo, muestra el código y el panel vacío', async ({
    page,
    context,
    browserName,
  }) => {
    await page.goto('/escuelas')
    await page.getByRole('button', { name: 'Crear grupo' }).click()
    await expect(
      page.getByText('Escribe el nombre de la escuela (mínimo 3 caracteres).'),
    ).toBeVisible()
    await expect(page.getByText('Elige el grado del grupo.')).toBeVisible()

    await page.getByLabel('Nombre de la escuela').fill('Primaria Vicente Guerrero')
    await page.getByRole('radio', { name: '4.º' }).check()
    await page.getByLabel('Grupo (opcional)').fill('B')
    await page.getByRole('button', { name: 'Crear grupo' }).click()
    const heading = page.getByRole('heading', {
      name: /Grupo creado: Primaria Vicente Guerrero, 4\.º B/,
    })
    await expect(heading).toBeVisible()
    await expect(heading).toBeFocused()
    const code = (await page.locator('.created__code').textContent())?.trim() ?? ''
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/)

    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      await page.getByRole('button', { name: 'Copiar código' }).click()
      await expect(page.getByText('Código copiado.')).toBeVisible()
    }

    await page.getByRole('link', { name: 'Ver resultados del grupo' }).click()
    await expect(page.getByRole('heading', { name: 'Todavía no hay resultados' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Descargar CSV' })).toBeDisabled()
  })

  test('valida códigos y maneja grupos inexistentes', async ({ page }) => {
    await page.goto('/escuelas')
    await page.getByLabel('Código del grupo').fill('AB')
    await page.getByRole('button', { name: 'Ver resultados' }).click()
    await expect(page.getByText('Escribe el código completo, por ejemplo ABCD-2345.')).toBeVisible()
    await page.getByLabel('Código del grupo').fill('zzzz9999')
    await page.getByRole('button', { name: 'Ver resultados' }).click()
    await expect(page).toHaveURL(/\/escuelas\/grupo\/ZZZZ-9999$/)
    await expect(page.getByRole('heading', { name: 'No encontramos ese grupo' })).toBeVisible()

    await page.goto('/escuelas/grupo/hola')
    await expect(
      page.getByRole('heading', { name: 'Ese código no tiene el formato correcto' }),
    ).toBeVisible()
  })

  test('muestra error recuperable si el servidor no responde', async ({ page }) => {
    let fail = true
    await page.route('**/api/groups/ABCD-2345', (route) =>
      fail
        ? route.abort('failed')
        : route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: '{"error":"group_not_found","message":"No existe un grupo con ese código."}',
          }),
    )
    await page.goto('/escuelas/grupo/ABCD-2345')
    await expect(
      page.getByRole('heading', { name: 'No se pudieron cargar los resultados' }),
    ).toBeVisible()
    fail = false
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await expect(page.getByRole('heading', { name: 'No encontramos ese grupo' })).toBeVisible()
  })

  test('el panel de ejemplo está rotulado, tiene tabla alternativa y CSV', async ({ page }) => {
    await page.goto('/escuelas/ejemplo')
    await expect(page.getByText('Estos son datos de ejemplo')).toBeVisible()
    await page.getByRole('button', { name: 'Tabla' }).first().click()
    await expect(page.getByRole('table').first()).toContainText(
      'Lo que sale de un vapeador es solo vapor de agua.',
    )
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar CSV' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('resultados-EJEM-PL02.csv')
  })
})
