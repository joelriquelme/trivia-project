import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useBankStore } from './store/bankStore'
import { useGameStore } from './store/gameStore'

// Dev-only handle to inspect and drive the stores from the browser console.
if (import.meta.env.DEV) {
  Object.assign(window, { __trivia: { game: useGameStore, bank: useBankStore } })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
