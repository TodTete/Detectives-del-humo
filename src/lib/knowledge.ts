import knowledge from '../../shared/knowledge.json'

export type Source = (typeof knowledge.sources)[number]
export type Fact = (typeof knowledge.facts)[number]

export const SOURCES: Source[] = knowledge.sources
export const FACTS: Fact[] = knowledge.facts
export const KNOWLEDGE_VERSION = knowledge.version

export function getSource(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id)
}

export function getFact(id: string): Fact | undefined {
  return FACTS.find((f) => f.id === id)
}

/** Fuentes únicas de una lista de hechos. */
export function sourcesForFacts(factIds: string[]): Source[] {
  const ids = new Set(factIds.flatMap((id) => getFact(id)?.sources ?? []))
  return SOURCES.filter((s) => ids.has(s.id))
}

export const LINEA_VIDA_TEL = '8009112000'
export const LINEA_VIDA_DISPLAY = '800 911 2000'
