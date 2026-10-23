import { addDays, daysBetween } from '../../lib/dates'
import { targetForDate } from './plan'
import type { Profile } from './schema'

export interface DayEntry {
  /** null = ese día solo se registraron antojos superados, sin consumo. */
  count: number | null
  cravingsBeaten: number
}

export type Entries = Record<string, DayEntry>

export interface ChartPoint {
  date: string
  count: number | null
  target: number
}

export interface AdultStats {
  todayTarget: number
  todayCount: number | null
  streak: number
  loggedDays: number
  daysOnTarget: number
  unitsAvoided: number
  moneySaved: number
  cravingsBeaten: number
  daysToGoal: number
  series: ChartPoint[]
}

export function unitCost(profile: Profile): number {
  if (profile.perDay <= 0) return 0
  return profile.weeklySpend / (profile.perDay * 7)
}

export function isOnTarget(profile: Profile, date: string, entry: DayEntry | undefined): boolean {
  return entry !== undefined && entry.count !== null && entry.count <= targetForDate(profile, date)
}

/** Días seguidos cumpliendo el límite. Si hoy aún no hay registro, cuenta desde ayer. */
export function computeStreak(profile: Profile, entries: Entries, todayDate: string): number {
  let cursor = entries[todayDate]?.count != null ? todayDate : addDays(todayDate, -1)
  let streak = 0
  while (
    daysBetween(profile.startDate, cursor) >= 0 &&
    isOnTarget(profile, cursor, entries[cursor])
  ) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function computeStats(
  profile: Profile,
  entries: Entries,
  todayDate: string,
  chartDays = 14,
): AdultStats {
  const inRange = Object.entries(entries).filter(([date]) => {
    const fromStart = daysBetween(profile.startDate, date)
    return fromStart >= 0 && daysBetween(date, todayDate) >= 0
  })
  const logged = inRange.filter(
    (pair): pair is [string, DayEntry & { count: number }] => pair[1].count !== null,
  )
  const cost = unitCost(profile)
  const unitsAvoided = logged.reduce((acc, [, e]) => acc + Math.max(0, profile.perDay - e.count), 0)
  const series: ChartPoint[] = Array.from({ length: chartDays }, (_, i) => {
    const date = addDays(todayDate, i - (chartDays - 1))
    return { date, count: entries[date]?.count ?? null, target: targetForDate(profile, date) }
  })
  return {
    todayTarget: targetForDate(profile, todayDate),
    todayCount: entries[todayDate]?.count ?? null,
    streak: computeStreak(profile, entries, todayDate),
    loggedDays: logged.length,
    daysOnTarget: logged.filter(([date, e]) => isOnTarget(profile, date, e)).length,
    unitsAvoided,
    moneySaved: Math.round(unitsAvoided * cost),
    cravingsBeaten: inRange.reduce((acc, [, e]) => acc + e.cravingsBeaten, 0),
    daysToGoal: Math.max(0, daysBetween(todayDate, profile.targetDate)),
    series,
  }
}
