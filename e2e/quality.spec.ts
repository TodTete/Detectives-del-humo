import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { CORRECT, answerQuiz, clearStorage, expectNoHorizontalOverflow } from './helpers'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function expectAccessible(page: Page, label: string) {
  // Espera a que la vista (cargada de forma diferida) tenga su título.
  await page.locator('h1').first().waitFor()
  const results = await new AxeBuilder({ page: page as never }).withTags(WCAG_TAGS).analyze()
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes
        .map((n) => n.target.join(' '))
        .slice(0, 3)
        .join(' | ')}`,
  )
  expect(summary, `Violaciones de accesibilidad en ${label}`).toEqual([])
}

const STATIC_PAGES = [
  '/',
  '/ninos',
  '/adultos',
  '/adultos/antojo',
  '/adultos/preguntar',
  '/adultos/ayuda',
  '/escuelas',
  '/escuelas/ejemplo',
  '/fuentes',
  '/privacidad',
  '/no-existe',
]

async function seedAdultPlan(page: Page) {
  await page.evaluate(() => {
    const d = new Date()
    const iso = (x: Date) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
    const start = new Date(d)
    start.setDate(start.getDate() - 3)
    const target = new Date(d)
    target.setDate(target.getDate() + 25)
    const entries: Record<string, { count: number; cravingsBeaten: number }> = {}
    for (let i = 0; i < 3; i++) {
      const x = new Date(start)
      x.setDate(x.getDate() + i)
      entries[iso(x)] = { count: 14 - i, cravingsBeaten: i }
    }
    localStorage.setItem(
      'ddh.adult.v1',
      JSON.stringify({
        version: 1,
        profile: {
          product: 'cigarro',
          perDay: 20,
          weeklySpend: 600,
          duration: 'mas-3',
          triggers: ['estres', 'cafe-alcohol'],
          goal: 'dejar',
          targetPerDay: null,
          targetDate: iso(target),
          reasons: 'Mis hijas',
          startDate: iso(start),
        },
        entries,
      }),
    )
  })
}

test.describe('Accesibilidad (axe-core, WCAG 2.2 AA)', () => {
  test('páginas principales sin violaciones', async ({ page }) => {
    await clearStorage(page)
    for (const path of STATIC_PAGES) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectAccessible(page, path)
    }
  })

  test('páginas con datos sin violaciones (también en tema oscuro)', async ({ page }) => {
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme })
      await clearStorage(page)
      await seedAdultPlan(page)
      for (const path of ['/adultos', '/adultos/plan']) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expectAccessible(page, `${path} (${scheme})`)
      }
      await page.goto('/escuelas/ejemplo')
      await expectAccessible(page, `/escuelas/ejemplo (${scheme})`)

      // Recorrido de la misión con validaciones visibles.
      await page.goto('/ninos')
      await page.getByRole('button', { name: 'Empezar la misión' }).click()
      await expectAccessible(page, `/ninos con errores (${scheme})`)
      await page.getByRole('radio', { name: 'Gato' }).check()
      await page.getByRole('button', { name: 'Empezar la misión' }).click()
      await expectAccessible(page, `/ninos/antes (${scheme})`)
      await answerQuiz(page, CORRECT, 'Más o menos')
      await page.getByRole('button', { name: 'Ir a los casos' }).click()
      await expectAccessible(page, `/ninos/casos (${scheme})`)
      for (let i = 0; i < 6; i++) {
        await page.locator('.case .choice').nth(1).click()
        await page.getByRole('button', { name: 'Usar la lupa' }).click()
        if (i === 0) {
          await page.waitForTimeout(1200)
          await expectAccessible(page, `caso revelado (${scheme})`)
        }
        await page
          .getByRole('button', { name: i < 5 ? 'Siguiente caso' : 'Elegir mi frase detective' })
          .click()
      }
      await expectAccessible(page, `/ninos/mi-frase (${scheme})`)
      await page.getByRole('radio', { name: /No, gracias/ }).check()
      await page.getByRole('button', { name: 'Ir a las preguntas finales' }).click()
      await answerQuiz(page, CORRECT, 'Sí, sabría qué decir')
      await page.getByRole('button', { name: 'Ver mi certificado' }).click()
      await page.waitForTimeout(800)
      await expectAccessible(page, `/ninos/resultado (${scheme})`)
    }
  })

  test('formularios con errores sin violaciones', async ({ page }) => {
    await clearStorage(page)
    await page.goto('/adultos')
    await page.getByRole('button', { name: 'Crear mi plan' }).click()
    await expectAccessible(page, 'onboarding con errores')
    await page.goto('/escuelas')
    await page.getByRole('button', { name: 'Crear grupo' }).click()
    await expectAccessible(page, 'escuelas con errores')
  })
})

test.describe('Teclado y foco', () => {
  test('enlace para saltar al contenido y foco al navegar', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Prueba de teclado físico en escritorio')
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Saltar al contenido' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#contenido')).toBeFocused()

    await page.getByRole('link', { name: 'Escuelas', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    await expect(page).toHaveTitle('Escuelas · Detectives del Humo')
  })

  test('se puede completar el cuestionario solo con teclado', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Prueba de teclado físico en escritorio')
    await clearStorage(page)
    await page.goto('/ninos')
    await page.getByRole('radio', { name: 'Gato' }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByRole('radio', { name: 'Gato' })).toBeChecked()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: 'Búho' })).toBeChecked()
    await page.getByRole('button', { name: 'Empezar la misión' }).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/ninos\/antes$/)
    // Al cambiar de vista el foco va al título; desde ahí se continúa con el teclado.
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    await page.getByRole('radio', { name: 'Falso', exact: true }).focus()
    await page.keyboard.press('Space')
    await page.getByRole('button', { name: 'Siguiente' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText('Pregunta 2 de 6')).toBeVisible()
  })

  test('menú móvil se abre, se cierra con Escape y devuelve el foco', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Solo en pantallas angostas')
    await page.goto('/')
    const button = page.getByRole('button', { name: 'Menú' })
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('link', { name: 'Quiero dejarlo' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(button).toBeFocused()
    await button.click()
    await page.getByRole('link', { name: 'Escuelas' }).click()
    await expect(page).toHaveURL(/\/escuelas$/)
    await expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})

test.describe('Diseño adaptable', () => {
  for (const width of [320, 375, 768, 1024, 1440]) {
    test(`sin desbordamiento horizontal a ${width}px`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'Se cubre con anchos explícitos')
      await page.setViewportSize({ width, height: 900 })
      await clearStorage(page)
      await seedAdultPlan(page)
      for (const path of [...STATIC_PAGES, '/adultos/plan']) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expectNoHorizontalOverflow(page)
      }
      await page.goto('/ninos')
      await page.getByRole('radio', { name: 'Gato' }).check()
      await page.getByRole('button', { name: 'Empezar la misión' }).click()
      await expectNoHorizontalOverflow(page)
      await answerQuiz(page, CORRECT, 'Más o menos')
      await page.getByRole('button', { name: 'Ir a los casos' }).click()
      await page.locator('.case .choice').first().click()
      await page.getByRole('button', { name: 'Usar la lupa' }).click()
      await expectNoHorizontalOverflow(page)
    })
  }

  test('los controles táctiles miden al menos 44px', async ({ page }) => {
    for (const path of ['/', '/ninos', '/adultos', '/escuelas']) {
      await page.goto(path)
      const small = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll<HTMLElement>(
            'button, a.btn, .choice, .check, .topnav__link, .subnav__link, .chip',
          ),
        )
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({
            el: el.textContent?.trim().slice(0, 30),
            h: el.getBoundingClientRect().height,
            w: el.getBoundingClientRect().width,
          }))
          .filter((r) => r.h < 44 || r.w < 44),
      )
      expect(small, `controles pequeños en ${path}`).toEqual([])
    }
  })

  test('respeta la preferencia de movimiento reducido', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const duration = await page
      .locator('.hero__smoke--a')
      .evaluate((el) => getComputedStyle(el).animationDuration)
    expect(parseFloat(duration)).toBeLessThan(0.01)
  })
})

test.describe('PWA', () => {
  test('manifiesto válido e iconos disponibles', async ({ page, request }) => {
    await page.goto('/')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(href).toBeTruthy()
    const manifest = await (await request.get(href!)).json()
    expect(manifest.name).toBe('Detectives del Humo')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.lang).toBe('es-MX')
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true)
    for (const icon of manifest.icons) {
      const res = await request.get(`/${icon.src}`)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toBe('image/png')
    }
  })

  test('registra el service worker y funciona sin conexión', async ({ page, context }) => {
    await page.goto('/')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), {
        timeout: 15000,
      })
      .toBe(true)
    await expect(
      page.getByText('La app ya funciona sin internet en este dispositivo.'),
    ).toBeVisible()

    await context.setOffline(true)
    for (const path of ['/ninos', '/adultos/antojo', '/fuentes']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('.pill--offline')).toBeVisible()
    }
    // La misión completa funciona sin conexión.
    await page.goto('/ninos')
    await page.getByRole('radio', { name: 'Gato' }).check()
    await page.getByRole('button', { name: 'Empezar la misión' }).click()
    await expect(page).toHaveURL(/\/ninos\/antes$/)
    // Crear un grupo exige conexión y lo dice.
    await page.goto('/escuelas')
    await expect(page.getByText('Necesitas conexión a internet para crear un grupo.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Crear grupo' })).toBeDisabled()
    await context.setOffline(false)
  })

  test('la API nunca se sirve desde caché y responde con encabezados seguros', async ({
    request,
  }) => {
    const res = await request.get('/api/health')
    expect(res.headers()['cache-control']).toBe('no-store')
    expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
    const sw = await request.get('/sw.js')
    expect(sw.headers()['cache-control']).toBe('no-cache')
    const missing = await request.get('/api/nada')
    expect(missing.status()).toBe(404)
  })
})

test('sin errores de consola ni violaciones de CSP en los recorridos principales', async ({
  page,
}) => {
  const problems: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().startsWith('CSP')) problems.push(m.text())
  })
  page.on('pageerror', (e) => problems.push(e.message))
  await page.addInitScript(() =>
    document.addEventListener('securitypolicyviolation', (e) =>
      console.warn(`CSP ${e.violatedDirective} ${e.blockedURI}`),
    ),
  )
  await clearStorage(page)
  for (const path of STATIC_PAGES) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  // Validación de formularios (usa zod) sin eval.
  await page.goto('/adultos')
  await page.getByRole('button', { name: 'Crear mi plan' }).click()
  await page.goto('/escuelas')
  await page.getByRole('button', { name: 'Crear grupo' }).click()
  await page.waitForTimeout(300)
  expect(problems).toEqual([])
})
