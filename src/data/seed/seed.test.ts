import { parseBank } from '../../domain/bankSchema'
import { DIFFICULTIES } from '../../domain/types'
import { SEED_BANK } from './index'

describe('seed bank', () => {
  it('passes the bank schema', () => {
    const result = parseBank(SEED_BANK)
    expect(result.ok ? [] : result.errors).toEqual([])
  })

  it('has four questions per category and difficulty', () => {
    for (const c of SEED_BANK.categories) {
      for (const d of DIFFICULTIES) {
        const n = SEED_BANK.questions.filter((q) => q.categoryId === c.id && q.difficulty === d).length
        expect(n, `${c.id} @ ${d}`).toBe(4)
      }
    }
  })

  it('has no duplicate prompts', () => {
    const prompts = SEED_BANK.questions.map((q) => q.prompt.trim().toLowerCase())
    expect(new Set(prompts).size).toBe(prompts.length)
  })
})
