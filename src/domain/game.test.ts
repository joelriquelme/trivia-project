import { makeBank, makeQuestion } from '../test/fixtures'
import { createGame, currentPlayerId, gameReducer, type Env, type GameConfig, type GameState } from './game'
import { seededRng } from './rng'
import { leaders, ranking } from './scoring'
import type { AnswerIndex, Bank } from './types'

const CATS = ['his', 'geo', 'sci', 'dep']

function config(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    players: [
      { name: 'Ana', color: '#f00' },
      { name: 'Beto', color: '#0f0' },
    ],
    rounds: 2,
    timerSeconds: 20,
    tieMode: 'shared',
    ...overrides,
  }
}

function makeEnv(seed = 1) {
  const rng = seededRng(seed)
  const env: Env = { rng, now: 1_000_000 }
  return env
}

/** Play one full turn, answering correctly or not, and advance to the next turn. */
function playTurn(state: GameState, env: Env, answerCorrectly: boolean): GameState {
  let s = gameReducer(state, { type: 'spin' }, env)
  s = gameReducer(s, { type: 'spinEnd' }, env)
  if (s.turn.phase === 'chooseCategory') s = gameReducer(s, { type: 'chooseCategory', categoryId: s.turn.options[0] }, env)
  if (s.turn.phase === 'chooseDifficulty') s = gameReducer(s, { type: 'chooseDifficulty', difficulty: s.turn.options[0] }, env)
  expect(s.turn.phase).toBe('question')
  if (s.turn.phase !== 'question') throw new Error('unreachable')
  const questionId = s.turn.questionId
  const q = s.bank.questions.find((x) => x.id === questionId)!
  const index = (answerCorrectly ? q.correctIndex : (q.correctIndex + 1) % 4) as AnswerIndex
  s = gameReducer(s, { type: 'answer', index }, env)
  expect(s.turn.phase).toBe('reveal')
  return gameReducer(s, { type: 'next' }, env)
}

describe('createGame', () => {
  it('starts on round 1 with the first player and a ready wheel', () => {
    const s = createGame(config(), makeBank(CATS), makeEnv())
    expect(s.round).toBe(1)
    expect(currentPlayerId(s)).toBe('p1')
    expect(s.turn.phase).toBe('spin')
    if (s.turn.phase === 'spin') expect(s.turn.wheel.length).toBeGreaterThan(0)
    expect(s.players.map((p) => p.score)).toEqual([0, 0])
  })

  it('rejects a game without players', () => {
    expect(() => createGame(config({ players: [] }), makeBank(CATS), makeEnv())).toThrow()
  })
})

describe('turn flow', () => {
  it('awards the difficulty value for a correct answer and nothing for a wrong one', () => {
    const env = makeEnv(3)
    let s = createGame(config(), makeBank(CATS), env)
    s = playTurn(s, env, true)
    const first = s.history[0]
    expect(first.correct).toBe(true)
    expect(first.points).toBeGreaterThan(0)
    expect(s.players[0].score).toBe(first.points)
    s = playTurn(s, env, false)
    expect(s.history[1].points).toBe(0)
    expect(s.players[1].score).toBe(0)
  })

  it('never repeats a question', () => {
    const env = makeEnv(8)
    let s = createGame(config({ rounds: 10 }), makeBank(CATS, 1), env)
    while (!s.finished) s = playTurn(s, env, true)
    expect(new Set(s.usedQuestionIds).size).toBe(s.usedQuestionIds.length)
  })

  it('treats a late answer as a timeout', () => {
    const env = makeEnv(2)
    let s = createGame(config(), makeBank(CATS), env)
    s = gameReducer(s, { type: 'spin' }, env)
    s = gameReducer(s, { type: 'spinEnd' }, env)
    if (s.turn.phase === 'chooseCategory') s = gameReducer(s, { type: 'chooseCategory', categoryId: s.turn.options[0] }, env)
    if (s.turn.phase === 'chooseDifficulty') s = gameReducer(s, { type: 'chooseDifficulty', difficulty: s.turn.options[0] }, env)
    if (s.turn.phase !== 'question') throw new Error('expected question')
    const q = s.bank.questions.find((x) => x.id === (s.turn as { questionId: string }).questionId)!
    s = gameReducer(s, { type: 'answer', index: q.correctIndex }, { ...env, now: s.turn.deadline + 1 })
    expect(s.turn.phase === 'reveal' && s.turn.answerIndex).toBe(null)
    expect(s.players[0].score).toBe(0)
  })

  it('ignores actions that do not match the phase', () => {
    const env = makeEnv(4)
    const s = createGame(config(), makeBank(CATS), env)
    expect(gameReducer(s, { type: 'answer', index: 0 }, env)).toBe(s)
    expect(gameReducer(s, { type: 'next' }, env)).toBe(s)
  })

  it('rejects a category that was not offered', () => {
    const env = makeEnv(5)
    let s = createGame(config(), makeBank(CATS), env)
    for (let i = 0; i < 50 && s.turn.phase !== 'chooseCategory'; i++) {
      s = createGame(config(), makeBank(CATS), { ...env, rng: seededRng(i) })
      s = gameReducer(s, { type: 'spin' }, env)
      s = gameReducer(s, { type: 'spinEnd' }, env)
    }
    if (s.turn.phase !== 'chooseCategory') throw new Error('no choose segment found')
    const offered = s.turn.options
    const missing = CATS.find((c) => !offered.includes(c))
    if (missing) expect(gameReducer(s, { type: 'chooseCategory', categoryId: missing }, env)).toBe(s)
  })
})

describe('rounds and ending', () => {
  it('ends after the configured rounds with the top scorer as winner', () => {
    const env = makeEnv(6)
    let s = createGame(config({ rounds: 2 }), makeBank(CATS), env)
    s = playTurn(s, env, true) // Ana
    s = playTurn(s, env, false) // Beto
    expect(s.round).toBe(2)
    s = playTurn(s, env, true)
    s = playTurn(s, env, false)
    expect(s.finished).toEqual({ winners: ['p1'], reason: 'rounds' })
  })

  it('shares the victory on a tie in shared mode', () => {
    const env = makeEnv(7)
    let s = createGame(config({ rounds: 1 }), makeBank(CATS), env)
    s = playTurn(s, env, false)
    s = playTurn(s, env, false)
    expect(s.finished).toEqual({ winners: ['p1', 'p2'], reason: 'rounds' })
  })

  it('plays sudden death rounds only among tied players', () => {
    const env = makeEnv(9)
    const cfg = config({
      rounds: 1,
      tieMode: 'suddenDeath',
      players: [
        { name: 'A', color: '#000' },
        { name: 'B', color: '#000' },
        { name: 'C', color: '#000' },
      ],
    })
    let s = createGame(cfg, makeBank(CATS), env)
    s = playTurn(s, env, false) // A: 0
    s = playTurn(s, env, false) // B: 0
    s = playTurn(s, env, true) // C: >0 -> wins outright
    expect(s.finished?.winners).toEqual(['p3'])

    s = createGame(cfg, makeBank(CATS), env)
    s = playTurn(s, env, false)
    s = playTurn(s, env, false)
    s = playTurn(s, env, false) // all tied at 0
    expect(s.finished).toBeNull()
    expect(s.tiebreakRound).toBe(1)
    expect(s.turnOrder).toEqual(['p1', 'p2', 'p3'])
    s = playTurn(s, env, false) // A
    s = playTurn(s, env, true) // B scores
    s = playTurn(s, env, false) // C
    expect(s.finished).toEqual({ winners: ['p2'], reason: 'tiebreak' })
  })

  it('narrows sudden death to the players still tied', () => {
    const env = makeEnv(10)
    const cfg = config({
      rounds: 1,
      tieMode: 'suddenDeath',
      players: [
        { name: 'A', color: '#000' },
        { name: 'B', color: '#000' },
        { name: 'C', color: '#000' },
      ],
    })
    let s = createGame(cfg, makeBank(CATS), env)
    for (let i = 0; i < 3; i++) s = playTurn(s, env, false)
    expect(s.tiebreakRound).toBe(1)
    s = playTurn(s, env, false)
    s = playTurn(s, env, false)
    // Last tiebreak turn: before moving on, leave A and B tied above C.
    s = gameReducer(s, { type: 'spin' }, env)
    s = gameReducer(s, { type: 'spinEnd' }, env)
    if (s.turn.phase === 'chooseCategory') s = gameReducer(s, { type: 'chooseCategory', categoryId: s.turn.options[0] }, env)
    if (s.turn.phase === 'chooseDifficulty') s = gameReducer(s, { type: 'chooseDifficulty', difficulty: s.turn.options[0] }, env)
    s = gameReducer(s, { type: 'answer', index: null }, env)
    const scores: Record<string, number> = { p1: 3, p2: 3, p3: 0 }
    s = { ...s, players: s.players.map((p) => ({ ...p, score: scores[p.id] })) }
    s = gameReducer(s, { type: 'next' }, env)
    expect(s.finished).toBeNull()
    expect(s.tiebreakRound).toBe(2)
    expect(s.turnOrder).toEqual(['p1', 'p2'])
    expect(currentPlayerId(s)).toBe('p1')
  })

  it('ends early when the bank runs out, sharing among leaders', () => {
    const bank: Bank = { categories: makeBank(['his']).categories, questions: [makeQuestion('only', 'his', 3)] }
    const env = makeEnv(11)
    let s = createGame(config({ rounds: 5 }), bank, env)
    s = playTurn(s, env, true)
    expect(s.finished).toEqual({ winners: ['p1'], reason: 'exhausted' })
  })

  it('falls back to shared victory when sudden death runs out of questions', () => {
    const bank: Bank = {
      categories: makeBank(['his']).categories,
      questions: [makeQuestion('q1', 'his', 1), makeQuestion('q2', 'his', 1)],
    }
    const env = makeEnv(12)
    let s = createGame(config({ rounds: 1, tieMode: 'suddenDeath' }), bank, env)
    s = playTurn(s, env, false)
    s = playTurn(s, env, false)
    expect(s.finished).toEqual({ winners: ['p1', 'p2'], reason: 'exhausted' })
  })
})

describe('scoring helpers', () => {
  const players = [
    { id: 'a', score: 5 },
    { id: 'b', score: 8 },
    { id: 'c', score: 5 },
    { id: 'd', score: 1 },
  ]
  it('finds every leader', () => {
    expect(leaders(players)).toEqual(['b'])
    expect(leaders([{ id: 'x', score: 2 }, { id: 'y', score: 2 }])).toEqual(['x', 'y'])
  })
  it('ranks ties with the same position', () => {
    expect(ranking(players).map((r) => [r.player.id, r.rank])).toEqual([
      ['b', 1],
      ['a', 2],
      ['c', 2],
      ['d', 4],
    ])
  })
})
