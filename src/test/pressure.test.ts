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
    const tiles = [
      createLockedTile(0, 19),
      createLockedTile(1, 19),
      createLockedTile(2, 18),
      createLockedTile(3, 18),
    ]

    expect(calculateRawPressure(tiles, [19])).toBe(1)
    expect(calculateRawPressure(tiles, [])).toBe(2)
  })

  it('speeds up tick intervals as pressure increases', () => {
    expect(getTickIntervalFromPressure(10)).toBe(720)
    expect(getTickIntervalFromPressure(35)).toBe(560)
    expect(getTickIntervalFromPressure(55)).toBe(420)
    expect(getTickIntervalFromPressure(75)).toBe(300)
    expect(getTickIntervalFromPressure(95)).toBe(200)
  })
})
