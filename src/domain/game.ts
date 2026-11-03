import { computeAvailability, remainingIn } from './availability'
import { pickOne, type Rng } from './rng'
import { leaders } from './scoring'
import type { AnswerIndex, Bank, Difficulty, WheelSegment } from './types'
import { categoryOptions, difficultyOptions, generateWheel, pickSegmentIndex } from './wheel'

export type TieMode = 'shared' | 'suddenDeath'

export interface PlayerSetup {
  name: string
  color: string
}

export interface GameConfig {
  players: PlayerSetup[]
  rounds: number
  /** Seconds to answer each question. */
  timerSeconds: number
  tieMode: TieMode
}

export interface Player extends PlayerSetup {
  id: string
  score: number
}

interface Landed {
  wheel: WheelSegment[]
  segmentIndex: number
}

export type Turn =
  | { phase: 'spin'; wheel: WheelSegment[] }
  | ({ phase: 'spinning'; spinId: number } & Landed)
  | ({ phase: 'chooseCategory'; options: string[] } & Landed)
  | ({ phase: 'chooseDifficulty'; categoryId: string; options: Difficulty[] } & Landed)
  | ({ phase: 'question'; categoryId: string; difficulty: Difficulty; questionId: string; deadline: number } & Landed)
  | ({
      phase: 'reveal'
      categoryId: string
      difficulty: Difficulty
      questionId: string
      answerIndex: AnswerIndex | null
      correct: boolean
      points: number
    } & Landed)

export type EndReason = 'rounds' | 'tiebreak' | 'exhausted'

export interface TurnRecord {
  playerId: string
  questionId: string
  answerIndex: AnswerIndex | null
  correct: boolean
  points: number
  round: number
  tiebreak: boolean
}

export interface GameState {
  config: GameConfig
  /** Snapshot of the bank taken at start, so editing questions never breaks a running game. */
  bank: Bank
  players: Player[]
  usedQuestionIds: string[]
  /** Players taking turns this round: everyone, or only the tied ones during sudden death. */
  turnOrder: string[]
  turnIndex: number
  /** 1-based regular round; stays at config.rounds during sudden death. */
  round: number
  /** 0 during regular rounds, 1+ during sudden death. */
  tiebreakRound: number
  turn: Turn
  history: TurnRecord[]
  finished: null | { winners: string[]; reason: EndReason }
}

export interface Env {
  rng: Rng
  now: number
}

export type GameAction =
  | { type: 'spin' }
  | { type: 'spinEnd' }
  | { type: 'chooseCategory'; categoryId: string }
  | { type: 'chooseDifficulty'; difficulty: Difficulty }
  | { type: 'answer'; index: AnswerIndex | null }
  | { type: 'next' }

export function currentPlayerId(state: GameState): string {
  return state.turnOrder[state.turnIndex]
}

export function currentPlayer(state: GameState): Player {
  const id = currentPlayerId(state)
  return state.players.find((p) => p.id === id)!
}

function availability(state: Pick<GameState, 'bank' | 'usedQuestionIds'>) {
  return computeAvailability(state.bank, state.usedQuestionIds)
}

/** Start a new turn: build a wheel, or end the game when the bank is exhausted. */
function beginTurn(state: GameState, env: Env): GameState {
  const wheel = generateWheel(availability(state), env.rng)
  if (wheel.length === 0) {
    const pool = state.players.filter((p) => state.turnOrder.includes(p.id))
    return { ...state, finished: { winners: leaders(pool), reason: 'exhausted' } }
  }
  return { ...state, turn: { phase: 'spin', wheel } }
}

export function createGame(config: GameConfig, bank: Bank, env: Env): GameState {
  if (config.players.length === 0) throw new Error('createGame: at least one player is required')
  if (config.rounds < 1) throw new Error('createGame: at least one round is required')
  const players: Player[] = config.players.map((p, i) => ({ ...p, id: `p${i + 1}`, score: 0 }))
  const base: GameState = {
    config,
    bank,
    players,
    usedQuestionIds: [],
    turnOrder: players.map((p) => p.id),
    turnIndex: 0,
    round: 1,
    tiebreakRound: 0,
    turn: { phase: 'spin', wheel: [] },
    history: [],
    finished: null,
  }
  return beginTurn(base, env)
}

function startQuestion(state: GameState, landed: Landed, categoryId: string, difficulty: Difficulty, env: Env): GameState {
  const ids = remainingIn(availability(state), categoryId, difficulty)
  if (ids.length === 0) return state
  const questionId = pickOne(env.rng, ids)
  return {
    ...state,
    usedQuestionIds: [...state.usedQuestionIds, questionId],
    turn: {
      phase: 'question',
      ...landed,
      categoryId,
      difficulty,
      questionId,
      deadline: env.now + state.config.timerSeconds * 1000,
    },
  }
}

/** Category is settled: ask for a difficulty or go straight to the question. */
function settleCategory(state: GameState, landed: Landed, categoryId: string, env: Env): GameState {
  const segment = landed.wheel[landed.segmentIndex]
  const options = difficultyOptions(segment, availability(state), categoryId, env.rng)
  if (options.length === 0) return state
  if (segment.difficulty.kind === 'fixed' || options.length === 1) {
    return startQuestion(state, landed, categoryId, options[0], env)
  }
  return { ...state, turn: { phase: 'chooseDifficulty', ...landed, categoryId, options } }
}

/** Sudden death or final result once every player in turnOrder has played. */
function endOfRound(state: GameState, env: Env): GameState {
  const pool = state.players.filter((p) => state.turnOrder.includes(p.id))
  const top = leaders(pool)
  const regularOver = state.tiebreakRound > 0 || state.round >= state.config.rounds
  if (!regularOver) return beginTurn({ ...state, round: state.round + 1, turnIndex: 0 }, env)

  if (top.length === 1 || state.config.tieMode === 'shared') {
    return { ...state, finished: { winners: top, reason: state.tiebreakRound > 0 ? 'tiebreak' : 'rounds' } }
  }
  return beginTurn({ ...state, turnOrder: top, turnIndex: 0, tiebreakRound: state.tiebreakRound + 1 }, env)
}

export function gameReducer(state: GameState, action: GameAction, env: Env): GameState {
  if (state.finished) return state
  const turn = state.turn

  switch (action.type) {
    case 'spin': {
      if (turn.phase !== 'spin') return state
      const segmentIndex = pickSegmentIndex(env.rng, turn.wheel)
      return { ...state, turn: { phase: 'spinning', wheel: turn.wheel, segmentIndex, spinId: Math.floor(env.rng() * 1e9) } }
    }

    case 'spinEnd': {
      if (turn.phase !== 'spinning') return state
      const landed: Landed = { wheel: turn.wheel, segmentIndex: turn.segmentIndex }
      const segment = turn.wheel[turn.segmentIndex]
      const options = categoryOptions(segment, availability(state), env.rng)
      if (options.length === 0) return beginTurn(state, env)
      if (segment.category.kind === 'fixed' || options.length === 1) {
        return settleCategory(state, landed, options[0], env)
      }
      return { ...state, turn: { phase: 'chooseCategory', ...landed, options } }
    }

    case 'chooseCategory': {
      if (turn.phase !== 'chooseCategory' || !turn.options.includes(action.categoryId)) return state
      return settleCategory(state, { wheel: turn.wheel, segmentIndex: turn.segmentIndex }, action.categoryId, env)
    }

    case 'chooseDifficulty': {
      if (turn.phase !== 'chooseDifficulty' || !turn.options.includes(action.difficulty)) return state
      return startQuestion(
        state,
        { wheel: turn.wheel, segmentIndex: turn.segmentIndex },
        turn.categoryId,
        action.difficulty,
        env,
      )
    }

    case 'answer': {
      if (turn.phase !== 'question') return state
      const question = state.bank.questions.find((q) => q.id === turn.questionId)!
      // Answers that arrive after the deadline count as a timeout.
      const index = env.now > turn.deadline ? null : action.index
      const correct = index !== null && index === question.correctIndex
      const points = correct ? turn.difficulty : 0
      const playerId = currentPlayerId(state)
      return {
        ...state,
        players: state.players.map((p) => (p.id === playerId ? { ...p, score: p.score + points } : p)),
        history: [
          ...state.history,
          {
            playerId,
            questionId: turn.questionId,
            answerIndex: index,
            correct,
            points,
            round: state.round,
            tiebreak: state.tiebreakRound > 0,
          },
        ],
        turn: {
          phase: 'reveal',
          wheel: turn.wheel,
          segmentIndex: turn.segmentIndex,
          categoryId: turn.categoryId,
          difficulty: turn.difficulty,
          questionId: turn.questionId,
          answerIndex: index,
          correct,
          points,
        },
      }
    }

    case 'next': {
      if (turn.phase !== 'reveal') return state
      const nextIndex = state.turnIndex + 1
      if (nextIndex < state.turnOrder.length) return beginTurn({ ...state, turnIndex: nextIndex }, env)
      return endOfRound(state, env)
    }
  }
}
