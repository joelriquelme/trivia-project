import { activeDifficulties, categoriesFor, difficultiesFor, type Availability } from './availability'
import { pickOne, randomInt, sample, shuffle, weightedPick, type Rng } from './rng'
import type { Difficulty, Rule, WheelSegment } from './types'

export const WHEEL_SIZE = 12

/** Relative odds of each rule kind on a segment half. */
export const RULE_WEIGHTS = { fixed: 55, choose: 25, free: 20 } as const

type RuleKind = keyof typeof RULE_WEIGHTS

function weightsFor(optionCount: number): Record<RuleKind, number> {
  return {
    fixed: RULE_WEIGHTS.fixed,
    // "choose k" needs 2 <= k <= m - 1, so at least 3 options.
    choose: optionCount >= 3 ? RULE_WEIGHTS.choose : 0,
    free: optionCount >= 2 ? RULE_WEIGHTS.free : 0,
  }
}

/** Every category the player could end up with on this segment. */
export function categoryCandidates(seg: WheelSegment, av: Availability): string[] {
  const cats = seg.difficulty.kind === 'fixed' ? categoriesFor(av, seg.difficulty.value) : categoriesFor(av)
  if (seg.category.kind === 'fixed') return cats.includes(seg.category.value) ? [seg.category.value] : []
  return cats
}

/** Every difficulty the player could pick once the category is known. */
export function difficultyCandidates(seg: WheelSegment, av: Availability, categoryId: string): Difficulty[] {
  const ds = difficultiesFor(av, categoryId)
  if (seg.difficulty.kind === 'fixed') return ds.includes(seg.difficulty.value) ? [seg.difficulty.value] : []
  return ds
}

export function isResolvable(seg: WheelSegment, av: Availability): boolean {
  return categoryCandidates(seg, av).length > 0
}

/** Apply a rule to its candidates: "choose k" keeps k random ones, in their original order. */
function applyRule<T>(rule: Rule<T>, candidates: T[], rng: Rng): T[] {
  if (rule.kind !== 'choose') return candidates
  const kept = new Set(sample(rng, candidates, rule.k))
  return candidates.filter((c) => kept.has(c))
}

/** Category options offered when the wheel lands on this segment. */
export function categoryOptions(seg: WheelSegment, av: Availability, rng: Rng): string[] {
  return applyRule(seg.category, categoryCandidates(seg, av), rng)
}

/** Difficulty options offered after the category is settled. */
export function difficultyOptions(seg: WheelSegment, av: Availability, categoryId: string, rng: Rng): Difficulty[] {
  return applyRule(seg.difficulty, difficultyCandidates(seg, av, categoryId), rng)
}

/** Keep "choose k" honest: k must stay below the number of real candidates. */
function normalizeChoose<T>(rule: Rule<T>, candidateCount: number): Rule<T> {
  if (rule.kind !== 'choose') return rule
  if (candidateCount >= 3) return { kind: 'choose', k: Math.min(rule.k, candidateCount - 1) }
  return { kind: 'free' }
}

/**
 * Build a fresh wheel for one turn. Every segment is guaranteed to be resolvable
 * with the questions still available; an empty array means the bank is exhausted.
 */
export function generateWheel(av: Availability, rng: Rng, size = WHEEL_SIZE): WheelSegment[] {
  const cats = categoriesFor(av)
  if (cats.length === 0) return []
  const allDiffs = activeDifficulties(av)

  // Cycle through categories so fixed segments spread across all of them.
  let queue: string[] = []
  const nextCategory = () => {
    if (queue.length === 0) queue = shuffle(rng, cats)
    return queue.pop()!
  }

  const segments: WheelSegment[] = []
  for (let i = 0; i < size; i++) {
    const catKind = weightedPick(rng, weightsFor(cats.length))
    let category: Rule<string>
    if (catKind === 'fixed') category = { kind: 'fixed', value: nextCategory() }
    else if (catKind === 'choose') category = { kind: 'choose', k: randomInt(rng, 2, cats.length - 1) }
    else category = { kind: 'free' }

    const diffs = category.kind === 'fixed' ? difficultiesFor(av, category.value) : allDiffs
    const diffKind = weightedPick(rng, weightsFor(diffs.length))
    let difficulty: Rule<Difficulty>
    if (diffKind === 'fixed') difficulty = { kind: 'fixed', value: pickOne(rng, diffs) }
    else if (diffKind === 'choose') difficulty = { kind: 'choose', k: randomInt(rng, 2, diffs.length - 1) }
    else difficulty = { kind: 'free' }

    const draft: WheelSegment = { id: `seg-${i}`, category, difficulty }
    draft.category = normalizeChoose(category, categoryCandidates(draft, av).length)
    if (draft.category.kind === 'free' && categoryCandidates(draft, av).length === 1) {
      draft.category = { kind: 'fixed', value: categoryCandidates(draft, av)[0] }
    }
    if (draft.category.kind === 'fixed') {
      draft.difficulty = normalizeChoose(draft.difficulty, difficultyCandidates(draft, av, draft.category.value).length)
    }

    // Construction keeps segments resolvable; this guard documents the invariant.
    if (!isResolvable(draft, av)) {
      const c = pickOne(rng, cats)
      draft.category = { kind: 'fixed', value: c }
      draft.difficulty = { kind: 'fixed', value: pickOne(rng, difficultiesFor(av, c)) }
    }
    segments.push(draft)
  }
  return segments
}

export function pickSegmentIndex(rng: Rng, wheel: readonly WheelSegment[]): number {
  return Math.floor(rng() * wheel.length)
}
