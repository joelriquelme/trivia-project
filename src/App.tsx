import { useState } from 'react'
import { GameScreen } from './features/game/GameScreen'
import { HomeScreen } from './features/home/HomeScreen'
import { SetupScreen } from './features/setup/SetupScreen'
import { useGameStore } from './store/gameStore'

type Screen = 'home' | 'setup' | 'game' | 'editor'

function App() {
  const hasGame = useGameStore((s) => s.game !== null)
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'setup') return <SetupScreen onBack={() => setScreen('home')} onStarted={() => setScreen('game')} />
  if (screen === 'game' && hasGame) return <GameScreen onExit={() => setScreen('home')} />
  return (
    <HomeScreen
      onNewGame={() => setScreen('setup')}
      onContinue={() => setScreen('game')}
      onEditor={() => setScreen('editor')}
    />
  )
}

export default App
