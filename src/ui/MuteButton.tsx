import { useSettingsStore } from '../store/settingsStore'

export function MuteButton() {
  const muted = useSettingsStore((s) => s.muted)
  const toggle = useSettingsStore((s) => s.toggleMuted)
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      title={muted ? 'Activar sonido' : 'Silenciar'}
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-11 place-items-center rounded-full bg-stage-800 text-stage-100 shadow-lg ring-1 ring-stage-600 transition-colors hover:bg-stage-700"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
        {muted ? (
          <path d="m16 9 5 6m0-6-5 6" />
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  )
}
