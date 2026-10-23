export interface Group {
  code: string
  schoolName: string
  grade: string
  groupLabel: string
  createdAt: string
}

export interface GroupStats {
  participants: number
  preScore: number
  postScore: number
  perQuestion: { pre: number; post: number }[]
  confidence: { pre: number[]; post: number[] }
  casesAverage: number
}

export interface GroupResponse {
  group: Group
  stats: GroupStats
}

/** Datos de ejemplo para presentar el panel. Se rotulan siempre como ejemplo. */
export const DEMO: GroupResponse = {
  group: {
    code: 'EJEM-PL02',
    schoolName: 'Escuela primaria de ejemplo',
    grade: '5',
    groupLabel: 'B',
    createdAt: '2026-10-20T15:00:00.000Z',
  },
  stats: {
    participants: 28,
    preScore: 46.4,
    postScore: 87.1,
    perQuestion: [
      { pre: 32.1, post: 89.3 },
      { pre: 42.9, post: 92.9 },
      { pre: 60.7, post: 96.4 },
      { pre: 57.1, post: 82.1 },
      { pre: 39.3, post: 75 },
    ],
    confidence: { pre: [11, 12, 5], post: [2, 9, 17] },
    casesAverage: 4.8,
  },
}
