/** A random number source returning floats in [0, 1), like Math.random. */
export type Rng = () => number

/** Deterministic, seedable RNG (mulberry32) for tests and reproducible runs. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  return minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1))
}

export function pickOne<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pickOne: empty list')
  return items[Math.floor(rng() * items.length)]
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** k distinct items in random order (all of them if k >= length). */
export function sample<T>(rng: Rng, items: readonly T[], k: number): T[] {
  return shuffle(rng, items).slice(0, Math.max(0, k))
}

/** Pick a key with probability proportional to its weight; zero weights are skipped. */
export function weightedPick<K extends string>(rng: Rng, weights: Record<K, number>): K {
  const entries = (Object.entries(weights) as [K, number][]).filter(([, w]) => w > 0)
  if (entries.length === 0) throw new Error('weightedPick: no positive weights')
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = rng() * total
  for (const [key, w] of entries) {
    roll -= w
    if (roll < 0) return key
  }
  return entries[entries.length - 1][0]
}
