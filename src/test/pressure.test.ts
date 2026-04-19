import { describe, expect, it } from 'vitest'
import { calculateRawPressure, getTickIntervalFromPressure } from '../game/utils/pressure'
import type { TileEntity } from '../game/types'

const createLockedTile = (x: number, y: number): TileEntity => ({
  id: `${x}-${y}`,
  letter: 'A',
  x,
  y,
  isMoving: false,
  isSteel: false,
  isWildcard: false,
})

describe('pressure utilities', () => {
  it('excludes fortified rows from pressure calculations', () => {
    const tiles = Array.from({ length: 20 }, (_, index) =>
      createLockedTile(index % 10, 18 + Math.floor(index / 10)),
    )

    expect(calculateRawPressure(tiles, [19])).toBe(2)
    expect(calculateRawPressure(tiles, [])).toBe(4)
  })

  it('speeds up tick intervals as pressure increases', () => {
    expect(getTickIntervalFromPressure(10)).toBe(1450)
    expect(getTickIntervalFromPressure(35)).toBe(1100)
    expect(getTickIntervalFromPressure(55)).toBe(860)
    expect(getTickIntervalFromPressure(75)).toBe(680)
    expect(getTickIntervalFromPressure(95)).toBe(520)
  })
})
