import { describe, expect, it } from 'vitest'
import {
  calculateRawPressure,
  getDifficultyBand,
  getTickIntervalFromPressure,
} from '../game/utils/pressure'
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
  it('keeps early pressure gentler than late-run pressure', () => {
    const tiles = [
      createLockedTile(0, 19),
      createLockedTile(1, 19),
      createLockedTile(2, 18),
      createLockedTile(3, 18),
      createLockedTile(4, 18),
      createLockedTile(5, 17),
      createLockedTile(6, 17),
      createLockedTile(7, 16),
    ]

    expect(calculateRawPressure(tiles, [19], 'guided')).toBeLessThan(
      calculateRawPressure(tiles, [], 'survival'),
    )
  })

  it('speeds up tick intervals within a band and starts slower in guided runs', () => {
    expect(getTickIntervalFromPressure(10, 'guided')).toBeGreaterThan(
      getTickIntervalFromPressure(10, 'survival'),
    )
    expect(getTickIntervalFromPressure(55, 'guided')).toBeGreaterThan(
      getTickIntervalFromPressure(75, 'guided'),
    )
  })

  it('advances through difficulty bands by clear milestones', () => {
    expect(getDifficultyBand(0)).toBe('guided')
    expect(getDifficultyBand(4)).toBe('steady')
    expect(getDifficultyBand(9)).toBe('climb')
    expect(getDifficultyBand(16)).toBe('survival')
  })
})
