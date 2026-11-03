import { useId, useState, type FormEvent } from 'react'
import type { Category } from '../../domain/types'
import { useBankStore } from '../../store/bankStore'
import { Button } from '../../ui/Button'
import { ConfirmButton } from '../../ui/ConfirmButton'
import { readableOn } from '../wheel/labels'
import { slugify } from './importExport'

const field = 'min-w-0 rounded-lg bg-stage-950 px-3 py-2 ring-1 ring-stage-600 outline-none focus:ring-2 focus:ring-brass-400'

export function CategoriesTab() {
  const bank = useBankStore((s) => s.bank)
  const upsertCategory = useBankStore((s) => s.upsertCategory)
  const deleteCategory = useBankStore((s) => s.deleteCategory)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const countFor = (id: string) => bank.questions.filter((q) => q.categoryId === id).length

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stage-300">
        El nombre corto es el que aparece dentro de la ruleta; conviene que tenga 10 caracteres o menos.
      </p>
      <ul className="flex flex-col gap-2">
        {bank.categories.map((c) =>
          editingId === c.id ? (
            <li key={c.id}>
              <CategoryForm
                initial={c}
                onCancel={() => setEditingId(null)}
                onSave={(cat) => {
                  upsertCategory(cat)
                  setEditingId(null)
                }}
              />
            </li>
          ) : (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-stage-800 p-3">
              <span
                className="grid size-10 place-items-center rounded-full text-lg"
                style={{ backgroundColor: c.color, color: readableOn(c.color) }}
                aria-hidden="true"
              >
                {c.icon}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{c.name}</span>
                <span className="text-sm text-stage-300">
                  En la ruleta: «{c.short}» · {countFor(c.id)} preguntas
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setEditingId(c.id)}>
                  Editar
                </Button>
                <ConfirmButton
                  label="Borrar"
                  prompt={
                    countFor(c.id) > 0
                      ? `Se borrarán también sus ${countFor(c.id)} preguntas.`
                      : '¿Borrar esta categoría?'
                  }
                  confirmLabel="Borrar todo"
                  onConfirm={() => deleteCategory(c.id)}
                />
              </div>
            </li>
          ),
        )}
      </ul>

      {adding ? (
        <CategoryForm
          initial={{ id: '', name: '', short: '', color: '#4f8ff0', icon: '❓' }}
          onCancel={() => setAdding(false)}
          onSave={(cat) => {
            upsertCategory({ ...cat, id: slugify(cat.name, bank.categories.map((c) => c.id)) })
            setAdding(false)
          }}
        />
      ) : (
        <Button className="self-start" onClick={() => setAdding(true)}>
          Nueva categoría
        </Button>
      )}
    </div>
  )
}

function CategoryForm({ initial, onSave, onCancel }: { initial: Category; onSave: (c: Category) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState('')
  const ids = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = draft.name.trim()
    if (!name) return setError('La categoría necesita un nombre.')
    const short = draft.short.trim() || name.slice(0, 10)
    onSave({ ...draft, name, short, icon: draft.icon.trim() })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl bg-stage-900 p-4 ring-1 ring-stage-700">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_5rem_5rem]">
        <label className="flex flex-col gap-1 text-xs font-semibold text-stage-300" htmlFor={`${ids}-name`}>
          Nombre
          <input id={`${ids}-name`} value={draft.name} maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-stage-300" htmlFor={`${ids}-short`}>
          Nombre corto
          <input id={`${ids}-short`} value={draft.short} maxLength={12} onChange={(e) => setDraft({ ...draft, short: e.target.value })} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-stage-300" htmlFor={`${ids}-icon`}>
          Ícono
          <input id={`${ids}-icon`} value={draft.icon} maxLength={4} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} className={`${field} text-center`} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-stage-300" htmlFor={`${ids}-color`}>
          Color
          <input
            id={`${ids}-color`}
            type="color"
            value={draft.color}
            onChange={(e) => setDraft({ ...draft, color: e.target.value })}
            className="h-10 w-full cursor-pointer rounded-lg bg-stage-950 ring-1 ring-stage-600"
          />
        </label>
      </div>
      {error && (
        <p className="text-sm text-coral-500" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
