import { useBankStore } from '../../store/bankStore'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../../ui/Button'

interface HomeScreenProps {
  onNewGame: () => void
  onContinue: () => void
  onEditor: () => void
}

export function HomeScreen({ onNewGame, onContinue, onEditor }: HomeScreenProps) {
  const bank = useBankStore((s) => s.bank)
  const game = useGameStore((s) => s.game)
  const inProgress = game !== null && game.finished === null

  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-10 px-4 py-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <TitleWheel colors={bank.categories.map((c) => c.color)} />
        <h1 className="text-5xl font-extrabold tracking-tight text-brass-400 sm:text-6xl">Trivia Ruleta</h1>
        <p className="max-w-sm text-stage-300">
          Gira la ruleta, responde y suma 1, 2, 3, 5 u 8 puntos según la dificultad. Gana quien tenga más puntos al final.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {inProgress && (
          <Button size="lg" onClick={onContinue}>
            Continuar partida
          </Button>
        )}
        <Button size="lg" variant={inProgress ? 'secondary' : 'primary'} onClick={onNewGame}>
          Nueva partida
        </Button>
        <Button variant="ghost" onClick={onEditor}>
          Editor de preguntas
        </Button>
      </div>

      <p className="text-sm text-stage-300 tabular-nums">
        {bank.questions.length} preguntas · {bank.categories.length} categorías
      </p>
    </main>
  )
}

/** Small decorative wheel built from the category colors. */
function TitleWheel({ colors }: { colors: string[] }) {
  const n = Math.max(colors.length, 1)
  const stops = colors.map((c, i) => `${c} ${(i / n) * 360}deg ${((i + 1) / n) * 360}deg`).join(', ')
  return (
    <div
      aria-hidden="true"
      className="size-24 animate-[spin_18s_linear_infinite] rounded-full shadow-[0_0_0_6px_var(--color-brass-500),0_0_40px_-4px_var(--color-brass-500)] motion-reduce:animate-none"
      style={{ background: colors.length ? `conic-gradient(${stops})` : 'var(--color-stage-700)' }}
    >
      <div className="m-auto mt-[38%] size-6 rounded-full bg-brass-400 shadow-[0_0_0_3px_var(--color-stage-950)]" />
    </div>
  )
}
