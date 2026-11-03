import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createGame, gameReducer, type Env, type GameAction, type GameConfig, type GameState } from '../domain/game'
import type { Bank } from '../domain/types'

interface GameStore {
  game: GameState | null
  /** Last setup used, to prefill the next one. */
  lastConfig: GameConfig | null
  start: (config: GameConfig, bank: Bank) => void
  dispatch: (action: GameAction) => void
  abandon: () => void
}

/** Real-world randomness and clock; tests use the pure reducer with a seeded Env instead. */
const liveEnv = (): Env => ({ rng: Math.random, now: Date.now() })

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,
      lastConfig: null,
      start: (config, bank) => set({ game: createGame(config, structuredClone(bank), liveEnv()), lastConfig: config }),
      dispatch: (action) => {
        const { game } = get()
        if (!game) return
        const next = gameReducer(game, action, liveEnv())
        if (next !== game) set({ game: next })
      },
      abandon: () => set({ game: null }),
    }),
    {
      name: 'trivia.game.v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ game: s.game, lastConfig: s.lastConfig }),
    },
  ),
)
