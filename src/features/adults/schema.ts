import { z } from '../../lib/zod'
import { addDays, daysBetween, today } from '../../lib/dates'

export const PRODUCTS = {
  vapeador: {
    label: 'Vapeador o cigarro electrónico',
    unit: 'veces',
    unitOne: 'vez',
    howMany: 'cuántas',
    article: 'una',
    perDayLabel: '¿Cuántas veces al día lo usas, más o menos?',
  },
  bolsas: {
    label: 'Bolsas de nicotina',
    unit: 'bolsas',
    unitOne: 'bolsa',
    howMany: 'cuántas',
    article: 'una',
    perDayLabel: '¿Cuántas bolsas usas al día?',
  },
  calentado: {
    label: 'Tabaco calentado',
    unit: 'barritas',
    unitOne: 'barrita',
    howMany: 'cuántas',
    article: 'una',
    perDayLabel: '¿Cuántas barritas usas al día?',
  },
  cigarro: {
    label: 'Cigarros',
    unit: 'cigarros',
    unitOne: 'cigarro',
    howMany: 'cuántos',
    article: 'un',
    perDayLabel: '¿Cuántos cigarros fumas al día?',
  },
} as const
export type Product = keyof typeof PRODUCTS

export const TRIGGERS = {
  estres: 'Cuando siento estrés o ansiedad',
  comida: 'Después de comer',
  amistades: 'Con amistades o en fiestas',
  despertar: 'Al despertar',
  aburrimiento: 'Cuando me aburro',
  'cafe-alcohol': 'Con café o alcohol',
} as const
export type Trigger = keyof typeof TRIGGERS

export const DURATIONS = {
  'menos-1': 'Menos de 1 año',
  '1-3': 'De 1 a 3 años',
  'mas-3': 'Más de 3 años',
} as const

export const MIN_PLAN_DAYS = 7
export const MAX_PLAN_DAYS = 120

const numberField = (min: number, max: number, label: string) =>
  z
    .number({ error: `Escribe ${label} con números.` })
    .int(`Escribe ${label} sin decimales.`)
    .min(min, `${label[0]!.toUpperCase()}${label.slice(1)} debe ser al menos ${min}.`)
    .max(max, `${label[0]!.toUpperCase()}${label.slice(1)} no puede ser mayor a ${max}.`)

export const profileShape = z.object({
  product: z.enum(Object.keys(PRODUCTS) as [Product, ...Product[]], {
    error: 'Elige qué consumes.',
  }),
  perDay: numberField(1, 200, 'la cantidad al día'),
  weeklySpend: numberField(0, 20000, 'el gasto semanal'),
  duration: z.enum(Object.keys(DURATIONS) as ['menos-1', '1-3', 'mas-3'], {
    error: 'Elige desde cuándo consumes.',
  }),
  triggers: z
    .array(z.enum(Object.keys(TRIGGERS) as [Trigger, ...Trigger[]]))
    .min(1, 'Elige al menos un momento en el que te dan más ganas.'),
  goal: z.enum(['dejar', 'reducir'], { error: 'Elige tu meta.' }),
  targetPerDay: z.number().int().min(0).max(199).nullable(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige una fecha válida.'),
  reasons: z.string().trim().max(200, 'Tus razones admiten hasta 200 caracteres.'),
})

// Validaciones entre campos. `when` hace que corran aunque otros campos tengan errores,
// para mostrar todos los problemas de una sola vez (los datos pueden venir incompletos).
export const profileSchema = profileShape.superRefine(
  (raw, ctx) => {
    const data = raw as Partial<Record<keyof typeof raw, unknown>>
    if (typeof data.targetDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.targetDate)) {
      const days = daysBetween(today(), data.targetDate)
      if (Number.isNaN(days) || days < MIN_PLAN_DAYS) {
        ctx.addIssue({
          code: 'custom',
          path: ['targetDate'],
          message: `Elige una fecha al menos ${MIN_PLAN_DAYS} días después de hoy: los cambios graduales funcionan mejor.`,
        })
      } else if (days > MAX_PLAN_DAYS) {
        ctx.addIssue({
          code: 'custom',
          path: ['targetDate'],
          message: `Elige una fecha dentro de los próximos ${MAX_PLAN_DAYS} días.`,
        })
      }
    }
    if (data.goal === 'reducir') {
      const target = data.targetPerDay
      const perDay = data.perDay
      if (typeof target !== 'number' || Number.isNaN(target)) {
        ctx.addIssue({
          code: 'custom',
          path: ['targetPerDay'],
          message: 'Escribe a cuánto al día quieres llegar.',
        })
      } else if (
        typeof perDay === 'number' &&
        !Number.isNaN(perDay) &&
        (target < 1 || target >= perDay)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['targetPerDay'],
          message: `Tu meta debe ser menor a lo que usas hoy (${perDay}) y al menos 1. Si quieres llegar a 0, elige “Dejarlo por completo”.`,
        })
      }
    }
  },
  { when: () => true },
)

export type ProfileInput = z.infer<typeof profileSchema>

export interface Profile extends ProfileInput {
  startDate: string
}

export function defaultTargetDate(): string {
  return addDays(today(), 28)
}
