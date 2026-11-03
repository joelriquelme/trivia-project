import { z } from 'zod'
import type { Bank } from './types'

const difficulty = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8)])
const answerIndex = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
const text = z.string().trim().min(1)

export const categorySchema = z.object({
  id: text,
  name: text,
  short: text,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'El color debe tener formato #RRGGBB'),
  icon: z.string(),
})

export const questionSchema = z.object({
  id: text,
  categoryId: text,
  difficulty,
  prompt: text,
  options: z.tuple([text, text, text, text]),
  correctIndex: answerIndex,
})

export const bankSchema = z
  .object({
    categories: z.array(categorySchema),
    questions: z.array(questionSchema),
  })
  .superRefine((bank, ctx) => {
    const categoryIds = new Set<string>()
    bank.categories.forEach((c, i) => {
      if (categoryIds.has(c.id)) ctx.addIssue({ code: 'custom', path: ['categories', i, 'id'], message: `Categoría repetida: ${c.id}` })
      categoryIds.add(c.id)
    })
    const questionIds = new Set<string>()
    bank.questions.forEach((q, i) => {
      if (questionIds.has(q.id)) ctx.addIssue({ code: 'custom', path: ['questions', i, 'id'], message: `Pregunta repetida: ${q.id}` })
      questionIds.add(q.id)
      if (!categoryIds.has(q.categoryId)) {
        ctx.addIssue({ code: 'custom', path: ['questions', i, 'categoryId'], message: `Categoría inexistente: ${q.categoryId}` })
      }
      const normalized = q.options.map((o) => o.trim().toLowerCase())
      if (new Set(normalized).size !== 4) {
        ctx.addIssue({ code: 'custom', path: ['questions', i, 'options'], message: `Alternativas repetidas en ${q.id}` })
      }
    })
  })

export type ParseBankResult = { ok: true; bank: Bank } | { ok: false; errors: string[] }

/** Validate untrusted input (an imported file) as a bank. */
export function parseBank(input: unknown): ParseBankResult {
  const result = bankSchema.safeParse(input)
  if (result.success) return { ok: true, bank: result.data as Bank }
  return {
    ok: false,
    errors: result.error.issues.slice(0, 10).map((issue) => {
      const where = issue.path.length ? `${issue.path.join('.')}: ` : ''
      return where + issue.message
    }),
  }
}
