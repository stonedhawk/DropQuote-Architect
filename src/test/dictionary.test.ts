import rawDictionary from '../data/dictionary.json'
import coreWords from '../data/core-words.json'
import gameReadySmall from '../data/game-ready-small.json'
import validWordAdditions from '../data/valid-word-additions.json'
import { describe, expect, it } from 'vitest'
import { acceptedExampleWords, isValidWord } from '../game/utils/dictionaryService'

const normalizeWordList = (entries: string[]) =>
  entries
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => entry.length >= 3 && /^[A-Z]+$/.test(entry))

const legacyDictionary = new Set([
  ...normalizeWordList(rawDictionary as string[]),
  ...normalizeWordList(coreWords as string[]),
  ...normalizeWordList(validWordAdditions as string[]),
])

const gameReadyOnlyWord = normalizeWordList(gameReadySmall as string[]).find(
  (word) => !legacyDictionary.has(word),
)

describe('dictionary service', () => {
  it('accepts obvious common words that were previously missing', () => {
    expect(isValidWord('APPLE')).toBe(true)
    expect(isValidWord('COD')).toBe(true)
    expect(isValidWord('DOG')).toBe(true)
    expect(isValidWord('GUN')).toBe(true)
    expect(isValidWord('GUNS')).toBe(true)
    expect(isValidWord('SOS')).toBe(true)
    expect(isValidWord('STACKS')).toBe(true)
    expect(isValidWord('TOWER')).toBe(true)
    expect(isValidWord('TRAINS')).toBe(true)
    expect(isValidWord('TREES')).toBe(true)
    expect(isValidWord('WORD')).toBe(true)
  })

  it('proves the imported game-ready source is part of validation', () => {
    expect(gameReadyOnlyWord).toBeTruthy()
    expect(legacyDictionary.has(gameReadyOnlyWord!)).toBe(false)
    expect(isValidWord(gameReadyOnlyWord!)).toBe(true)
  })

  it('surfaces friendly example words for the HUD', () => {
    expect(acceptedExampleWords).toEqual(
      expect.arrayContaining(['CAT', 'DOG', 'SUN', 'STAR']),
    )
  })
})
