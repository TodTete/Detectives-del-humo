// Genera los iconos PNG de la PWA a partir del logotipo SVG usando Chromium (Playwright).
import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const svg = await readFile(path.join(root, 'public/favicon.svg'), 'utf8')
const icons = [
  { file: 'pwa-192.png', size: 192, padding: 0.1, bg: '#F4F7FC' },
  { file: 'pwa-512.png', size: 512, padding: 0.1, bg: '#F4F7FC' },
  // Íconos "maskable": el sistema puede recortarlos en círculo, así que dejan más margen.
  { file: 'pwa-maskable-512.png', size: 512, padding: 0.22, bg: '#F2DA3A' },
  { file: 'apple-touch-icon.png', size: 180, padding: 0.12, bg: '#F4F7FC' },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const icon of icons) {
  const inner = Math.round(icon.size * (1 - icon.padding * 2))
  await page.setViewportSize({ width: icon.size, height: icon.size })
  await page.setContent(
    `<html><body style="margin:0;width:${icon.size}px;height:${icon.size}px;display:grid;place-items:center;background:${icon.bg}">
      <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
    </body></html>`,
  )
  await page.screenshot({ path: path.join(root, 'public', icon.file), omitBackground: false })
  console.log('icono', icon.file)
}
await browser.close()
