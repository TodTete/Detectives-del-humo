export const GROUP_CODE_REGEX = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/

/** Convierte lo que se escribe en el formato ABCD-2345 (mayúsculas y guion). */
export function normalizeCode(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4, 8)}` : clean
}
