import type { Bank, Question } from '../../domain/types'
import { SEED_CATEGORIES } from './categories'

type SeedQuestion = Omit<Question, 'categoryId'>

// One JSON file per category; the file name is the category id.
const modules = import.meta.glob<{ default: SeedQuestion[] }>('./questions/*.json', { eager: true })

const questions: Question[] = Object.entries(modules).flatMap(([path, mod]) => {
  const categoryId = /([^/]+)\.json$/.exec(path)![1]
  return mod.default.map((q) => ({ ...q, categoryId }))
})

export const SEED_BANK: Bank = { categories: SEED_CATEGORIES, questions }

/** A fresh deep copy, so callers can never mutate the seed. */
export function cloneSeedBank(): Bank {
  return structuredClone(SEED_BANK)
}
