import { chromium } from '@playwright/test'
const out = process.argv[2]
const base = 'http://localhost:8787'
const browser = await chromium.launch()
const errors = []
for (const [name, vp] of [
  ['mobile', { width: 375, height: 812 }],
  ['desktop', { width: 1280, height: 860 }],
]) {
  const page = await browser.newPage({ viewport: vp })
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning')
      errors.push(`${name} ${m.type()}: ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`${name} pageerror: ${e.message}`))
  for (const [slug, path] of [
    ['home', '/'],
    ['kids', '/ninos'],
    ['adults', '/adultos'],
    ['school', '/escuelas'],
    ['demo', '/escuelas/ejemplo'],
  ]) {
    await page.goto(base + path, { waitUntil: 'networkidle' })
    await page.screenshot({ path: `${out}/${name}-${slug}.png`, fullPage: true })
  }
  await page.close()
}
console.log(errors.join('\n') || 'no console errors')
await browser.close()
