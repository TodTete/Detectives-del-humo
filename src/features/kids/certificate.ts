import { CASES } from './data/cases'

export interface CertificateData {
  name: string
  tricks: string[]
  phrase: string
  date: string
}

const W = 1080
const H = 1350

function readToken(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Dibuja el certificado en un canvas (formato vertical 4:5, ideal para compartir). */
export async function drawCertificate(canvas: HTMLCanvasElement, data: CertificateData) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  try {
    await Promise.all([
      document.fonts.load('800 80px "Bricolage Grotesque"'),
      document.fonts.load('700 40px "Atkinson Hyperlegible"'),
      document.fonts.load('400 34px "Atkinson Hyperlegible"'),
    ])
  } catch {
    // Si las fuentes no cargan, se usan las del sistema.
  }
  // Siempre en tema claro: es una imagen para compartir o imprimir.
  const paper = '#f4f7fc'
  const grid = '#dbe4f3'
  const ink = '#1c2147'
  const magenta = '#c21e6e'
  const lemon = readToken('--lemon', '#f2da3a')

  ctx.fillStyle = paper
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = grid
  ctx.lineWidth = 2
  for (let x = 0; x <= W; x += 45) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y <= H; y += 45) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  ctx.strokeStyle = ink
  ctx.lineWidth = 10
  ctx.strokeRect(40, 40, W - 80, H - 80)

  const display = '"Bricolage Grotesque", "Arial Narrow", sans-serif'
  const body = '"Atkinson Hyperlegible", system-ui, sans-serif'

  ctx.fillStyle = ink
  ctx.font = `700 38px ${body}`
  ctx.fillText('Detectives del Humo', 100, 140)

  ctx.font = `800 96px ${display}`
  ctx.fillText('Certificado', 100, 260)
  ctx.fillText('de detective', 100, 360)

  ctx.font = `800 64px ${display}`
  const nameWidth = ctx.measureText(data.name).width
  ctx.fillStyle = lemon
  ctx.fillRect(92, 410, Math.min(W - 184, nameWidth + 40), 84)
  ctx.fillStyle = ink
  ctx.fillText(data.name, 110, 475)

  ctx.font = `400 36px ${body}`
  ctx.fillText(
    `Descubrió ${data.tricks.length} de ${CASES.length} trucos detrás del humo:`,
    100,
    580,
  )

  ctx.font = `700 36px ${body}`
  data.tricks.slice(0, 6).forEach((trick, i) => {
    const y = 650 + i * 62
    ctx.fillStyle = magenta
    ctx.beginPath()
    ctx.arc(118, y - 12, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(110, y - 12)
    ctx.lineTo(116, y - 5)
    ctx.lineTo(127, y - 20)
    ctx.stroke()
    ctx.fillStyle = ink
    ctx.fillText(trick, 152, y)
  })

  ctx.font = `400 34px ${body}`
  ctx.fillText('Mi frase detective:', 100, 1060)
  ctx.font = `700 40px ${body}`
  wrap(ctx, `“${data.phrase}”`, W - 420).forEach((line, i) =>
    ctx.fillText(line, 100, 1115 + i * 50),
  )

  ctx.font = `400 28px ${body}`
  ctx.fillStyle = ink
  ctx.fillText(data.date, 100, H - 90)

  // Sello
  ctx.save()
  ctx.translate(W - 230, H - 250)
  ctx.rotate(-0.18)
  ctx.strokeStyle = magenta
  ctx.fillStyle = magenta
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(0, 0, 130, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 0, 112, 0, Math.PI * 2)
  ctx.stroke()
  ctx.font = `800 40px ${display}`
  ctx.textAlign = 'center'
  ctx.fillText('Caso', 0, -8)
  ctx.fillText('resuelto', 0, 38)
  ctx.restore()
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo crear la imagen'))),
      'image/png',
    )
  })
}
