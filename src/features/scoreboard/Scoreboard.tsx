import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'
import type { GameState } from '../../domain/game'
import { leaders } from '../../domain/scoring'
import { CrownIcon } from '../../ui/CrownIcon'

export function Scoreboard({ game }: { game: GameState }) {
  const currentId = game.turnOrder[game.turnIndex]
  const top = new Set(game.players.some((p) => p.score > 0) ? leaders(game.players) : [])
  const inTiebreak = game.tiebreakRound > 0

  return (
    <ol className="flex flex-wrap gap-2" aria-label="Marcador">
      {game.players.map((p) => {
        const isCurrent = p.id === currentId && !game.finished
        const out = inTiebreak && !game.turnOrder.includes(p.id)
        return (
          <motion.li
            key={p.id}
            layout
            className={`flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 transition-colors ${isCurrent ? 'bg-stage-700 ring-2' : 'bg-stage-800 ring-1 ring-stage-700'} ${out ? 'opacity-40' : ''}`}
            style={isCurrent ? { ['--tw-ring-color' as string]: p.color } : undefined}
            aria-current={isCurrent ? 'true' : undefined}
          >
            <span
              className="grid size-7 place-items-center rounded-full font-display text-sm font-extrabold text-stage-950"
              style={{ backgroundColor: p.color }}
              aria-hidden="true"
            >
              {top.has(p.id) ? <CrownIcon /> : p.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-[9rem] truncate font-semibold">{p.name}</span>
            <AnimatedScore value={p.score} />
          </motion.li>
        )
      })}
    </ol>
  )
}

function AnimatedScore({ value }: { value: number }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => Math.round(v).toString())
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' })
    return () => controls.stop()
  }, [mv, value])
  return (
    <motion.span
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.35, 1] }}
      transition={{ duration: 0.5 }}
      className="font-display text-lg font-extrabold text-brass-400 tabular-nums"
      aria-label={`${value} puntos`}
    >
      {text}
    </motion.span>
  )
}
