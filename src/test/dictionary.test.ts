import { describe, expect, it } from 'vitest'
import { acceptedExampleWords, isValidWord } from '../game/utils/dictionaryService'

describe('dictionary service', () => {
  it('accepts obvious common words that were previously missing', () => {
    expect(isValidWord('APPLE')).toBe(true)
    expect(isValidWord('COD')).toBe(true)
    expect(isValidWord('DOG')).toBe(true)
    expect(isValidWord('GUN')).toBe(true)
    expect(isValidWord('GUNS')).toBe(true)
    expect(isValidWord('SOS')).toBe(true)
    expect(isValidWord('TOWER')).toBe(true)
    expect(isValidWord('WORD')).toBe(true)
  })

  it('surfaces friendly example words for the HUD', () => {
    expect(acceptedExampleWords).toEqual(
      expect.arrayContaining(['CAT', 'DOG', 'SUN', 'STAR']),
    )
  })
})
