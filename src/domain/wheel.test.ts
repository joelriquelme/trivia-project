import { makeBank, makeQuestion } from '../test/fixtures'
import { categoriesFor, computeAvailability } from './availability'
import { seededRng } from './rng'
import type { WheelSegment } from './types'
import {
  WHEEL_SIZE,
  categoryCandidates,
  categoryOptions,
  difficultyOptions,
  generateWheel,
  isResolvable,
  pickSegmentIndex,
} from './wheel'

const CATS = ['his', 'geo', 'sci', 'dep', 'art', 'ent']

describe('generateWheel', () => {
  it('builds WHEEL_SIZE resolvable segments across many seeds', () => {
    const av = computeAvailability(makeBank(CATS, 2), [])
    for (let seed = 0; seed < 200; seed++) {
      const wheel = generateWheel(av, seededRng(seed))
      expect(wheel).toHaveLength(WHEEL_SIZE)
      for (const seg of wheel) expect(isResolvable(seg, av)).toBe(true)
    }
  })

  it('keeps choose k within 2..m-1', () => {
    const av = computeAvailability(makeBank(CATS, 2), [])
    for (let seed = 0; seed < 200; seed++) {
      for (const seg of generateWheel(av, seededRng(seed))) {
        if (seg.category.kind === 'choose') {
          expect(seg.category.k).toBeGreaterThanOrEqual(2)
          expect(seg.category.k).toBeLessThanOrEqual(CATS.length - 1)
        }
        if (seg.difficulty.kind === 'choose') {
          expect(seg.difficulty.k).toBeGreaterThanOrEqual(2)
          expect(seg.difficulty.k).toBeLessThanOrEqual(4)
        }
      }
    }
  })

  it('uses every rule kind over enough spins', () => {
    const av = computeAvailability(makeBank(CATS, 2), [])
    const kinds = new Set<string>()
    for (let seed = 0; seed < 30; seed++) {
      for (const seg of generateWheel(av, seededRng(seed))) kinds.add(`c:${seg.category.kind}`).add(`d:${seg.difficulty.kind}`)
    }
    expect(kinds).toEqual(new Set(['c:fixed', 'c:choose', 'c:free', 'd:fixed', 'd:choose', 'd:free']))
  })

  it('spreads fixed categories across all categories', () => {
    const av = computeAvailability(makeBank(CATS, 2), [])
    const seen = new Set<string>()
    for (let seed = 0; seed < 10; seed++) {
      for (const seg of generateWheel(av, seededRng(seed))) if (seg.category.kind === 'fixed') seen.add(seg.category.value)
    }
    expect(seen).toEqual(new Set(CATS))
  })

  it('only offers the last remaining combination when the bank is almost empty', () => {
    const bank = { categories: makeBank(CATS).categories, questions: [makeQuestion('last', 'geo', 5)] }
    const av = computeAvailability(bank, [])
    for (let seed = 0; seed < 50; seed++) {
      const rng = seededRng(seed)
      for (const seg of generateWheel(av, rng)) {
        expect(categoryOptions(seg, av, rng)).toEqual(['geo'])
        expect(difficultyOptions(seg, av, 'geo', rng)).toEqual([5])
      }
    }
  })

  it('returns an empty wheel when nothing is left', () => {
    const bank = makeBank(CATS, 1)
    const av = computeAvailability(bank, bank.questions.map((q) => q.id))
    expect(generateWheel(av, seededRng(1))).toEqual([])
  })
})

describe('segment resolution', () => {
  const bank = makeBank(CATS, 1)
  const av = computeAvailability(bank, [])

  it('choose k offers k distinct categories', () => {
    const seg: WheelSegment = { id: 's', category: { kind: 'choose', k: 3 }, difficulty: { kind: 'free' } }
    const opts = categoryOptions(seg, av, seededRng(4))
    expect(opts).toHaveLength(3)
    expect(new Set(opts).size).toBe(3)
    opts.forEach((c) => expect(CATS).toContain(c))
  })

  it('free offers every category that still has questions', () => {
    const seg: WheelSegment = { id: 's', category: { kind: 'free' }, difficulty: { kind: 'free' } }
    expect(categoryOptions(seg, av, seededRng(1))).toEqual(CATS)
  })

  it('a fixed difficulty limits categories to those that still have it', () => {
    const partial = computeAvailability(bank, ['his-8-0', 'geo-8-0'])
    const seg: WheelSegment = { id: 's', category: { kind: 'free' }, difficulty: { kind: 'fixed', value: 8 } }
    expect(categoryCandidates(seg, partial)).toEqual(categoriesFor(partial, 8))
    expect(categoryCandidates(seg, partial)).not.toContain('his')
  })

  it('choose k on difficulty only offers difficulties left in the chosen category', () => {
    const partial = computeAvailability(bank, ['sci-1-0', 'sci-2-0', 'sci-3-0'])
    const seg: WheelSegment = { id: 's', category: { kind: 'fixed', value: 'sci' }, difficulty: { kind: 'choose', k: 3 } }
    expect(difficultyOptions(seg, partial, 'sci', seededRng(2))).toEqual([5, 8])
  })
})

describe('pickSegmentIndex', () => {
  it('stays within the wheel', () => {
    const rng = seededRng(3)
    const wheel = generateWheel(computeAvailability(makeBank(CATS), []), rng)
    for (let i = 0; i < 100; i++) {
      const idx = pickSegmentIndex(rng, wheel)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(wheel.length)
    }
  })
})
