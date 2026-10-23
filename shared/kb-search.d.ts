export function normalize(text: string): string
export function tokenize(text: string): string[]
export function searchFacts<
  T extends { id: string; title: string; text: string; keywords: string[] },
>(query: string, facts: T[], limit?: number): T[]
