export const DIFFICULTIES = [1, 2, 3, 5, 8] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export interface Category {
  id: string
  name: string
  /** Short label that fits inside a wheel segment. */
  short: string
  color: string
  icon: string
}

export type AnswerIndex = 0 | 1 | 2 | 3

export interface Question {
  id: string
  categoryId: string
  difficulty: Difficulty
  prompt: string
  options: [string, string, string, string]
  correctIndex: AnswerIndex
}

export interface Bank {
  categories: Category[]
  questions: Question[]
}

/**
 * How one half of a wheel segment constrains the player's choice.
 * - fixed: exactly this value (x = m - 1 blocked options).
 * - free: any available value (x = 0).
 * - choose: k random options stay enabled when the wheel stops (k = m - x).
 */
export type Rule<T> = { kind: 'fixed'; value: T } | { kind: 'free' } | { kind: 'choose'; k: number }

export interface WheelSegment {
  id: string
  category: Rule<string>
  difficulty: Rule<Difficulty>
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'number' && (DIFFICULTIES as readonly number[]).includes(value)
}
