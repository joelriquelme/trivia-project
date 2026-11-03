import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { cloneSeedBank } from '../data/seed'
import type { Bank, Category, Question } from '../domain/types'

interface BankStore {
  bank: Bank
  upsertQuestion: (question: Question) => void
  deleteQuestion: (id: string) => void
  upsertCategory: (category: Category) => void
  /** Removes the category and every question in it. */
  deleteCategory: (id: string) => void
  replaceBank: (bank: Bank) => void
  resetToSeed: () => void
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id)
  if (i === -1) return [...list, item]
  const copy = [...list]
  copy[i] = item
  return copy
}

export const useBankStore = create<BankStore>()(
  persist(
    (set) => ({
      bank: cloneSeedBank(),
      upsertQuestion: (question) => set(({ bank }) => ({ bank: { ...bank, questions: upsert(bank.questions, question) } })),
      deleteQuestion: (id) =>
        set(({ bank }) => ({ bank: { ...bank, questions: bank.questions.filter((q) => q.id !== id) } })),
      upsertCategory: (category) =>
        set(({ bank }) => ({ bank: { ...bank, categories: upsert(bank.categories, category) } })),
      deleteCategory: (id) =>
        set(({ bank }) => ({
          bank: {
            categories: bank.categories.filter((c) => c.id !== id),
            questions: bank.questions.filter((q) => q.categoryId !== id),
          },
        })),
      replaceBank: (bank) => set({ bank: structuredClone(bank) }),
      resetToSeed: () => set({ bank: cloneSeedBank() }),
    }),
    {
      name: 'trivia.bank.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ bank: s.bank }),
    },
  ),
)

export function newId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}
