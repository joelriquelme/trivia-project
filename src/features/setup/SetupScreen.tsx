import { useId, useState, type FormEvent, type ReactNode } from 'react'
import type { GameConfig, PlayerSetup, TieMode } from '../../domain/game'
import { useBankStore } from '../../store/bankStore'
import { useGameStore } from '../../store/gameStore'
import { Button } from '../../ui/Button'
import { MAX_PLAYERS, PLAYER_COLORS } from './constants'

const TIMER_OPTIONS = [10, 15, 20, 30, 45, 60]

const DEFAULT_CONFIG: GameConfig = {
  players: [
    { name: 'Jugador 1', color: PLAYER_COLORS[0] },
    { name: 'Jugador 2', color: PLAYER_COLORS[1] },
  ],
  rounds: 5,
  timerSeconds: 20,
  tieMode: 'suddenDeath',
}

interface SetupScreenProps {
  onBack: () => void
  onStarted: () => void
}

export function SetupScreen({ onBack, onStarted }: SetupScreenProps) {
  const bank = useBankStore((s) => s.bank)
  const lastConfig = useGameStore((s) => s.lastConfig)
  const start = useGameStore((s) => s.start)
  const [config, setConfig] = useState<GameConfig>(lastConfig ?? DEFAULT_CONFIG)
  const ids = useId()

  const names = config.players.map((p) => p.name.trim())
  const hasEmptyName = names.some((n) => n === '')
  const hasDuplicateName = new Set(names.map((n) => n.toLowerCase())).size !== names.length
  const turnsNeeded = config.players.length * config.rounds
  const shortBank = bank.questions.length < turnsNeeded
  const canStart = config.players.length > 0 && !hasEmptyName && !hasDuplicateName && bank.questions.length > 0

  const updatePlayer = (i: number, patch: Partial<PlayerSetup>) =>
    setConfig((c) => ({ ...c, players: c.players.map((p, j) => (j === i ? { ...p, ...patch } : p)) }))

  const addPlayer = () =>
    setConfig((c) => {
      const used = new Set(c.players.map((p) => p.color))
      const color = PLAYER_COLORS.find((col) => !used.has(col)) ?? PLAYER_COLORS[c.players.length % PLAYER_COLORS.length]
      return { ...c, players: [...c.players, { name: `Jugador ${c.players.length + 1}`, color }] }
    })

  const removePlayer = (i: number) => setConfig((c) => ({ ...c, players: c.players.filter((_, j) => j !== i) }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canStart) return
    start({ ...config, players: config.players.map((p) => ({ ...p, name: p.name.trim() })) }, bank)
    onStarted()
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-brass-400 sm:text-4xl">Nueva partida</h1>
        <Button variant="ghost" onClick={onBack}>
          Volver
        </Button>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-8">
        <section className="flex flex-col gap-3" aria-labelledby={`${ids}-players`}>
          <div className="flex items-baseline justify-between">
            <h2 id={`${ids}-players`} className="text-xl font-bold">
              Jugadores
            </h2>
            <span className="text-sm text-stage-300 tabular-nums">
              {config.players.length} / {MAX_PLAYERS}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {config.players.map((player, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 rounded-xl bg-stage-800 p-3">
                <label className="sr-only" htmlFor={`${ids}-name-${i}`}>
                  Nombre del jugador {i + 1}
                </label>
                <input
                  id={`${ids}-name-${i}`}
                  value={player.name}
                  maxLength={20}
                  onChange={(e) => updatePlayer(i, { name: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg bg-stage-900 px-3 py-2 font-semibold ring-1 ring-stage-600 outline-none focus:ring-2 focus:ring-brass-400"
                />
                <div className="flex gap-1.5" role="radiogroup" aria-label={`Color de ${player.name || `jugador ${i + 1}`}`}>
                  {PLAYER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={player.color === color}
                      aria-label={color}
                      onClick={() => updatePlayer(i, { color })}
                      className={`size-6 rounded-full transition-transform ${player.color === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-stage-800' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => removePlayer(i)}
                  disabled={config.players.length <= 1}
                  className="rounded-lg px-2 py-1 text-sm text-stage-300 hover:bg-stage-700 hover:text-white disabled:invisible"
                  aria-label={`Quitar a ${player.name || `jugador ${i + 1}`}`}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          {hasEmptyName && <p className="text-sm text-coral-500">Todos los jugadores necesitan un nombre.</p>}
          {hasDuplicateName && <p className="text-sm text-coral-500">Hay nombres repetidos; usa uno distinto para cada jugador.</p>}
          <Button variant="secondary" onClick={addPlayer} disabled={config.players.length >= MAX_PLAYERS} className="self-start">
            Agregar jugador
          </Button>
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Rondas</h2>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                aria-label="Menos rondas"
                onClick={() => setConfig((c) => ({ ...c, rounds: Math.max(1, c.rounds - 1) }))}
              >
                −
              </Button>
              <output className="w-12 text-center font-display text-3xl font-extrabold tabular-nums" aria-live="polite">
                {config.rounds}
              </output>
              <Button
                variant="secondary"
                aria-label="Más rondas"
                onClick={() => setConfig((c) => ({ ...c, rounds: Math.min(30, c.rounds + 1) }))}
              >
                +
              </Button>
            </div>
            <p className="text-sm text-stage-300">Cada jugador responde una pregunta por ronda.</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Tiempo por pregunta</h2>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tiempo por pregunta">
              {TIMER_OPTIONS.map((t) => (
                <Chip key={t} active={config.timerSeconds === t} onClick={() => setConfig((c) => ({ ...c, timerSeconds: t }))}>
                  {t} s
                </Chip>
              ))}
            </div>
            <p className="text-sm text-stage-300">Si se acaba el tiempo, la respuesta cuenta como incorrecta.</p>
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Si hay empate al final</h2>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Modo de desempate">
            <TieOption
              mode="suddenDeath"
              current={config.tieMode}
              onSelect={(tieMode) => setConfig((c) => ({ ...c, tieMode }))}
              title="Muerte súbita"
              text="Los empatados juegan rondas extra hasta que uno quede arriba."
            />
            <TieOption
              mode="shared"
              current={config.tieMode}
              onSelect={(tieMode) => setConfig((c) => ({ ...c, tieMode }))}
              title="Victoria compartida"
              text="Todos los empatados en el primer lugar ganan."
            />
          </div>
        </section>

        {shortBank && (
          <p className="rounded-xl bg-stage-800 p-3 text-sm text-brass-300">
            El banco tiene {bank.questions.length} preguntas y la partida necesita hasta {turnsNeeded}. Si se agotan, la
            partida termina antes.
          </p>
        )}

        <Button type="submit" size="lg" disabled={!canStart} className="self-stretch sm:self-end">
          Empezar partida
        </Button>
      </form>
    </main>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 font-semibold tabular-nums transition-colors ${active ? 'bg-brass-500 text-stage-950' : 'bg-stage-800 text-stage-100 hover:bg-stage-700'}`}
    >
      {children}
    </button>
  )
}

function TieOption(props: { mode: TieMode; current: TieMode; onSelect: (m: TieMode) => void; title: string; text: string }) {
  const active = props.mode === props.current
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => props.onSelect(props.mode)}
      className={`flex flex-col gap-1 rounded-xl p-4 text-left transition-colors ${active ? 'bg-stage-700 ring-2 ring-brass-400' : 'bg-stage-800 ring-1 ring-stage-700 hover:bg-stage-700'}`}
    >
      <span className="font-display text-lg font-bold">{props.title}</span>
      <span className="text-sm text-stage-300">{props.text}</span>
    </button>
  )
}
