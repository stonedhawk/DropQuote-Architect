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

  const effectiveTiles = Math.max(0, contributingTiles.length - 2)
  const ratio = effectiveTiles / (BOARD_WIDTH * BOARD_HEIGHT)
  return Math.min(MAX_PRESSURE, Math.round(ratio * 100))
}

export const getTickIntervalFromPressure = (pressure: number) => {
  if (pressure >= 90) {
    return 480
  }
  if (pressure >= 70) {
    return 620
  }
  if (pressure >= 50) {
    return 780
  }
  if (pressure >= 30) {
    return 980
  }
  if (pressure >= 15) {
    return 1150
  }
  return 1350
}

export const getBoardFillPercent = (tiles: TileEntity[]) =>
  Math.round((tiles.filter((tile) => !tile.isMoving).length / (BOARD_WIDTH * BOARD_HEIGHT)) * 100)
