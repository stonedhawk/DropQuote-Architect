import rawDictionary from '../../data/dictionary.json'

const fallbackDictionary = new Set(
  (rawDictionary as string[]).map((entry) => entry.toUpperCase()),
)

export const acceptedExampleWords = [
  'CAT',
  'DOG',
  'SUN',
  'STAR',
  'CODE',
  'GAME',
  'TILE',
  'STACK',
]

export const isValidWord = (word: string) => fallbackDictionary.has(word.toUpperCase())
