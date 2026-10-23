/**
 * Acceso seguro a localStorage: puede no existir, estar bloqueado o lleno
 * (modo privado, almacenamiento deshabilitado). Nunca lanza excepciones.
 */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // sin almacenamiento disponible
  }
}

type Listener = () => void

/**
 * Almacén reactivo sencillo sobre localStorage, para usar con useSyncExternalStore.
 * Valida lo leído con `parse` para tolerar datos corruptos o de versiones anteriores.
 */
export function createPersistentStore<T>(
  key: string,
  initial: T,
  parse: (raw: unknown) => T | null,
) {
  let state: T = (() => {
    const raw = readJSON<unknown>(key, null)
    if (raw === null) return initial
    return parse(raw) ?? initial
  })()
  let persisted = true
  const listeners = new Set<Listener>()

  return {
    get: () => state,
    isPersisted: () => persisted,
    set(next: T | ((prev: T) => T)) {
      state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
      persisted = writeJSON(key, state)
      listeners.forEach((l) => l())
    },
    reset() {
      state = initial
      removeKey(key)
      persisted = true
      listeners.forEach((l) => l())
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
