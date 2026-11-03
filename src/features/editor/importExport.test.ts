import { SEED_BANK } from '../../data/seed'
import { makeBank } from '../../test/fixtures'
import { coverage, exportFileName, parseBankFile, serializeBank, slugify } from './importExport'

describe('import / export', () => {
  it('round-trips the seed bank', () => {
    const result = parseBankFile(serializeBank(SEED_BANK))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.bank).toEqual(SEED_BANK)
  })

  it('accepts a bare {categories, questions} object', () => {
    const bank = makeBank(['a'], 1)
    expect(parseBankFile(JSON.stringify(bank)).ok).toBe(true)
  })

  it('rejects text that is not JSON', () => {
    expect(parseBankFile('{nope')).toEqual({ ok: false, errors: ['El archivo no es un JSON válido.'] })
  })

  it('reports schema problems with their location', () => {
    const bank = makeBank(['a'], 1)
    bank.questions[0] = { ...bank.questions[0], categoryId: 'ghost' }
    const result = parseBankFile(JSON.stringify(bank))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toContain('questions.0.categoryId')
  })

  it('rejects repeated options in a question', () => {
    const bank = makeBank(['a'], 1)
    bank.questions[0] = { ...bank.questions[0], options: ['X', 'x', 'Y', 'Z'] }
    expect(parseBankFile(JSON.stringify(bank)).ok).toBe(false)
  })

  it('names export files by date', () => {
    expect(exportFileName(new Date(2026, 10, 3))).toBe('trivia-banco-20261103.json')
  })
})

describe('slugify', () => {
  it('strips accents and symbols', () => {
    expect(slugify('Ciencia y Tecnología!', [])).toBe('ciencia-y-tecnologia')
  })
  it('avoids taken ids', () => {
    expect(slugify('Historia', ['historia', 'historia-2'])).toBe('historia-3')
  })
  it('falls back when nothing usable is left', () => {
    expect(slugify('¿¿??', [])).toBe('categoria')
  })
})

describe('coverage', () => {
  it('counts questions per category and difficulty', () => {
    const table = coverage(makeBank(['a', 'b'], 2))
    expect(table.get('a')).toEqual({ 1: 2, 2: 2, 3: 2, 5: 2, 8: 2 })
  })
})
