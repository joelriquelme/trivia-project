import { useId, useState, type FormEvent } from 'react'
import { questionSchema } from '../../domain/bankSchema'
import { DIFFICULTIES, type AnswerIndex, type Category, type Difficulty, type Question } from '../../domain/types'
import { Button } from '../../ui/Button'

interface QuestionFormProps {
  initial: Question
  categories: Category[]
  isNew: boolean
  onSave: (q: Question) => void
  onCancel: () => void
}

const LETTERS = ['A', 'B', 'C', 'D']
const field = 'w-full rounded-lg bg-stage-950 px-3 py-2 ring-1 ring-stage-600 outline-none focus:ring-2 focus:ring-brass-400'

export function QuestionForm({ initial, categories, isNew, onSave, onCancel }: QuestionFormProps) {
  const [draft, setDraft] = useState<Question>(initial)
  const [errors, setErrors] = useState<string[]>([])
  const ids = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const problems: string[] = []
    if (draft.prompt.trim() === '' || draft.options.some((o) => o.trim() === '')) {
      problems.push('Completa el enunciado y las cuatro alternativas.')
    } else if (new Set(draft.options.map((o) => o.trim().toLowerCase())).size !== 4) {
      problems.push('Las cuatro alternativas deben ser distintas.')
    } else if (!questionSchema.safeParse(draft).success) {
      problems.push('Revisa la categoría y la dificultad de la pregunta.')
    }
    if (problems.length) {
      setErrors(problems)
      return
    }
    onSave({ ...draft, prompt: draft.prompt.trim(), options: draft.options.map((o) => o.trim()) as Question['options'] })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl bg-stage-900 p-5 ring-1 ring-stage-700">
      <h3 className="text-xl font-bold">{isNew ? 'Nueva pregunta' : 'Editar pregunta'}</h3>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${ids}-prompt`} className="text-sm font-semibold text-stage-300">
          Enunciado
        </label>
        <textarea
          id={`${ids}-prompt`}
          rows={2}
          maxLength={200}
          value={draft.prompt}
          onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
          className={field}
          placeholder="¿…?"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-stage-300">Alternativas (marca la correcta)</legend>
        {draft.options.map((option, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              id={`${ids}-correct-${i}`}
              name={`${ids}-correct`}
              checked={draft.correctIndex === i}
              onChange={() => setDraft({ ...draft, correctIndex: i as AnswerIndex })}
              className="size-5 accent-mint-500"
              aria-label={`Alternativa ${LETTERS[i]} es la correcta`}
            />
            <span className="w-5 font-display font-bold text-brass-400">{LETTERS[i]}</span>
            <input
              id={`${ids}-option-${i}`}
              value={option}
              maxLength={60}
              onChange={(e) => {
                const options = [...draft.options] as Question['options']
                options[i] = e.target.value
                setDraft({ ...draft, options })
              }}
              className={`${field} ${draft.correctIndex === i ? 'ring-mint-500' : ''}`}
              aria-label={`Alternativa ${LETTERS[i]}`}
            />
          </div>
        ))}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-category`} className="text-sm font-semibold text-stage-300">
            Categoría
          </label>
          <select
            id={`${ids}-category`}
            value={draft.categoryId}
            onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
            className={field}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-difficulty`} className="text-sm font-semibold text-stage-300">
            Dificultad (puntos)
          </label>
          <select
            id={`${ids}-difficulty`}
            value={draft.difficulty}
            onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) as Difficulty })}
            className={field}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d} {d === 1 ? 'punto' : 'puntos'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="list-disc rounded-lg bg-coral-500/10 py-2 pr-3 pl-7 text-sm text-coral-500" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">{isNew ? 'Agregar pregunta' : 'Guardar cambios'}</Button>
      </div>
    </form>
  )
}
