import coreWords from '../../data/core-words.json'
import validGameplayWords from '../../data/valid-gameplay-words.json'

const normalizeWordList = (entries: string[]) =>
  entries
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => entry.length >= 3 && /^[A-Z]+$/.test(entry))

export const coreAssistWords = normalizeWordList(coreWords as string[])
export const acceptedExampleWords = coreAssistWords.slice(0, 8)

const validationDictionary = new Set(normalizeWordList(validGameplayWords as string[]))

export const isValidWord = (word: string) => validationDictionary.has(word.toUpperCase())
