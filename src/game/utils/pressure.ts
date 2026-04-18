import { BOARD_HEIGHT, BOARD_WIDTH, MAX_PRESSURE } from '../constants'
import type { TileEntity } from '../types'

export const calculateRawPressure = (
  tiles: TileEntity[],
  fortifiedRows: number[],
) => {
  const fortified = new Set(fortifiedRows)
  const contributingTiles = tiles.filter(
    (tile) => !tile.isMoving && !fortified.has(tile.y),
  )

  const ratio = contributingTiles.length / (BOARD_WIDTH * BOARD_HEIGHT)
  return Math.min(MAX_PRESSURE, Math.round(ratio * 100))
}

export const getTickIntervalFromPressure = (pressure: number) => {
  if (pressure >= 85) {
    return 200
  }
  if (pressure >= 65) {
    return 300
  }
  if (pressure >= 45) {
    return 420
  }
  if (pressure >= 25) {
    return 560
  }
  return 720
}

export const getBoardFillPercent = (tiles: TileEntity[]) =>
  Math.round((tiles.filter((tile) => !tile.isMoving).length / (BOARD_WIDTH * BOARD_HEIGHT)) * 100)
