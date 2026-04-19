import { BOARD_HEIGHT, BOARD_WIDTH } from '../constants'
import type {
  Axis,
  Position,
  TileEntity,
  TilePositionUpdate,
  WordMatch,
} from '../types'

const WILDCARD_SYMBOL = '?'

export const positionKey = (x: number, y: number) => `${x}:${y}`

export const isWithinBoard = (x: number, y: number) =>
  x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT

export const buildOccupancyMap = (tiles: TileEntity[]) => {
  const occupancy = new Map<string, TileEntity>()

  tiles.forEach((tile) => {
    occupancy.set(positionKey(tile.x, tile.y), tile)
  })

  return occupancy
}

export const canOccupyPosition = (
  tiles: TileEntity[],
  x: number,
  y: number,
  ignoredId?: string,
) => {
  if (!isWithinBoard(x, y)) {
    return false
  }

  return !tiles.some(
    (tile) => tile.id !== ignoredId && tile.x === x && tile.y === y,
  )
}

const collectRun = (
  occupancy: Map<string, TileEntity>,
  start: Position,
  axis: Axis,
) => {
  const delta = axis === 'horizontal' ? { x: 1, y: 0 } : { x: 0, y: 1 }
  const backward = axis === 'horizontal' ? { x: -1, y: 0 } : { x: 0, y: -1 }

  let cursor = { ...start }
  while (occupancy.has(positionKey(cursor.x + backward.x, cursor.y + backward.y))) {
    cursor = { x: cursor.x + backward.x, y: cursor.y + backward.y }
  }

  const tiles: TileEntity[] = []
  const cells: Position[] = []
  while (occupancy.has(positionKey(cursor.x, cursor.y))) {
    const tile = occupancy.get(positionKey(cursor.x, cursor.y))
    if (!tile) {
      break
    }

    tiles.push(tile)
    cells.push({ x: cursor.x, y: cursor.y })
    cursor = { x: cursor.x + delta.x, y: cursor.y + delta.y }
  }

  return {
    cells,
    tiles,
  }
}

const resolveWildcardWord = (
  letters: string[],
  isValidWord: (word: string) => boolean,
  cursor = 0,
): string | null => {
  const wildcardIndex = letters.findIndex((letter) => letter === WILDCARD_SYMBOL)
  if (wildcardIndex === -1) {
    const candidate = letters.join('')
    return isValidWord(candidate) ? candidate : null
  }

  if (cursor > 4) {
    return null
  }

  for (let code = 65; code <= 90; code += 1) {
    const candidateLetters = [...letters]
    candidateLetters[wildcardIndex] = String.fromCharCode(code)
    const resolved = resolveWildcardWord(candidateLetters, isValidWord, cursor + 1)
    if (resolved) {
      return resolved
    }
  }

  return null
}

const resolveCandidateWord = (
  letters: string[],
  isValidWord: (word: string) => boolean,
) => {
  const forward = resolveWildcardWord(letters, isValidWord)
  if (forward) {
    return forward
  }

  return resolveWildcardWord([...letters].reverse(), isValidWord)
}

const buildMatchCandidates = (
  axis: Axis,
  runTiles: TileEntity[],
  runCells: Position[],
  isValidWord: (word: string) => boolean,
) => {
  const candidates: WordMatch[] = []

  for (let start = 0; start < runTiles.length; start += 1) {
    for (let end = start + 3; end <= runTiles.length; end += 1) {
      const sliceTiles = runTiles.slice(start, end)
      const sliceCells = runCells.slice(start, end)
      const rawLetters = sliceTiles.map((tile) =>
        tile.isWildcard ? WILDCARD_SYMBOL : tile.letter.toUpperCase(),
      )
      const resolvedText = resolveCandidateWord(rawLetters, isValidWord)

      if (!resolvedText) {
        continue
      }

      candidates.push({
        id: `${axis}-${sliceCells[0].x}-${sliceCells[0].y}-${sliceTiles.length}`,
        axis,
        cells: sliceCells,
        tileIds: sliceTiles.map((tile) => tile.id),
        resolvedText,
        usedWildcard: sliceTiles.some((tile) => tile.isWildcard),
        scoreValue: sliceTiles.length * 100,
      })
    }
  }

  candidates.sort((left, right) => {
    if (right.tileIds.length !== left.tileIds.length) {
      return right.tileIds.length - left.tileIds.length
    }

    if (left.cells[0].y !== right.cells[0].y) {
      return left.cells[0].y - right.cells[0].y
    }

    return left.cells[0].x - right.cells[0].x
  })

  const chosen: WordMatch[] = []
  const usedTiles = new Set<string>()

  candidates.forEach((candidate) => {
    if (candidate.tileIds.some((tileId) => usedTiles.has(tileId))) {
      return
    }

    candidate.tileIds.forEach((tileId) => usedTiles.add(tileId))
    chosen.push(candidate)
  })

  return chosen
}

export const scanWordsAtPositions = (
  tiles: TileEntity[],
  anchors: Position[],
  isValidWord: (word: string) => boolean,
): WordMatch[] => {
  if (anchors.length === 0) {
    return []
  }

  const occupancy = buildOccupancyMap(tiles)
  const seen = new Set<string>()
  const matches: WordMatch[] = []

  anchors.forEach((anchor) => {
    ;(['horizontal', 'vertical'] as Axis[]).forEach((axis) => {
      const run = collectRun(occupancy, anchor, axis)
      if (run.tiles.length < 3) {
        return
      }

      const dedupeKey = `${axis}:${run.cells[0]?.x ?? 0}:${run.cells[0]?.y ?? 0}:${run.tiles.length}`
      if (seen.has(dedupeKey)) {
        return
      }
      seen.add(dedupeKey)

      matches.push(...buildMatchCandidates(axis, run.tiles, run.cells, isValidWord))
    })
  })

  return matches
}

export const collapseFloatingTiles = (tiles: TileEntity[]) => {
  const lockedTiles = tiles.filter((tile) => !tile.isMoving)
  const movingTiles = tiles.filter((tile) => tile.isMoving)
  const updates: TilePositionUpdate[] = []
  const impactedPositions: Position[] = []

  for (let column = 0; column < BOARD_WIDTH; column += 1) {
    const columnTiles = lockedTiles
      .filter((tile) => tile.x === column)
      .sort((left, right) => right.y - left.y)

    columnTiles.forEach((tile, index) => {
      const targetY = BOARD_HEIGHT - 1 - index
      if (tile.y !== targetY) {
        updates.push({ id: tile.id, x: tile.x, y: targetY })
        impactedPositions.push({ x: tile.x, y: targetY })
      }
    })
  }

  movingTiles.forEach((tile) => {
    impactedPositions.push({ x: tile.x, y: tile.y })
  })

  return {
    updates,
    impactedPositions,
  }
}
