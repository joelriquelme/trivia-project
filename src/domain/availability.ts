import { DIFFICULTIES, type Bank, type Difficulty, type Question } from './types'

/** Unused question ids grouped by category and difficulty. */
export interface Availability {
  byCombo: Map<string, string[]>
  categoryIds: string[]
}

const comboKey = (categoryId: string, difficulty: Difficulty) => `${categoryId}|${difficulty}`

export function computeAvailability(bank: Bank, usedIds: Iterable<string>): Availability {
  const used = new Set(usedIds)
  const knownCategories = new Set(bank.categories.map((c) => c.id))
  const byCombo = new Map<string, string[]>()
  for (const q of bank.questions) {
    if (used.has(q.id) || !knownCategories.has(q.categoryId)) continue
    const key = comboKey(q.categoryId, q.difficulty)
    const list = byCombo.get(key)
    if (list) list.push(q.id)
    else byCombo.set(key, [q.id])
  }
  return { byCombo, categoryIds: bank.categories.map((c) => c.id) }
}

export function remainingIn(av: Availability, categoryId: string, difficulty: Difficulty): string[] {
  return av.byCombo.get(comboKey(categoryId, difficulty)) ?? []
}

/** Difficulties that still have questions in a category. */
export function difficultiesFor(av: Availability, categoryId: string): Difficulty[] {
  return DIFFICULTIES.filter((d) => remainingIn(av, categoryId, d).length > 0)
}

/** Categories that still have questions, optionally only at one difficulty. */
export function categoriesFor(av: Availability, difficulty?: Difficulty): string[] {
  return av.categoryIds.filter((c) =>
    difficulty === undefined ? difficultiesFor(av, c).length > 0 : remainingIn(av, c, difficulty).length > 0,
  )
}

/** Difficulties available in at least one category. */
export function activeDifficulties(av: Availability): Difficulty[] {
  return DIFFICULTIES.filter((d) => categoriesFor(av, d).length > 0)
}

export function totalRemaining(av: Availability): number {
  let n = 0
  for (const list of av.byCombo.values()) n += list.length
  return n
}

export function questionById(bank: Bank, id: string): Question | undefined {
  return bank.questions.find((q) => q.id === id)
}
