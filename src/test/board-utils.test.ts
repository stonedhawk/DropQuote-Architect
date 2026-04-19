import { describe, expect, it } from 'vitest'
import {
  canOccupyPosition,
  collapseFloatingTiles,
  scanWordsAtPositions,
} from '../game/utils/board'
import type { TileEntity } from '../game/types'

const createTile = (overrides: Partial<TileEntity>): TileEntity => ({
  id: overrides.id ?? crypto.randomUUID(),
  letter: overrides.letter ?? 'A',
  x: overrides.x ?? 0,
  y: overrides.y ?? 0,
  isMoving: overrides.isMoving ?? false,
  isSteel: overrides.isSteel ?? false,
  isWildcard: overrides.isWildcard ?? false,
  fortifiedRowId: overrides.fortifiedRowId,
})

describe('board utilities', () => {
  it('prevents movement into occupied cells and walls', () => {
    const tiles = [createTile({ id: 'locked', x: 2, y: 2 })]

    expect(canOccupyPosition(tiles, 2, 2)).toBe(false)
    expect(canOccupyPosition(tiles, -1, 2)).toBe(false)
    expect(canOccupyPosition(tiles, 3, 2)).toBe(true)
  })

  it('finds a horizontal word from anchor positions', () => {
    const tiles = [
      createTile({ id: 'a', letter: 'A', x: 0, y: 19 }),
      createTile({ id: 'r', letter: 'R', x: 1, y: 19 }),
      createTile({ id: 'c', letter: 'C', x: 2, y: 19 }),
    ]

    const matches = scanWordsAtPositions(tiles, [{ x: 1, y: 19 }], (word) => word === 'ARC')

    expect(matches).toHaveLength(1)
    expect(matches[0]?.resolvedText).toBe('ARC')
    expect(matches[0]?.axis).toBe('horizontal')
  })

  it('finds horizontal words when they read in reverse on the board', () => {
    const tiles = [
      createTile({ id: 't', letter: 'T', x: 0, y: 19 }),
      createTile({ id: 'a', letter: 'A', x: 1, y: 19 }),
      createTile({ id: 'c', letter: 'C', x: 2, y: 19 }),
    ]

    const matches = scanWordsAtPositions(tiles, [{ x: 1, y: 19 }], (word) => word === 'CAT')

    expect(matches).toHaveLength(1)
    expect(matches[0]?.resolvedText).toBe('CAT')
  })

  it('finds valid words inside a longer contiguous run', () => {
    const tiles = [
      createTile({ id: 'c', letter: 'C', x: 0, y: 19 }),
      createTile({ id: 'a', letter: 'A', x: 1, y: 19 }),
      createTile({ id: 't', letter: 'T', x: 2, y: 19 }),
      createTile({ id: 'd', letter: 'D', x: 3, y: 19 }),
      createTile({ id: 'o', letter: 'O', x: 4, y: 19 }),
      createTile({ id: 'g', letter: 'G', x: 5, y: 19 }),
    ]

    const matches = scanWordsAtPositions(
      tiles,
      [{ x: 2, y: 19 }],
      (word) => word === 'CAT' || word === 'DOG',
    )

    expect(matches.map((match) => match.resolvedText).sort()).toEqual(['CAT', 'DOG'])
  })

  it('resolves wildcard tiles without brute forcing the board', () => {
    const tiles = [
      createTile({ id: 'c', letter: 'C', x: 5, y: 10 }),
      createTile({ id: 'wild', letter: '?', x: 5, y: 11, isWildcard: true }),
      createTile({ id: 'b', letter: 'B', x: 5, y: 12 }),
    ]

    const matches = scanWordsAtPositions(tiles, [{ x: 5, y: 11 }], (word) => word === 'CAB')

    expect(matches).toHaveLength(1)
    expect(matches[0]?.resolvedText).toBe('CAB')
    expect(matches[0]?.usedWildcard).toBe(true)
  })

  it('resolves wildcard tiles for reverse vertical words too', () => {
    const tiles = [
      createTile({ id: 't', letter: 'T', x: 5, y: 10 }),
      createTile({ id: 'wild', letter: '?', x: 5, y: 11, isWildcard: true }),
      createTile({ id: 'c', letter: 'C', x: 5, y: 12 }),
    ]

    const matches = scanWordsAtPositions(tiles, [{ x: 5, y: 11 }], (word) => word === 'CAT')

    expect(matches).toHaveLength(1)
    expect(matches[0]?.resolvedText).toBe('CAT')
    expect(matches[0]?.usedWildcard).toBe(true)
  })

  it('collapses unsupported tiles downward after a clear', () => {
    const tiles = [
      createTile({ id: 'top', x: 0, y: 12 }),
      createTile({ id: 'mid', x: 0, y: 16 }),
      createTile({ id: 'other', x: 1, y: 19 }),
    ]

    const collapsed = collapseFloatingTiles(tiles)

    expect(collapsed.updates).toContainEqual({ id: 'top', x: 0, y: 18 })
    expect(collapsed.updates).toContainEqual({ id: 'mid', x: 0, y: 19 })
  })
})
