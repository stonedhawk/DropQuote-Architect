import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { getBoardFillPercent, getTickIntervalFromPressure } from '../../game/utils/pressure'
import { buildOccupancyMap, canOccupyPosition, positionKey } from '../../game/utils/board'
import { tilesSelectors } from '../tiles/tilesSlice'

export const selectAllTiles = tilesSelectors.selectAll

export const selectActiveTile = createSelector(
  [selectAllTiles, (state: RootState) => state.session.activeTileId],
  (tiles, activeTileId) => tiles.find((tile) => tile.id === activeTileId) ?? null,
)

export const selectLockedTiles = createSelector([selectAllTiles], (tiles) =>
  tiles.filter((tile) => !tile.isMoving),
)

export const selectOccupancyMap = createSelector([selectAllTiles], (tiles) =>
  buildOccupancyMap(tiles),
)

export const selectTileGrid = createSelector([selectAllTiles], (tiles) => {
  const grid = new Map<string, (typeof tiles)[number]>()
  tiles.forEach((tile) => {
    grid.set(positionKey(tile.x, tile.y), tile)
  })
  return grid
})

export const selectPressureContributors = createSelector(
  [selectLockedTiles, (state: RootState) => state.pressure.fortifiedRows],
  (tiles, fortifiedRows) =>
    tiles.filter((tile) => !fortifiedRows.includes(tile.y)),
)

export const selectTickInterval = createSelector(
  [(state: RootState) => state.pressure.current],
  (pressure) => getTickIntervalFromPressure(pressure),
)

export const selectBoardFillPercent = createSelector([selectLockedTiles], (tiles) =>
  getBoardFillPercent(tiles),
)

export const selectGhostTilePosition = createSelector(
  [selectAllTiles, selectActiveTile],
  (tiles, activeTile) => {
    if (!activeTile) {
      return null
    }

    let ghostY = activeTile.y
    while (canOccupyPosition(tiles, activeTile.x, ghostY + 1, activeTile.id)) {
      ghostY += 1
    }

    return {
      x: activeTile.x,
      y: ghostY,
    }
  },
)
