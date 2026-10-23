import { chromium } from '@playwright/test'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 320, height: 800 } })
const check = async (label) => {
  const r = await p.evaluate(() => {
    const cw = document.documentElement.clientWidth
    const o = document.documentElement.scrollWidth - cw
    const wide = [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().right > cw + 1)
      .slice(0, 5)
      .map((e) => `${e.tagName}.${e.className}:${Math.round(e.getBoundingClientRect().right)}`)
    return { o, wide }
  })
  console.log(label, JSON.stringify(r))
}
await p.goto('http://localhost:8787/ninos')
await p.evaluate(() => localStorage.clear())
await p.reload()
await p.getByRole('radio', { name: 'Gato' }).check()
await p.getByRole('button', { name: 'Empezar la misión' }).click()
await p.waitForURL(/antes/)
await check('antes')
for (const a of ['Falso', 'Verdadero', 'Verdadero', 'Verdadero', 'Falso']) {
  await p.getByRole('radio', { name: a, exact: true }).check()
  await p.getByRole('button', { name: 'Siguiente' }).click()
}
await p.getByRole('radio', { name: 'Más o menos' }).check()
await p.getByRole('button', { name: 'Ir a los casos' }).click()
await p.waitForURL(/casos/)
await check('casos')
await p.locator('.case .choice').first().click()
await p.getByRole('button', { name: 'Usar la lupa' }).click()
await p.waitForTimeout(1500)
await check('revelado')
await p.screenshot({ path: process.argv[2], fullPage: true })
await b.close()
