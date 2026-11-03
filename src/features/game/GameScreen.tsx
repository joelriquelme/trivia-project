import { AnimatePresence, motion } from 'motion/react'
import { useCallback } from 'react'
import { currentPlayer, type GameState } from '../../domain/game'
import type { AnswerIndex } from '../../domain/types'
import { sfx } from '../../audio/sfx'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../../ui/Button'
import { CategoryChoice, DifficultyChoice, LandedSummary } from '../turn/ChoicePanel'
import { ResultsScreen } from '../results/ResultsScreen'
import { Scoreboard } from '../scoreboard/Scoreboard'
import { QuestionCard } from '../turn/QuestionCard'
import { Wheel } from '../wheel/Wheel'

interface GameScreenProps {
  onExit: () => void
}

function roundLabel(game: GameState): string {
  if (game.tiebreakRound > 0) return `Muerte súbita · ronda ${game.tiebreakRound}`
  return `Ronda ${game.round} de ${game.config.rounds}`
}

function nextLabel(game: GameState): string {
  const nextIndex = game.turnIndex + 1
  if (nextIndex < game.turnOrder.length) {
    const next = game.players.find((p) => p.id === game.turnOrder[nextIndex])
    return `Turno de ${next?.name ?? 'siguiente'}`
  }
  if (game.tiebreakRound === 0 && game.round < game.config.rounds) return 'Siguiente ronda'
  return 'Ver resultado'
}

export function GameScreen({ onExit }: GameScreenProps) {
  const game = useGameStore((s) => s.game)
  const dispatch = useGameStore((s) => s.dispatch)
  const onAnswer = useCallback((index: AnswerIndex | null) => dispatch({ type: 'answer', index }), [dispatch])
  const onNext = useCallback(() => dispatch({ type: 'next' }), [dispatch])
  if (!game) return null

  if (game.finished) return <ResultsScreen key={game.history.length} game={game} onHome={onExit} />

  const turn = game.turn
  const player = currentPlayer(game)
  const categories = game.bank.categories
  const turnKey = `${game.round}-${game.tiebreakRound}-${game.turnIndex}-${game.history.length}`
  const segment = turn.phase === 'spin' ? null : turn.wheel[turn.segmentIndex]
  const showQuestion = turn.phase === 'question' || turn.phase === 'reveal'
  const question = showQuestion ? game.bank.questions.find((q) => q.id === turn.questionId) : undefined

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-wide text-stage-300 uppercase">{roundLabel(game)}</span>
          <p className="font-display text-2xl font-extrabold">
            Turno de <span style={{ color: player.color }}>{player.name}</span>
          </p>
        </div>
        <Button variant="ghost" onClick={onExit}>
          Salir
        </Button>
      </header>

      <Scoreboard game={game} />

      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Wheel
          segments={turn.wheel}
          categories={categories}
          spinId={turn.phase === 'spinning' ? turn.spinId : null}
          targetIndex={turn.phase === 'spin' ? null : turn.segmentIndex}
          canSpin={turn.phase === 'spin'}
          onSpinRequest={() => {
            sfx.whoosh()
            dispatch({ type: 'spin' })
          }}
          onTick={sfx.tick}
          onLand={sfx.land}
          onSpinEnd={() => dispatch({ type: 'spinEnd' })}
          turnKey={turnKey}
        />

        <section className="flex min-h-48 flex-col gap-5" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={turn.phase}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              {turn.phase === 'spin' && (
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-extrabold">¡A girar, {player.name}!</h2>
                  <p className="text-stage-300">
                    Toca <strong className="text-brass-400">GIRAR</strong> o arrastra la ruleta con fuerza. Cada casilla indica
                    la categoría y la dificultad; las doradas son libres y las rayadas te dejan elegir entre algunas opciones.
                  </p>
                </div>
              )}
              {turn.phase === 'spinning' && <h2 className="text-3xl font-extrabold text-brass-400">Girando…</h2>}
              {segment && turn.phase !== 'spinning' && <LandedSummary segment={segment} categories={categories} />}
              {turn.phase === 'chooseCategory' && (
                <CategoryChoice
                  categories={categories}
                  options={turn.options}
                  onChoose={(categoryId) => {
                    sfx.select()
                    dispatch({ type: 'chooseCategory', categoryId })
                  }}
                />
              )}
              {turn.phase === 'chooseDifficulty' && (
                <DifficultyChoice
                  category={categories.find((c) => c.id === turn.categoryId)}
                  options={turn.options}
                  onChoose={(difficulty) => {
                    sfx.select()
                    dispatch({ type: 'chooseDifficulty', difficulty })
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      <AnimatePresence>
        {showQuestion && question && (
          <motion.div
            key={question.id}
            className="fixed inset-0 z-20 grid place-items-center overflow-y-auto bg-stage-950/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <QuestionCard
              question={question}
              category={categories.find((c) => c.id === turn.categoryId)}
              difficulty={turn.difficulty}
              deadline={turn.phase === 'question' ? turn.deadline : null}
              timerSeconds={game.config.timerSeconds}
              reveal={turn.phase === 'reveal' ? { answerIndex: turn.answerIndex, correct: turn.correct, points: turn.points } : null}
              nextLabel={nextLabel(game)}
              onAnswer={onAnswer}
              onNext={onNext}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
