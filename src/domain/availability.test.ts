import { makeBank, makeQuestion } from '../test/fixtures'
import {
  activeDifficulties,
  categoriesFor,
  computeAvailability,
  difficultiesFor,
  remainingIn,
  totalRemaining,
} from './availability'

describe('computeAvailability', () => {
  it('groups unused questions by category and difficulty', () => {
    const bank = makeBank(['his', 'geo'], 2)
    const av = computeAvailability(bank, ['his-1-0'])
    expect(remainingIn(av, 'his', 1)).toEqual(['his-1-1'])
    expect(remainingIn(av, 'geo', 1)).toHaveLength(2)
    expect(totalRemaining(av)).toBe(bank.questions.length - 1)
  })

  it('drops exhausted combinations', () => {
    const bank = makeBank(['his'], 1)
    const av = computeAvailability(bank, ['his-8-0'])
    expect(difficultiesFor(av, 'his')).toEqual([1, 2, 3, 5])
    expect(activeDifficulties(av)).toEqual([1, 2, 3, 5])
  })

  it('lists categories that still have questions, optionally per difficulty', () => {
    const bank = {
      categories: makeBank(['a', 'b', 'c']).categories,
      questions: [makeQuestion('q1', 'a', 1), makeQuestion('q2', 'b', 5)],
    }
    const av = computeAvailability(bank, [])
    expect(categoriesFor(av)).toEqual(['a', 'b'])
    expect(categoriesFor(av, 5)).toEqual(['b'])
  })

  it('ignores questions whose category no longer exists', () => {
    const bank = { categories: makeBank(['a']).categories, questions: [makeQuestion('q', 'ghost', 1)] }
    expect(totalRemaining(computeAvailability(bank, []))).toBe(0)
  })
})
