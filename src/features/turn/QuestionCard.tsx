import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import type { AnswerIndex, Category, Difficulty, Question } from '../../domain/types'
import { Button } from '../../ui/Button'
import { readableOn } from '../wheel/labels'
import { useNow } from './useNow'

const LETTERS = ['A', 'B', 'C', 'D'] as const

export interface RevealInfo {
  answerIndex: AnswerIndex | null
  correct: boolean
  points: number
}

interface QuestionCardProps {
  question: Question
  category: Category | undefined
  difficulty: Difficulty
  /** Present while the question is open. */
  deadline: number | null
  timerSeconds: number
  reveal: RevealInfo | null
  nextLabel: string
  onAnswer: (index: AnswerIndex | null) => void
  onNext: () => void
}

export function QuestionCard(props: QuestionCardProps) {
  const { question, category, difficulty, deadline, timerSeconds, reveal, nextLabel, onAnswer, onNext } = props
  const open = reveal === null && deadline !== null
  const now = useNow(open)
  const remainingMs = deadline === null ? 0 : Math.max(0, deadline - now)
  // Time is up: answer as a timeout. The reducer ignores repeats once the phase moves on.
  const timeUp = open && remainingMs <= 0
  useEffect(() => {
    if (timeUp) onAnswer(null)
  }, [timeUp, onAnswer])

  // Keyboard: 1-4 or A-D to answer, Enter to continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (open) {
        const i = '1234'.indexOf(e.key) !== -1 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase())
        if (i !== -1 && e.key.length === 1) onAnswer(i as AnswerIndex)
      } else if (reveal && e.key === 'Enter') {
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, reveal, onAnswer, onNext])

  const accent = category?.color ?? '#285a72'
  const fraction = timerSeconds > 0 ? remainingMs / (timerSeconds * 1000) : 0
  const secondsLeft = Math.ceil(remainingMs / 1000)
  const urgent = open && secondsLeft <= 5

  return (
    <motion.section
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className="relative flex w-full max-w-2xl flex-col gap-5 overflow-hidden rounded-3xl bg-stage-900 p-5 shadow-2xl ring-1 ring-stage-700 sm:p-7"
      aria-labelledby="question-prompt"
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: accent }} aria-hidden="true" />

      <header className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
          style={{ backgroundColor: accent, color: readableOn(accent) }}
        >
          <span aria-hidden="true">{category?.icon}</span>
          {category?.name ?? 'Categoría'}
        </span>
        <span className="rounded-full bg-stage-800 px-3 py-1 text-sm font-bold text-brass-400 ring-1 ring-brass-500 tabular-nums">
          {difficulty} {difficulty === 1 ? 'punto' : 'puntos'}
        </span>
        {open && (
          <span
            className={`ml-auto font-display text-2xl font-extrabold tabular-nums ${urgent ? 'text-coral-500' : 'text-stage-100'}`}
            aria-live="off"
          >
            {secondsLeft}s
          </span>
        )}
      </header>

      {open && (
        <div className="h-2 overflow-hidden rounded-full bg-stage-800" role="progressbar" aria-label="Tiempo restante" aria-valuemin={0} aria-valuemax={timerSeconds} aria-valuenow={secondsLeft}>
          <div
            className={`h-full rounded-full ${urgent ? 'bg-coral-500' : 'bg-brass-500'}`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      )}

      <h2 id="question-prompt" className="font-display text-2xl leading-tight font-bold sm:text-3xl">
        {question.prompt}
      </h2>

      <ol className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const isCorrect = i === question.correctIndex
          const isChosen = reveal?.answerIndex === i
          let tone = 'bg-stage-800 ring-stage-600 hover:bg-stage-700 hover:ring-brass-400'
          if (reveal) {
            if (isCorrect) tone = 'bg-mint-500/20 ring-mint-500 text-white'
            else if (isChosen) tone = 'bg-coral-500/20 ring-coral-500'
            else tone = 'bg-stage-800 ring-stage-700 opacity-50'
          }
          return (
            <li key={i}>
              <motion.button
                type="button"
                disabled={!open}
                onClick={() => onAnswer(i as AnswerIndex)}
                animate={reveal && isCorrect ? { scale: [1, 1.04, 1] } : reveal && isChosen ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                transition={{ duration: 0.5 }}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-lg font-semibold ring-2 transition-colors disabled:cursor-default ${tone}`}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg bg-stage-950 font-display text-base font-extrabold text-brass-400"
                  aria-hidden="true"
                >
                  {reveal && isCorrect ? '✓' : reveal && isChosen ? '✗' : LETTERS[i]}
                </span>
                <span className="min-w-0">{option}</span>
              </motion.button>
            </li>
          )
        })}
      </ol>

      <AnimatePresence>
        {reveal && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-stage-800 p-4"
            role="status"
          >
            <p className="font-display text-xl font-extrabold">
              {reveal.correct ? (
                <span className="text-mint-500">¡Correcto! +{reveal.points}</span>
              ) : reveal.answerIndex === null ? (
                <span className="text-coral-500">Se acabó el tiempo</span>
              ) : (
                <span className="text-coral-500">Incorrecto</span>
              )}
            </p>
            <Button onClick={onNext} autoFocus>
              {nextLabel}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
