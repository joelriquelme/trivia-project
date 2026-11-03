import { makeBank } from '../test/fixtures'
import { SEED_BANK } from '../data/seed'
import { useBankStore } from './bankStore'
import { useGameStore } from './gameStore'

describe('bank store', () => {
  beforeEach(() => useBankStore.getState().resetToSeed())

  it('deletes a category together with its questions', () => {
    const { deleteCategory } = useBankStore.getState()
    deleteCategory('historia')
    const { bank } = useBankStore.getState()
    expect(bank.categories.some((c) => c.id === 'historia')).toBe(false)
    expect(bank.questions.some((q) => q.categoryId === 'historia')).toBe(false)
  })

  it('updates an existing question in place', () => {
    const first = useBankStore.getState().bank.questions[0]
    useBankStore.getState().upsertQuestion({ ...first, prompt: 'Editada' })
    const { bank } = useBankStore.getState()
    expect(bank.questions[0].prompt).toBe('Editada')
    expect(bank.questions).toHaveLength(SEED_BANK.questions.length)
  })

  it('restores the seed without sharing references', () => {
    useBankStore.getState().replaceBank(makeBank(['x']))
    useBankStore.getState().resetToSeed()
    const { bank } = useBankStore.getState()
    expect(bank).toEqual(SEED_BANK)
    expect(bank).not.toBe(SEED_BANK)
  })

  it('persists to localStorage', () => {
    useBankStore.getState().deleteQuestion(useBankStore.getState().bank.questions[0].id)
    const saved = JSON.parse(localStorage.getItem('trivia.bank.v1')!)
    expect(saved.state.bank.questions).toHaveLength(SEED_BANK.questions.length - 1)
  })
})

describe('game store', () => {
  it('starts, advances and abandons a game', () => {
    const store = useGameStore.getState()
    store.start({ players: [{ name: 'Ana', color: '#fff' }], rounds: 1, timerSeconds: 20, tieMode: 'shared' }, makeBank(['a', 'b']))
    expect(useGameStore.getState().game?.turn.phase).toBe('spin')
    useGameStore.getState().dispatch({ type: 'spin' })
    expect(useGameStore.getState().game?.turn.phase).toBe('spinning')
    expect(useGameStore.getState().lastConfig?.players[0].name).toBe('Ana')
    useGameStore.getState().abandon()
    expect(useGameStore.getState().game).toBeNull()
  })
})
