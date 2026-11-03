import { useRef, useState, type ChangeEvent } from 'react'
import { useBankStore } from '../../store/bankStore'
import { Button } from '../../ui/Button'
import { ConfirmButton } from '../../ui/ConfirmButton'
import { CategoriesTab } from './CategoriesTab'
import { QuestionsTab } from './QuestionsTab'
import { exportFileName, parseBankFile, serializeBank } from './importExport'

type Tab = 'questions' | 'categories'
type Notice = { tone: 'ok' | 'error'; text: string; details?: string[] } | null

export function EditorScreen({ onBack }: { onBack: () => void }) {
  const bank = useBankStore((s) => s.bank)
  const replaceBank = useBankStore((s) => s.replaceBank)
  const resetToSeed = useBankStore((s) => s.resetToSeed)
  const [tab, setTab] = useState<Tab>('questions')
  const [notice, setNotice] = useState<Notice>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const exportBank = () => {
    const blob = new Blob([serializeBank(bank)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName()
    a.click()
    URL.revokeObjectURL(url)
    setNotice({ tone: 'ok', text: `Exportado: ${bank.questions.length} preguntas en ${bank.categories.length} categorías.` })
  }

  const importBank = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const result = parseBankFile(await file.text())
    if (!result.ok) {
      setNotice({ tone: 'error', text: `No se pudo importar «${file.name}». Corrige estos problemas y vuelve a intentarlo:`, details: result.errors })
      return
    }
    replaceBank(result.bank)
    setNotice({ tone: 'ok', text: `Importado «${file.name}»: ${result.bank.questions.length} preguntas en ${result.bank.categories.length} categorías.` })
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brass-400 sm:text-4xl">Editor de preguntas</h1>
          <p className="text-sm text-stage-300 tabular-nums">
            {bank.questions.length} preguntas · {bank.categories.length} categorías · los cambios se guardan solos en este navegador
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Volver
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={exportBank}>
          Exportar JSON
        </Button>
        <Button variant="secondary" onClick={() => fileInput.current?.click()}>
          Importar JSON
        </Button>
        <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={importBank} aria-label="Archivo JSON del banco" />
        <ConfirmButton
          label="Restaurar banco original"
          prompt="Se reemplazará todo el banco por el original."
          confirmLabel="Restaurar"
          onConfirm={() => {
            resetToSeed()
            setNotice({ tone: 'ok', text: 'Banco original restaurado.' })
          }}
        />
      </div>
      <p className="-mt-3 text-xs text-stage-300">Importar reemplaza el banco actual. Exporta antes si quieres conservarlo.</p>

      {notice && (
        <div
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`flex items-start justify-between gap-3 rounded-xl p-3 text-sm ${notice.tone === 'error' ? 'bg-coral-500/15 text-coral-500' : 'bg-mint-500/15 text-mint-500'}`}
        >
          <div>
            <p>{notice.text}</p>
            {notice.details && (
              <ul className="mt-1 list-disc pl-5">
                {notice.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" onClick={() => setNotice(null)} className="font-bold" aria-label="Cerrar aviso">
            ✕
          </button>
        </div>
      )}

      <div role="tablist" aria-label="Secciones del editor" className="flex gap-1 rounded-xl bg-stage-900 p-1 ring-1 ring-stage-700">
        {(
          [
            ['questions', 'Preguntas'],
            ['categories', 'Categorías'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-4 py-2 font-display font-bold transition-colors ${tab === key ? 'bg-brass-500 text-stage-950' : 'text-stage-300 hover:bg-stage-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel">{tab === 'questions' ? <QuestionsTab /> : <CategoriesTab />}</div>
    </main>
  )
}
