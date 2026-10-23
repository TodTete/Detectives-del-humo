import { describe, expect, it } from 'vitest'
import { addDays, today } from '../../lib/dates'
import { buildWeeks, targetForDate, weekCount } from './plan'
import { profileSchema, type Profile } from './schema'
import { computeStats, computeStreak, unitCost } from './stats'
import { parseAdultState } from './store'

const base: Profile = {
  product: 'vapeador',
  perDay: 20,
  weeklySpend: 280,
  duration: '1-3',
  triggers: ['estres', 'comida'],
  goal: 'dejar',
  targetPerDay: null,
  targetDate: '2026-01-29',
  reasons: '',
  startDate: '2026-01-01',
}

describe('plan de reducción', () => {
  it('baja cada semana hasta llegar a 0 en la fecha meta', () => {
    expect(weekCount(base)).toBe(4)
    expect(targetForDate(base, '2025-12-31')).toBe(20)
    expect(targetForDate(base, '2026-01-01')).toBe(15)
    expect(targetForDate(base, '2026-01-08')).toBe(10)
    expect(targetForDate(base, '2026-01-15')).toBe(5)
    expect(targetForDate(base, '2026-01-22')).toBe(0)
    expect(targetForDate(base, '2026-03-01')).toBe(0)
  })

  it('respeta la meta de reducción', () => {
    const reduce: Profile = { ...base, goal: 'reducir', targetPerDay: 8 }
    expect(targetForDate(reduce, '2026-01-01')).toBe(17)
    expect(targetForDate(reduce, '2026-01-22')).toBe(8)
    expect(targetForDate(reduce, '2026-02-15')).toBe(8)
  })

  it('genera semanas con consejos ligados a los detonantes', () => {
    const weeks = buildWeeks(base)
    expect(weeks).toHaveLength(4)
    expect(weeks[0]!.start).toBe('2026-01-01')
    expect(weeks[3]!.end).toBe('2026-01-28')
    expect(weeks[0]!.tips[1]).toMatch(/estrés/)
    expect(weeks[1]!.tips[1]).toMatch(/comer/)
  })
})

describe('estadísticas', () => {
  it('calcula costo unitario, ahorro, racha y días en meta', () => {
    expect(unitCost(base)).toBe(2)
    const entries = {
      '2026-01-01': { count: 14, cravingsBeaten: 1 },
      '2026-01-02': { count: 18, cravingsBeaten: 0 },
      '2026-01-03': { count: 12, cravingsBeaten: 2 },
      '2026-01-04': { count: 10, cravingsBeaten: 0 },
      '2026-01-05': { count: null, cravingsBeaten: 3 },
    }
    const stats = computeStats(base, entries, '2026-01-05')
    expect(stats.loggedDays).toBe(4)
    expect(stats.daysOnTarget).toBe(3)
    expect(stats.unitsAvoided).toBe(6 + 2 + 8 + 10)
    expect(stats.moneySaved).toBe(52)
    expect(stats.cravingsBeaten).toBe(6)
    expect(stats.streak).toBe(2)
    expect(stats.todayCount).toBeNull()
    expect(stats.series).toHaveLength(14)
    expect(stats.series.at(-1)).toEqual({ date: '2026-01-05', count: null, target: 15 })
  })

  it('la racha se corta si un día no se cumplió', () => {
    const entries = {
      '2026-01-01': { count: 30, cravingsBeaten: 0 },
      '2026-01-02': { count: 15, cravingsBeaten: 0 },
    }
    expect(computeStreak(base, entries, '2026-01-02')).toBe(1)
    expect(computeStreak(base, {}, '2026-01-02')).toBe(0)
  })
})

describe('validación del perfil', () => {
  const valid = {
    product: 'bolsas',
    perDay: 10,
    weeklySpend: 300,
    duration: 'menos-1',
    triggers: ['estres'],
    goal: 'reducir',
    targetPerDay: 4,
    targetDate: addDays(today(), 30),
    reasons: 'Mi salud',
  }

  it('acepta un perfil válido', () => {
    expect(profileSchema.safeParse(valid).success).toBe(true)
  })

  it('rechaza fechas muy cercanas o muy lejanas', () => {
    const near = profileSchema.safeParse({ ...valid, targetDate: addDays(today(), 3) })
    expect(near.success).toBe(false)
    const far = profileSchema.safeParse({ ...valid, targetDate: addDays(today(), 400) })
    expect(far.success).toBe(false)
  })

  it('exige una meta de reducción menor al consumo actual', () => {
    const res = profileSchema.safeParse({ ...valid, targetPerDay: 10 })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error.issues[0]!.path).toEqual(['targetPerDay'])
  })

  it('exige al menos un detonante', () => {
    expect(profileSchema.safeParse({ ...valid, triggers: [] }).success).toBe(false)
  })
})

describe('lectura de datos guardados', () => {
  it('descarta datos corruptos o de otra versión', () => {
    expect(parseAdultState(null)).toBeNull()
    expect(parseAdultState({ version: 2 })).toBeNull()
    const parsed = parseAdultState({
      version: 1,
      profile: { ...base },
      entries: { '2026-01-01': { count: 3 }, malo: { count: 1 }, '2026-01-02': { count: -1 } },
    })
    expect(parsed?.profile?.perDay).toBe(20)
    expect(parsed?.entries).toEqual({ '2026-01-01': { count: 3, cravingsBeaten: 0 } })
  })
})
