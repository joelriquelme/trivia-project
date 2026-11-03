import { DIFFICULTIES, type Bank, type Category, type Difficulty, type Question } from '../domain/types'

export function makeCategory(id: string): Category {
  return { id, name: id.toUpperCase(), short: id, color: '#888888', icon: '?' }
}

export function makeQuestion(id: string, categoryId: string, difficulty: Difficulty): Question {
  return {
    id,
    categoryId,
    difficulty,
    prompt: `Pregunta ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
  }
}

/** A bank with `perCombo` questions for every category × difficulty. */
export function makeBank(categoryIds: string[], perCombo = 2): Bank {
  const questions: Question[] = []
  for (const c of categoryIds) {
    for (const d of DIFFICULTIES) {
      for (let i = 0; i < perCombo; i++) questions.push(makeQuestion(`${c}-${d}-${i}`, c, d))
    }
  }
  return { categories: categoryIds.map(makeCategory), questions }
}
