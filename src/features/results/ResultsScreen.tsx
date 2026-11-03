import confetti from 'canvas-confetti'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import type { GameState, Player } from '../../domain/game'
import { ranking } from '../../domain/scoring'
import { useBankStore } from '../../store/bankStore'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../../ui/Button'
import { CrownIcon } from '../../ui/CrownIcon'

interface ResultsScreenProps {
  game: GameState
  onHome: () => void
}

const PODIUM_HEIGHT: Record<number, string> = { 1: 'h-40', 2: 'h-28', 3: 'h-20' }

export function ResultsScreen({ game, onHome }: ResultsScreenProps) {
  const start = useGameStore((s) => s.start)
  const bank = useBankStore((s) => s.bank)
  const finished = game.finished!
  const ranked = ranking(game.players)
  const winners = game.players.filter((p) => finished.winners.includes(p.id))
  const podium = ranked.filter((r) => r.rank <= 3)
  // Classic podium order: 2nd, 1st, 3rd.
  const podiumOrder = [...podium.filter((r) => r.rank === 2), ...podium.filter((r) => r.rank === 1), ...podium.filter((r) => r.rank === 3)]

  useEffect(() => {
    const colors = winners.map((w) => w.color).concat('#f1c25e', '#ffffff')
    const end = Date.now() + 2200
    let frame = 0
    const burst = () => {
      void confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true })
      void confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true })
      if (Date.now() < end) frame = requestAnimationFrame(burst)
    }
    frame = requestAnimationFrame(burst)
    return () => cancelAnimationFrame(frame)
    // Celebrate once per finished game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = (p: Player) => {
    const turns = game.history.filter((h) => h.playerId === p.id)
    return { turns: turns.length, correct: turns.filter((h) => h.correct).length }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 py-10 text-center">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2">
        <span className="text-sm font-semibold tracking-wide text-stage-300 uppercase">
          {finished.reason === 'tiebreak'
            ? `Definido en muerte súbita (${game.tiebreakRound} ${game.tiebreakRound === 1 ? 'ronda extra' : 'rondas extra'})`
            : finished.reason === 'exhausted'
              ? 'Se acabaron las preguntas disponibles'
              : `Fin de las ${game.config.rounds} rondas`}
        </span>
        <h1 className="text-4xl font-extrabold text-brass-400 sm:text-6xl">
          {winners.length === 1 ? `¡Gana ${winners[0].name}!` : '¡Victoria compartida!'}
        </h1>
        {winners.length > 1 && <p className="text-lg text-stage-100">{winners.map((w) => w.name).join(' y ')}</p>}
      </motion.div>

      <div className="flex w-full items-end justify-center gap-3" aria-hidden="true">
        {podiumOrder.map(({ player, rank }, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (3 - rank) * 0.25 + i * 0.05, type: 'spring', stiffness: 160, damping: 16 }}
            className="flex w-28 flex-col items-center gap-2 sm:w-36"
          >
            <span className="grid size-12 place-items-center rounded-full font-display text-xl font-extrabold text-stage-950 shadow-lg" style={{ backgroundColor: player.color }}>
              {rank === 1 ? <CrownIcon className="size-6" /> : player.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="w-full truncate font-semibold">{player.name}</span>
            <div
              className={`flex w-full flex-col items-center justify-start gap-1 rounded-t-xl pt-3 ${PODIUM_HEIGHT[rank]} ${rank === 1 ? 'bg-brass-500 text-stage-950' : 'bg-stage-700'}`}
            >
              <span className="font-display text-3xl font-extrabold">{rank}°</span>
              <span className="text-sm font-bold tabular-nums">{player.score} pts</span>
            </div>
          </motion.div>
        ))}
      </div>

      <table className="w-full max-w-lg text-left">
        <caption className="sr-only">Clasificación final</caption>
        <thead className="text-sm text-stage-300">
          <tr>
            <th className="py-2 font-semibold">Puesto</th>
            <th className="py-2 font-semibold">Jugador</th>
            <th className="py-2 text-right font-semibold">Aciertos</th>
            <th className="py-2 text-right font-semibold">Puntos</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {ranked.map(({ player, rank }) => {
            const s = stats(player)
            return (
              <tr key={player.id} className="border-t border-stage-800">
                <td className="py-2 font-display font-bold">{rank}°</td>
                <td className="py-2">
                  <span className="mr-2 inline-block size-3 rounded-full align-middle" style={{ backgroundColor: player.color }} />
                  {player.name}
                </td>
                <td className="py-2 text-right">
                  {s.correct} / {s.turns}
                </td>
                <td className="py-2 text-right font-display font-extrabold text-brass-400">{player.score}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => start(game.config, bank)}>
          Jugar de nuevo
        </Button>
        <Button size="lg" variant="ghost" onClick={onHome}>
          Volver al inicio
        </Button>
      </div>
    </main>
  )
}
