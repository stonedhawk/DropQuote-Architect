import { BOARD_HEIGHT, BOARD_WIDTH, LETTER_BAG } from '../constants'
import type { Axis, DifficultyBand, TileEntity, TilePreview } from '../types'
import { coreAssistWords, isValidWord } from './dictionaryService'
import { buildOccupancyMap, positionKey } from './board'

interface AssistOpportunity {
  axis: Axis
  letter: string
  targetWord: string
  runLength: number
}

const axisSteps: Record<
  Axis,
  { forward: { x: number; y: number }; backward: { x: number; y: number } }
> = {
  horizontal: {
    forward: { x: 1, y: 0 },
    backward: { x: -1, y: 0 },
  },
  vertical: {
    forward: { x: 0, y: 1 },
    backward: { x: 0, y: -1 },
  },
}

const buildNaturalVariants = (word: string) => {
  if (/(S|X|Z|CH|SH)$/.test(word)) {
    return [`${word}ES`]
  }

  if (/[^AEIOU]Y$/.test(word)) {
    return [`${word.slice(0, -1)}IES`]
  }

  return [`${word}S`]
}

const ASSIST_WORD_POOL = Array.from(
  new Set(
    coreAssistWords.flatMap((word) =>
      [word, ...buildNaturalVariants(word)].filter(isValidWord),
    ),
  ),
)

const FUN_FIRST_SEQUENCE = ASSIST_WORD_POOL.join('').split('')

const MIN_COMPLETION_RUN_LENGTH_BY_BAND: Record<DifficultyBand, number> = {
  guided: 2,
  steady: 2,
  climb: 2,
  survival: 3,
}

const collectRunLetters = (
  occupancy: Map<string, TileEntity>,
  tile: TileEntity,
  axis: Axis,
) => {
  const { forward, backward } = axisSteps[axis]

  let start = { x: tile.x, y: tile.y }
  while (occupancy.has(positionKey(start.x + backward.x, start.y + backward.y))) {
    start = { x: start.x + backward.x, y: start.y + backward.y }
  }

  const letters: string[] = []
  const cells: { x: number; y: number }[] = []
  let cursor = { ...start }
  while (occupancy.has(positionKey(cursor.x, cursor.y))) {
    const found = occupancy.get(positionKey(cursor.x, cursor.y))
    if (!found) {
      break
    }

    letters.push(found.isWildcard ? '?' : found.letter.toUpperCase())
    cells.push({ x: cursor.x, y: cursor.y })
    cursor = { x: cursor.x + forward.x, y: cursor.y + forward.y }
  }

  return { letters, cells }
}

const isOpenCell = (occupancy: Map<string, TileEntity>, x: number, y: number) =>
  x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && !occupancy.has(positionKey(x, y))

const scoreOpportunity = (opportunity: AssistOpportunity) =>
  opportunity.runLength * 100 + opportunity.targetWord.length

export const findAssistOpportunity = (
  tiles: TileEntity[],
  difficultyBand: DifficultyBand = 'guided',
): AssistOpportunity | null => {
  const lockedTiles = tiles.filter((tile) => !tile.isMoving)
  if (lockedTiles.length === 0) {
    return null
  }

  const occupancy = buildOccupancyMap(lockedTiles)
  const seenRuns = new Set<string>()
  let best: AssistOpportunity | null = null

  lockedTiles.forEach((tile) => {
    ;(['horizontal', 'vertical'] as Axis[]).forEach((axis) => {
      const { letters, cells } = collectRunLetters(occupancy, tile, axis)
      if (letters.length < MIN_COMPLETION_RUN_LENGTH_BY_BAND[difficultyBand]) {
        return
      }

      const runKey = `${axis}:${cells[0]?.x ?? 0}:${cells[0]?.y ?? 0}:${letters.join('')}`
      if (seenRuns.has(runKey)) {
        return
      }
      seenRuns.add(runKey)

      const raw = letters.join('')
      const before =
        axis === 'horizontal'
          ? { x: (cells[0]?.x ?? 0) - 1, y: cells[0]?.y ?? 0 }
          : { x: cells[0]?.x ?? 0, y: (cells[0]?.y ?? 0) - 1 }
      const lastCell = cells[cells.length - 1]
      const after =
        axis === 'horizontal'
          ? { x: (lastCell?.x ?? 0) + 1, y: lastCell?.y ?? 0 }
          : { x: lastCell?.x ?? 0, y: (lastCell?.y ?? 0) + 1 }

      ASSIST_WORD_POOL.forEach((word) => {
        ;[word, word.split('').reverse().join('')].forEach((variant) => {
          if (
            variant.startsWith(raw) &&
            raw.length < variant.length &&
            isOpenCell(occupancy, after.x, after.y)
          ) {
            const candidate: AssistOpportunity = {
              axis,
              letter: variant[raw.length] ?? word[0] ?? 'A',
              targetWord: word,
              runLength: raw.length,
            }

            if (!best || scoreOpportunity(candidate) > scoreOpportunity(best)) {
              best = candidate
            }
          }

          if (
            variant.endsWith(raw) &&
            raw.length < variant.length &&
            isOpenCell(occupancy, before.x, before.y)
          ) {
            const candidate: AssistOpportunity = {
              axis,
              letter: variant[variant.length - raw.length - 1] ?? word[0] ?? 'A',
              targetWord: word,
              runLength: raw.length,
            }

            if (!best || scoreOpportunity(candidate) > scoreOpportunity(best)) {
              best = candidate
            }
          }
        })
      })
    })
  })

  return best
}

export const createFunFirstPreview = (
  tiles: TileEntity[],
  assistCursor: number,
  difficultyBand: DifficultyBand = 'guided',
): TilePreview => {
  const opportunity = findAssistOpportunity(tiles, difficultyBand)
  if (opportunity) {
    return {
      letter: opportunity.letter,
      assistMode: 'completion',
      targetWord: opportunity.targetWord,
      hint:
        difficultyBand === 'survival'
          ? `Late-run assist spotted ${opportunity.letter} as a pressure-saving fit for ${opportunity.targetWord}.`
          : `Assist is offering ${opportunity.letter} to help finish ${opportunity.targetWord}. Reverse words count too.`,
    }
  }

  const sequenceLetter = FUN_FIRST_SEQUENCE[assistCursor % FUN_FIRST_SEQUENCE.length]
  if (sequenceLetter && (difficultyBand === 'guided' || difficultyBand === 'steady')) {
    const targetWord =
      ASSIST_WORD_POOL[assistCursor % ASSIST_WORD_POOL.length] ??
      ASSIST_WORD_POOL[0] ??
      'CAT'

    return {
      letter: sequenceLetter,
      assistMode: 'sequence',
      targetWord,
      hint:
        difficultyBand === 'guided'
          ? `Guided assist is cycling easy letters for words like ${targetWord}.`
          : `Warm-up assist is still feeding friendly letters for words like ${targetWord}.`,
    }
  }

  if (sequenceLetter && difficultyBand === 'climb' && assistCursor % 3 !== 2) {
    const targetWord =
      ASSIST_WORD_POOL[assistCursor % ASSIST_WORD_POOL.length] ??
      ASSIST_WORD_POOL[0] ??
      'CAT'

    return {
      letter: sequenceLetter,
      assistMode: 'sequence',
      targetWord,
      hint: `The climb phase still nudges you toward workable letters, but not every drop will be a gift.`,
    }
  }

  const fallbackLetter = LETTER_BAG[(assistCursor * 3) % LETTER_BAG.length] ?? 'A'

  return {
    letter: fallbackLetter,
    assistMode: 'fallback',
    hint:
      difficultyBand === 'survival'
        ? 'Survival pace is active. The bag is fairer than before, but pressure will punish slow setups.'
        : 'Fallback bag active. Reverse words still count in any straight line.',
  }
}
