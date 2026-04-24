import gameReadySmall from '../../data/game-ready-small.json'
import rawDictionary from '../../data/dictionary.json'
import coreWords from '../../data/core-words.json'
import validWordAdditions from '../../data/valid-word-additions.json'

const normalizeWordList = (entries: string[]) =>
  entries
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => entry.length >= 3 && /^[A-Z]+$/.test(entry))

export const coreAssistWords = normalizeWordList(coreWords as string[])
export const acceptedExampleWords = coreAssistWords.slice(0, 8)

const validationDictionary = new Set([
  ...normalizeWordList(gameReadySmall as string[]),
  ...normalizeWordList(rawDictionary as string[]),
  ...coreAssistWords,
  ...normalizeWordList(validWordAdditions as string[]),
])

export const isValidWord = (word: string) => validationDictionary.has(word.toUpperCase())
