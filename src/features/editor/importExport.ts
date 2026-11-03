import { parseBank, type ParseBankResult } from '../../domain/bankSchema'
import { DIFFICULTIES, type Bank, type Difficulty } from '../../domain/types'

export const EXPORT_FORMAT = 'trivia-ruleta-bank'
export const EXPORT_VERSION = 1

export function serializeBank(bank: Bank): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: EXPORT_VERSION, ...bank }, null, 2)
}

/** Parse an uploaded file. Accepts our export format or a bare {categories, questions} object. */
export function parseBankFile(text: string): ParseBankResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, errors: ['El archivo no es un JSON válido.'] }
  }
  if (typeof data !== 'object' || data === null) return { ok: false, errors: ['El archivo no contiene un banco de preguntas.'] }
  const { categories, questions } = data as Record<string, unknown>
  return parseBank({ categories, questions })
}

export function exportFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `trivia-banco-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}.json`
}

/** Lowercase ASCII id from a name, unique among `taken`. */
export function slugify(name: string, taken: Iterable<string>): string {
  const base =
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'categoria'
  const used = new Set(taken)
  if (!used.has(base)) return base
  let i = 2
  while (used.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

/** Questions per category and difficulty, for the coverage table. */
export function coverage(bank: Bank): Map<string, Record<Difficulty, number>> {
  const table = new Map<string, Record<Difficulty, number>>()
  for (const c of bank.categories) {
    table.set(c.id, Object.fromEntries(DIFFICULTIES.map((d) => [d, 0])) as Record<Difficulty, number>)
  }
  for (const q of bank.questions) {
    const row = table.get(q.categoryId)
    if (row) row[q.difficulty]++
  }
  return table
}
