import rawDictionary from '../data/dictionary.json'
import coreWords from '../data/core-words.json'
import gameReadySmall from '../data/game-ready-small.json'
import playerExpectedWords from '../data/player-expected-words.json'
import validGameplayWords from '../data/valid-gameplay-words.json'
import validWordAdditions from '../data/valid-word-additions.json'
import { describe, expect, it } from 'vitest'
import { acceptedExampleWords, isValidWord } from '../game/utils/dictionaryService'

const normalizeWordList = (entries: string[]) =>
  entries
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => entry.length >= 3 && /^[A-Z]+$/.test(entry))

const flattenExpectedWordGroups = (groups: Record<string, string[]>) =>
  Object.values(groups).flat()

const legacyDictionary = new Set([
  ...normalizeWordList(rawDictionary as string[]),
  ...normalizeWordList(coreWords as string[]),
  ...normalizeWordList(validWordAdditions as string[]),
])

const gameReadyOnlyWord = normalizeWordList(gameReadySmall as string[]).find(
  (word) => !legacyDictionary.has(word),
)

const expectedEverydayWords = normalizeWordList(
  flattenExpectedWordGroups(playerExpectedWords as Record<string, string[]>),
)

const generatedValidationDictionary = new Set(
  normalizeWordList(validGameplayWords as string[]),
)

describe('dictionary service', () => {
  it('accepts obvious common words that were previously missing', () => {
    expect(isValidWord('APPLE')).toBe(true)
    expect(isValidWord('BOXES')).toBe(true)
    expect(isValidWord('COD')).toBe(true)
    expect(isValidWord('CODES')).toBe(true)
    expect(isValidWord('DOG')).toBe(true)
    expect(isValidWord('GUN')).toBe(true)
    expect(isValidWord('GUNS')).toBe(true)
    expect(isValidWord('HEN')).toBe(true)
    expect(isValidWord('POT')).toBe(true)
    expect(isValidWord('QUEUES')).toBe(true)
    expect(isValidWord('SOS')).toBe(true)
    expect(isValidWord('STACKS')).toBe(true)
    expect(isValidWord('TILES')).toBe(true)
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

  it('accepts the curated player-expected everyday word pack', () => {
    expectedEverydayWords.forEach((word) => {
      expect(isValidWord(word)).toBe(true)
    })
  })

  it('uses the generated gameplay dictionary as the runtime backbone', () => {
    expect(generatedValidationDictionary.size).toBeGreaterThan(legacyDictionary.size)
    expect(generatedValidationDictionary.has('QUEUES')).toBe(true)
    expect(generatedValidationDictionary.has('TILES')).toBe(true)
    expect(generatedValidationDictionary.has('TREES')).toBe(true)
  })

  it('surfaces friendly example words for the HUD', () => {
    expect(acceptedExampleWords).toEqual(
      expect.arrayContaining(['CAT', 'DOG', 'SUN', 'STAR']),
    )
  })
})
