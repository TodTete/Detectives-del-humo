/** Fechas locales en formato AAAA-MM-DD (sin zonas horarias de por medio). */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function addDays(value: string, days: number): string {
  const date = parseISODate(value)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function daysBetween(from: string, to: string): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime()
  return Math.round(ms / 86_400_000)
}

export function today(): string {
  return toISODate(new Date())
}

const longFormatter = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const shortFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

export function formatLong(value: string): string {
  return longFormatter.format(parseISODate(value))
}

export function formatShort(value: string): string {
  return shortFormatter.format(parseISODate(value))
}

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})
export function formatMoney(value: number): string {
  return money.format(value)
}
