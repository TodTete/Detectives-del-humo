export type CaseVisual = 'flavors' | 'toy' | 'disguise' | 'vapor' | 'feed' | 'store'

export interface DetectiveCase {
  id: string
  /** Nombre del truco, se usa en las insignias. */
  trick: string
  title: string
  visual: CaseVisual
  /** Lo que la niña o el niño "ve" en la escena. */
  scene: string
  question: string
  options: string[]
  correct: number
  /** Lo que revela la lupa. */
  reveal: string
  sourceId: string
}

export const CASES: DetectiveCase[] = [
  {
    id: 'sabores',
    trick: 'Sabor a dulce',
    title: 'El caso de los sabores',
    visual: 'flavors',
    scene: 'Encuentras una cajita que dice: sabor algodón de azúcar, chicle y mango con hielo.',
    question: '¿Para quién crees que inventaron estos sabores?',
    options: [
      'Para personas adultas que ya fumaban',
      'Para llamar la atención de niñas, niños y jóvenes',
      'Porque con sabor a fruta no hace daño',
    ],
    correct: 1,
    reveal: 'La OMS ha dicho que los sabores de dulce y de fruta atraen a niñas, niños y jóvenes. El sabor no quita la nicotina: solo la disfraza.',
    sourceId: 'oms-2024',
  },
  {
    id: 'juguete',
    trick: 'Diseño de juguete',
    title: 'El caso de los colores brillantes',
    visual: 'toy',
    scene: 'Un aparato de colores neón, con forma divertida, parece un juguete o un llavero.',
    question: '¿Por qué crees que lo hicieron así?',
    options: [
      'Para que parezca divertido e inofensivo',
      'Porque los colores lo hacen más sano',
      'Para que lo usen solo personas adultas',
    ],
    correct: 0,
    reveal: 'La OMS ha señalado que muchos diseños recuerdan a juguetes. Así parecen inofensivos, aunque lo de adentro sea nicotina.',
    sourceId: 'oms-2024',
  },
  {
    id: 'disfraz',
    trick: 'Disfraz escolar',
    title: 'El caso del marcatextos misterioso',
    visual: 'disguise',
    scene: 'En el salón alguien tiene un "marcatextos" que no pinta… y le sale humo.',
    question: '¿Qué podría ser?',
    options: [
      'Un marcatextos que se descompuso',
      'Un vapeador disfrazado para esconderlo',
      'Un juguete nuevo de la papelería',
    ],
    correct: 1,
    reveal: 'Algunos vapeadores se parecen a memorias USB, plumas o marcatextos. Están hechos para pasar desapercibidos en la escuela y en casa.',
    sourceId: 'cdc-sg',
  },
  {
    id: 'vapor',
    trick: '“Es solo vapor”',
    title: 'El caso de la nube',
    visual: 'vapor',
    scene: 'Un anuncio dice: “Tranquilo, es solo vapor de agua”.',
    question: '¿Será cierto?',
    options: [
      'Sí, es como el vapor de la regadera',
      'Solo si es de sabor fruta',
      'No: puede llevar nicotina, metales y partículas',
    ],
    correct: 2,
    reveal: 'Esa nube puede llevar nicotina, metales como níquel, estaño y plomo, y partículas tan pequeñas que llegan hasta el fondo de los pulmones.',
    sourceId: 'cdc-sg',
  },
  {
    id: 'redes',
    trick: 'Publicidad escondida',
    title: 'El caso del video viral',
    visual: 'feed',
    scene: 'En redes y en un videojuego aparecen personajes vapeando como si fuera lo más normal.',
    question: '¿Qué está pasando?',
    options: [
      'Es una forma de publicidad para que parezca normal',
      'Es casualidad, a nadie le importa',
      'Significa que vapear es seguro',
    ],
    correct: 0,
    reveal: 'La OMS ha señalado que la industria promociona estos productos en redes sociales, programas de televisión y videojuegos. Si lo ves seguido, empieza a parecer normal: ese es el truco.',
    sourceId: 'oms-2024',
  },
  {
    id: 'tiendita',
    trick: '“Si lo venden, es legal”',
    title: 'El caso de la tiendita',
    visual: 'store',
    scene: 'Cerca de la escuela venden vapeadores junto a los dulces.',
    question: 'Si lo venden ahí, ¿quiere decir que está permitido?',
    options: [
      'Sí, si está en la tienda es legal',
      'Solo si es para personas adultas',
      'No: en México está prohibido venderlos',
    ],
    correct: 2,
    reveal: 'Desde enero de 2025 la Constitución de México prohíbe vender vapeadores. Que alguien los venda no los vuelve legales ni seguros.',
    sourceId: 'dof-2025',
  },
]

export const RESPONSES = [
  { id: 'no-gracias', text: 'No, gracias. No me interesa.' },
  { id: 'detective', text: 'Ya sé qué trucos usan para vendértelo. Paso.' },
  { id: 'otra-cosa', text: 'Mejor vamos a jugar otra cosa.' },
  { id: 'adulto', text: 'No, y se lo voy a contar a un adulto de confianza.' },
] as const

export const AVATARS = ['gato', 'buho', 'conejo', 'tortuga'] as const
export type AvatarId = (typeof AVATARS)[number]

export const AVATAR_NAMES: Record<AvatarId, string> = {
  gato: 'Gato',
  buho: 'Búho',
  conejo: 'Conejo',
  tortuga: 'Tortuga',
}
