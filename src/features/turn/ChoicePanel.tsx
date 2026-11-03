import { motion } from 'motion/react'
import { DIFFICULTIES, type Category, type Difficulty, type WheelSegment } from '../../domain/types'
import { categoryRuleLabel, difficultyRuleLabel, readableOn } from '../wheel/labels'

/** What the wheel landed on, in words. */
export function LandedSummary({ segment, categories }: { segment: WheelSegment; categories: Category[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-stage-800 px-3 py-1 text-sm font-semibold ring-1 ring-stage-600">
        {categoryRuleLabel(segment.category, categories)}
      </span>
      <span className="rounded-full bg-stage-800 px-3 py-1 text-sm font-semibold text-brass-300 ring-1 ring-stage-600">
        {difficultyRuleLabel(segment.difficulty)}
      </span>
    </div>
  )
}

interface CategoryChoiceProps {
  categories: Category[]
  options: string[]
  onChoose: (categoryId: string) => void
}

export function CategoryChoice({ categories, options, onChoose }: CategoryChoiceProps) {
  const enabled = new Set(options)
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-extrabold">Elige la categoría</h2>
      <p className="text-sm text-stage-300">
        {options.length} de {categories.length} categorías disponibles en esta tirada.
      </p>
      <ul className="grid grid-cols-2 gap-2">
        {categories.map((c, i) => {
          const on = enabled.has(c.id)
          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
            >
              <button
                type="button"
                disabled={!on}
                onClick={() => onChoose(c.id)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-semibold transition-transform enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-25 disabled:grayscale"
                style={{ backgroundColor: c.color, color: readableOn(c.color) }}
                aria-label={on ? c.name : `${c.name} (bloqueada)`}
              >
                <span aria-hidden="true">{on ? c.icon : '🔒'}</span>
                <span className="min-w-0 truncate">{c.name}</span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

interface DifficultyChoiceProps {
  category: Category | undefined
  options: Difficulty[]
  onChoose: (d: Difficulty) => void
}

export function DifficultyChoice({ category, options, onChoose }: DifficultyChoiceProps) {
  const enabled = new Set(options)
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-2xl font-extrabold">Elige la dificultad</h2>
      {category && (
        <p className="text-sm text-stage-300">
          Categoría: <span className="font-semibold text-stage-100">{category.name}</span>. Más difícil, más puntos.
        </p>
      )}
      <ul className="grid grid-cols-5 gap-2">
        {DIFFICULTIES.map((d, i) => {
          const on = enabled.has(d)
          return (
            <motion.li key={d} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
              <button
                type="button"
                disabled={!on}
                onClick={() => onChoose(d)}
                className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl bg-stage-800 ring-2 ring-brass-500 transition-transform enabled:hover:-translate-y-1 enabled:hover:bg-stage-700 disabled:cursor-not-allowed disabled:opacity-25 disabled:ring-stage-600"
                aria-label={on ? `${d} puntos` : `${d} puntos (bloqueada)`}
              >
                <span className="font-display text-3xl font-extrabold text-brass-400 tabular-nums">{on ? d : '🔒'}</span>
                <span className="text-xs text-stage-300">{d === 1 ? 'punto' : 'puntos'}</span>
              </button>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
