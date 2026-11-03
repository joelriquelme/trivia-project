import { useState } from 'react'
import { HomeScreen } from './features/home/HomeScreen'
import { SetupScreen } from './features/setup/SetupScreen'

type Screen = 'home' | 'setup'

function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'setup') return <SetupScreen onBack={() => setScreen('home')} onStarted={() => setScreen('home')} />
  return <HomeScreen onNewGame={() => setScreen('setup')} onContinue={() => {}} onEditor={() => {}} />
}

export default App
