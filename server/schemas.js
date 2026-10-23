import { z } from 'zod'

export const QUESTION_COUNT = 5
export const CASE_COUNT = 6
export const GROUP_CODE_REGEX = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/

export const groupCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(GROUP_CODE_REGEX, 'El código debe tener el formato ABCD-2345.')

export const createGroupSchema = z.object({
  schoolName: z
    .string()
    .trim()
    .min(3, 'Escribe el nombre de la escuela (mínimo 3 caracteres).')
    .max(80, 'El nombre de la escuela admite hasta 80 caracteres.'),
  grade: z.enum(['3', '4', '5', '6'], { message: 'Elige un grado de 3.º a 6.º.' }),
  groupLabel: z
    .string()
    .trim()
    .max(10, 'El grupo admite hasta 10 caracteres.')
    .regex(/^[\p{L}\p{N} ]*$/u, 'Usa solo letras y números.')
    .optional()
    .default(''),
})

const attemptSchema = z.object({
  answers: z.array(z.boolean()).length(QUESTION_COUNT),
  confidence: z.number().int().min(0).max(2),
})

export const resultSchema = z.object({
  clientId: z.string().uuid(),
  groupCode: groupCodeSchema,
  pre: attemptSchema,
  post: attemptSchema,
  casesCorrect: z.number().int().min(0).max(CASE_COUNT),
})

export const askSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, 'Escribe una pregunta un poco más larga.')
    .max(500, 'La pregunta admite hasta 500 caracteres.'),
})
