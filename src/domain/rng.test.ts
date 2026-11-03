import { randomInt, sample, seededRng, shuffle, weightedPick } from './rng'

describe('seededRng', () => {
  it('is deterministic for the same seed', () => {
    const a = seededRng(42)
    const b = seededRng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('stays within [0, 1)', () => {
    const rng = seededRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('helpers', () => {
  it('randomInt covers the inclusive range', () => {
    const rng = seededRng(1)
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randomInt(rng, 2, 4))
    expect([...seen].sort()).toEqual([2, 3, 4])
  })

  it('shuffle keeps every element', () => {
    const out = shuffle(seededRng(3), [1, 2, 3, 4, 5])
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('sample returns k distinct items, capped at length', () => {
    const rng = seededRng(9)
    const s = sample(rng, ['a', 'b', 'c', 'd'], 3)
    expect(new Set(s).size).toBe(3)
    expect(sample(rng, ['a', 'b'], 5)).toHaveLength(2)
  })

  it('weightedPick never returns a zero-weight key', () => {
    const rng = seededRng(5)
    for (let i = 0; i < 200; i++) {
      expect(weightedPick(rng, { a: 1, b: 0, c: 3 })).not.toBe('b')
    }
  })
})
