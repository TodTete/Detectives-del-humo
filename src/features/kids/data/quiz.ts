export type QuizChoice = 'true' | 'false' | 'unknown'

export interface QuizQuestion {
  id: string
  statement: string
  answer: Exclude<QuizChoice, 'unknown'>
  explanation: string
  sourceId: string
}

/** Cinco afirmaciones que se responden antes y después de la misión para medir el cambio. */
export const QUIZ: QuizQuestion[] = [
  {
    id: 'vapor',
    statement: 'Lo que sale de un vapeador es solo vapor de agua.',
    answer: 'false',
    explanation: 'Falso. Puede llevar nicotina, metales como níquel y plomo y partículas muy pequeñas que llegan hasta el fondo de los pulmones.',
    sourceId: 'cdc-sg',
  },
  {
    id: 'disfraz',
    statement: 'Algunos vapeadores parecen memorias USB o marcatextos.',
    answer: 'true',
    explanation: 'Verdadero. Algunos se parecen a objetos de la escuela para que sea fácil esconderlos.',
    sourceId: 'cdc-sg',
  },
  {
    id: 'sabores',
    statement: 'Los sabores a dulce se usan para llamar la atención de niñas, niños y jóvenes.',
    answer: 'true',
    explanation: 'Verdadero. La OMS ha dicho que sabores como algodón de azúcar o chicle atraen a niñas, niños y jóvenes.',
    sourceId: 'oms-2024',
  },
  {
    id: 'cerebro',
    statement: 'La nicotina puede afectar cómo aprende y se concentra un cerebro que sigue creciendo.',
    answer: 'true',
    explanation: 'Verdadero. El cerebro sigue creciendo hasta cerca de los 25 años y la nicotina puede afectar la atención, la memoria y el aprendizaje.',
    sourceId: 'cdc-sg',
  },
  {
    id: 'ley',
    statement: 'En México está permitido vender vapeadores en las tiendas.',
    answer: 'false',
    explanation: 'Falso. Desde enero de 2025 la Constitución prohíbe venderlos. Si alguien los vende, lo hace contra la ley.',
    sourceId: 'dof-2025',
  },
]

export const CONFIDENCE_OPTIONS = [
  { value: 2, label: 'Sí, sabría qué decir' },
  { value: 1, label: 'Más o menos' },
  { value: 0, label: 'No sabría qué decir' },
] as const

export const CONFIDENCE_QUESTION = 'Si alguien te ofreciera un vapeador, ¿sabrías qué decir?'

export const CHOICE_LABELS: Record<QuizChoice, string> = {
  true: 'Verdadero',
  false: 'Falso',
  unknown: 'No sé',
}

export function gradeQuiz(choices: QuizChoice[]): boolean[] {
  return QUIZ.map((q, i) => choices[i] === q.answer)
}
