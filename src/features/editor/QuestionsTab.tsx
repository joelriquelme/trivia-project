import { useId, useMemo, useState } from 'react'
import { DIFFICULTIES, type Difficulty, type Question } from '../../domain/types'
import { newId, useBankStore } from '../../store/bankStore'
import { Button } from '../../ui/Button'
import { ConfirmButton } from '../../ui/ConfirmButton'
import { readableOn } from '../wheel/labels'
import { QuestionForm } from './QuestionForm'
import { coverage } from './importExport'

const PAGE = 40
const field = 'rounded-lg bg-stage-900 px-3 py-2 ring-1 ring-stage-600 outline-none focus:ring-2 focus:ring-brass-400'

export function QuestionsTab() {
  const bank = useBankStore((s) => s.bank)
  const upsertQuestion = useBankStore((s) => s.upsertQuestion)
  const deleteQuestion = useBankStore((s) => s.deleteQuestion)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 0>(0)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<{ question: Question; isNew: boolean } | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const ids = useId()

  const categoryById = useMemo(() => new Map(bank.categories.map((c) => [c.id, c])), [bank.categories])
  const table = useMemo(() => coverage(bank), [bank])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return bank.questions.filter(
      (q) =>
        (!categoryFilter || q.categoryId === categoryFilter) &&
        (!difficultyFilter || q.difficulty === difficultyFilter) &&
        (!term || q.prompt.toLowerCase().includes(term) || q.options.some((o) => o.toLowerCase().includes(term))),
    )
  }, [bank.questions, categoryFilter, difficultyFilter, search])

  const startNew = () => {
    const categoryId = categoryFilter || bank.categories[0]?.id
    if (!categoryId) return
    setEditing({
      isNew: true,
      question: {
        id: newId('q'),
        categoryId,
        difficulty: difficultyFilter || 1,
        prompt: '',
        options: ['', '', '', ''],
        correctIndex: 0,
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2" aria-labelledby={`${ids}-coverage`}>
        <h2 id={`${ids}-coverage`} className="text-lg font-bold">
          Preguntas por categoría y dificultad
        </h2>
        <p className="text-sm text-stage-300">Toca una celda para filtrar. En rojo, combinaciones sin preguntas; en amarillo, con menos de 3.</p>
        <div className="overflow-x-auto rounded-xl ring-1 ring-stage-700">
          <table className="w-full min-w-[34rem] text-sm tabular-nums">
            <thead className="bg-stage-800 text-stage-300">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Categoría</th>
                {DIFFICULTIES.map((d) => (
                  <th key={d} className="px-2 py-2 font-semibold">
                    {d} pts
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bank.categories.map((c) => {
                const row = table.get(c.id)!
                return (
                  <tr key={c.id} className="border-t border-stage-800">
                    <th scope="row" className="px-3 py-1.5 text-left font-semibold">
                      <span className="mr-2" aria-hidden="true">
                        {c.icon}
                      </span>
                      {c.name}
                    </th>
                    {DIFFICULTIES.map((d) => {
                      const n = row[d]
                      const tone = n === 0 ? 'bg-coral-500/25 text-coral-500' : n < 3 ? 'bg-brass-500/20 text-brass-300' : 'text-stage-100'
                      const active = categoryFilter === c.id && difficultyFilter === d
                      return (
                        <td key={d} className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryFilter(c.id)
                              setDifficultyFilter(d)
                              setLimit(PAGE)
                            }}
                            className={`w-full rounded-md py-1 font-bold hover:ring-1 hover:ring-brass-400 ${tone} ${active ? 'ring-2 ring-brass-400' : ''}`}
                            aria-label={`${c.name}, ${d} puntos: ${n} preguntas`}
                          >
                            {n}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <QuestionForm
          key={editing.question.id}
          initial={editing.question}
          categories={bank.categories}
          isNew={editing.isNew}
          onCancel={() => setEditing(null)}
          onSave={(q) => {
            upsertQuestion(q)
            setEditing(null)
          }}
        />
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${ids}-cat`} className="text-xs font-semibold text-stage-300">
              Categoría
            </label>
            <select id={`${ids}-cat`} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={field}>
              <option value="">Todas</option>
              {bank.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${ids}-dif`} className="text-xs font-semibold text-stage-300">
              Dificultad
            </label>
            <select
              id={`${ids}-dif`}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(Number(e.target.value) as Difficulty | 0)}
              className={field}
            >
              <option value={0}>Todas</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d} pts
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-48 flex-1 flex-col gap-1">
            <label htmlFor={`${ids}-q`} className="text-xs font-semibold text-stage-300">
              Buscar
            </label>
            <input id={`${ids}-q`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Texto de la pregunta o alternativas" className={field} />
          </div>
          <Button onClick={startNew} disabled={bank.categories.length === 0}>
            Nueva pregunta
          </Button>
        </div>
      )}

      <section className="flex flex-col gap-2" aria-label="Preguntas">
        <p className="text-sm text-stage-300 tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'pregunta' : 'preguntas'}
          {(categoryFilter || difficultyFilter || search) && (
            <button
              type="button"
              className="ml-3 text-brass-400 underline-offset-2 hover:underline"
              onClick={() => {
                setCategoryFilter('')
                setDifficultyFilter(0)
                setSearch('')
              }}
            >
              Quitar filtros
            </button>
          )}
        </p>
        <ul className="flex flex-col gap-2">
          {filtered.slice(0, limit).map((q) => {
            const c = categoryById.get(q.categoryId)
            return (
              <li key={q.id} className="flex flex-col gap-2 rounded-xl bg-stage-800 p-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    {c && (
                      <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: c.color, color: readableOn(c.color) }}>
                        {c.name}
                      </span>
                    )}
                    <span className="rounded-full px-2 py-0.5 text-brass-400 ring-1 ring-brass-500">{q.difficulty} pts</span>
                  </div>
                  <p className="font-semibold">{q.prompt}</p>
                  <p className="text-sm text-stage-300">
                    Respuesta: <span className="text-mint-500">{q.options[q.correctIndex]}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setEditing({ question: q, isNew: false })}>
                    Editar
                  </Button>
                  <ConfirmButton label="Borrar" prompt="¿Borrar esta pregunta?" onConfirm={() => deleteQuestion(q.id)} />
                </div>
              </li>
            )
          })}
        </ul>
        {filtered.length > limit && (
          <Button variant="ghost" className="self-center" onClick={() => setLimit((l) => l + PAGE)}>
            Mostrar más ({filtered.length - limit} restantes)
          </Button>
        )}
      </section>
    </div>
  )
}
