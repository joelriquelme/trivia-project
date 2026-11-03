import type { Category, Difficulty, Rule } from '../../domain/types'

export function categoryRuleLabel(rule: Rule<string>, categories: Category[]): string {
  if (rule.kind === 'fixed') return categories.find((c) => c.id === rule.value)?.name ?? 'Categoría'
  if (rule.kind === 'free') return 'Categoría libre'
  return `Elige entre ${rule.k} categorías`
}

export function difficultyRuleLabel(rule: Rule<Difficulty>): string {
  if (rule.kind === 'fixed') return `${rule.value} ${rule.value === 1 ? 'punto' : 'puntos'}`
  if (rule.kind === 'free') return 'Dificultad libre'
  return `Elige entre ${rule.k} dificultades`
}

/** Short text for the rim badge of a segment. */
export function difficultyBadge(rule: Rule<Difficulty>): string {
  if (rule.kind === 'fixed') return `${rule.value} pts`
  if (rule.kind === 'free') return 'Libre'
  return `Elige ${rule.k}`
}

/** Dark or light text, whichever reads better on the given background. */
export function readableOn(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.36 ? '#06141c' : '#ffffff'
}

export function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const channel = (v: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount)))
  const r = channel((n >> 16) & 255)
  const g = channel((n >> 8) & 255)
  const b = channel(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
