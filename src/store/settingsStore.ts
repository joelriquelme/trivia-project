import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsStore {
  muted: boolean
  toggleMuted: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      muted: false,
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
    }),
    { name: 'trivia.settings.v1', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)
