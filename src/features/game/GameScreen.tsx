import { currentPlayer } from '../../domain/game'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../../ui/Button'
import { Wheel } from '../wheel/Wheel'

interface GameScreenProps {
  onExit: () => void
}

export function GameScreen({ onExit }: GameScreenProps) {
  const game = useGameStore((s) => s.game)
  const dispatch = useGameStore((s) => s.dispatch)
  if (!game) return null

  const turn = game.turn
  const player = currentPlayer(game)
  const turnKey = `${game.round}-${game.tiebreakRound}-${game.turnIndex}-${game.history.length}`
  const landedIndex = turn.phase === 'spin' ? null : turn.segmentIndex
  const spinId = turn.phase === 'spin' ? null : turn.phase === 'spinning' ? turn.spinId : -1

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between gap-4">
        <p className="font-display text-lg font-bold">
          Turno de <span style={{ color: player.color }}>{player.name}</span>
        </p>
        <Button variant="ghost" onClick={onExit}>
          Salir
        </Button>
      </header>
      <Wheel
        segments={turn.wheel}
        categories={game.bank.categories}
        spinId={spinId === -1 ? null : spinId}
        targetIndex={landedIndex}
        canSpin={turn.phase === 'spin'}
        onSpinRequest={() => dispatch({ type: 'spin' })}
        onSpinEnd={() => dispatch({ type: 'spinEnd' })}
        turnKey={turnKey}
      />
    </main>
  )
}
