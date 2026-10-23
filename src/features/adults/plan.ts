import { addDays, daysBetween } from '../../lib/dates'
import type { Profile, Trigger } from './schema'

export function finalTarget(profile: Profile): number {
  return profile.goal === 'dejar' ? 0 : (profile.targetPerDay ?? 0)
}

export function planLength(profile: Profile): number {
  return Math.max(7, daysBetween(profile.startDate, profile.targetDate))
}

export function weekCount(profile: Profile): number {
  return Math.ceil(planLength(profile) / 7)
}

/** Límite diario para una fecha: baja cada semana de forma lineal hasta la meta. */
export function targetForDate(profile: Profile, date: string): number {
  const final = finalTarget(profile)
  const offset = daysBetween(profile.startDate, date)
  if (offset < 0) return profile.perDay
  if (offset >= planLength(profile)) return final
  const weeks = weekCount(profile)
  const week = Math.floor(offset / 7)
  const value = Math.round(profile.perDay - ((profile.perDay - final) * (week + 1)) / weeks)
  return Math.min(profile.perDay, Math.max(final, value))
}

export const TRIGGER_TIPS: Record<Trigger, string> = {
  estres:
    'Cuando sientas estrés, respira profundo cinco veces antes de decidir. Las ganas bajan si les das tiempo.',
  comida: 'Después de comer, levántate de la mesa: lava tus dientes o sal a caminar unos minutos.',
  amistades: 'Cuéntale tu plan a tus amistades y propón planes en lugares libres de humo.',
  despertar:
    'Al despertar, cambia el orden de tu rutina: agua, regadera o estirarte antes de cualquier otra cosa.',
  aburrimiento:
    'Ten algo a la mano para ocupar manos y boca: chicle sin azúcar, verduras o una pelota antiestrés.',
  'cafe-alcohol':
    'Si el café o el alcohol te dan ganas, cambia de lugar o de bebida durante estas semanas.',
}

const GENERAL_TIPS = [
  'Escribe tus razones para dejarlo y ponte una regla: esperar 10 minutos antes de consumir.',
  'Aléjate de las situaciones que asocias con el consumo y busca lugares libres de humo.',
  'Muévete un poco cuando lleguen las ganas, aunque sea subir y bajar escaleras.',
  'Planea una recompensa por cada semana que cumplas. Con lo que ahorras puedes pagarla.',
]

export interface PlanWeek {
  index: number
  start: string
  end: string
  dailyTarget: number
  tips: string[]
}

export function buildWeeks(profile: Profile): PlanWeek[] {
  const total = planLength(profile)
  const weeks = weekCount(profile)
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(profile.startDate, index * 7)
    const end = addDays(profile.startDate, Math.min(total, (index + 1) * 7) - 1)
    const trigger = profile.triggers[index % profile.triggers.length]
    const tips = [GENERAL_TIPS[index % GENERAL_TIPS.length]!]
    if (trigger) tips.push(TRIGGER_TIPS[trigger])
    return { index, start, end, dailyTarget: targetForDate(profile, start), tips }
  })
}
