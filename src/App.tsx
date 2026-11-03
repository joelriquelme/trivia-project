import { useState } from 'react'
import { EditorScreen } from './features/editor/EditorScreen'
import { GameScreen } from './features/game/GameScreen'
import { HomeScreen } from './features/home/HomeScreen'
import { SetupScreen } from './features/setup/SetupScreen'
import { useGameStore } from './store/gameStore'
import { MuteButton } from './ui/MuteButton'

type Screen = 'home' | 'setup' | 'game' | 'editor'

function App() {
  const hasGame = useGameStore((s) => s.game !== null)
  const [screen, setScreen] = useState<Screen>('home')

  let content
  if (screen === 'setup') content = <SetupScreen onBack={() => setScreen('home')} onStarted={() => setScreen('game')} />
  else if (screen === 'editor') content = <EditorScreen onBack={() => setScreen('home')} />
  else if (screen === 'game' && hasGame) content = <GameScreen onExit={() => setScreen('home')} />
  else
    content = (
      <HomeScreen
        onNewGame={() => setScreen('setup')}
        onContinue={() => setScreen('game')}
        onEditor={() => setScreen('editor')}
      />
    )

  return (
    <>
      {content}
      <MuteButton />
    </>
  )
}

export default App
