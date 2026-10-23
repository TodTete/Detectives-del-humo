import { useSyncExternalStore } from 'react'
import { createPersistentStore } from '../../lib/storage'
import { today } from '../../lib/dates'
import { profileShape, type Profile, type ProfileInput } from './schema'
import type { DayEntry, Entries } from './stats'

export interface AdultState {
  version: 1
  profile: Profile | null
  entries: Entries
}

const initial: AdultState = { version: 1, profile: null, entries: {} }

function parseEntries(raw: unknown): Entries {
  if (!raw || typeof raw !== 'object') return {}
  const out: Entries = {}
  for (const [date, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !value || typeof value !== 'object') continue
    const v = value as Partial<DayEntry>
    const count = typeof v.count === 'number' && v.count >= 0 ? Math.floor(v.count) : null
    const cravingsBeaten =
      typeof v.cravingsBeaten === 'number' && v.cravingsBeaten >= 0
        ? Math.floor(v.cravingsBeaten)
        : 0
    if (count === null && cravingsBeaten === 0) continue
    out[date] = { count, cravingsBeaten }
  }
  return out
}

export function parseAdultState(raw: unknown): AdultState | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Partial<AdultState>
  if (v.version !== 1) return null
  let profile: Profile | null = null
  if (v.profile && typeof v.profile === 'object' && typeof v.profile.startDate === 'string') {
    // La validación de fechas depende de "hoy"; aquí solo se valida la forma de los datos guardados.
    const shape = profileShape.safeParse(v.profile)
    if (shape.success) profile = { ...shape.data, startDate: v.profile.startDate }
  }
  return { version: 1, profile, entries: parseEntries(v.entries) }
}

export const adultStore = createPersistentStore<AdultState>(
  'ddh.adult.v1',
  initial,
  parseAdultState,
)

export function useAdultState(): AdultState {
  return useSyncExternalStore(adultStore.subscribe, adultStore.get, adultStore.get)
}

export function saveProfile(input: ProfileInput, keepStart = false) {
  adultStore.set((prev) => ({
    ...prev,
    profile: {
      ...input,
      targetPerDay: input.goal === 'dejar' ? null : input.targetPerDay,
      startDate: keepStart && prev.profile ? prev.profile.startDate : today(),
    },
  }))
}

export function logCount(date: string, count: number) {
  adultStore.set((prev) => ({
    ...prev,
    entries: {
      ...prev.entries,
      [date]: { count, cravingsBeaten: prev.entries[date]?.cravingsBeaten ?? 0 },
    },
  }))
}

export function addCravingBeaten(date: string) {
  adultStore.set((prev) => {
    const existing = prev.entries[date]
    return {
      ...prev,
      entries: {
        ...prev.entries,
        [date]: {
          count: existing?.count ?? null,
          cravingsBeaten: (existing?.cravingsBeaten ?? 0) + 1,
        },
      },
    }
  })
}

/** Borra el registro de consumo del día (conserva los antojos superados). */
export function removeEntry(date: string) {
  adultStore.set((prev) => {
    const entries = { ...prev.entries }
    const existing = entries[date]
    if (existing && existing.cravingsBeaten > 0) entries[date] = { ...existing, count: null }
    else delete entries[date]
    return { ...prev, entries }
  })
}

export function resetAdultData() {
  adultStore.reset()
}
