import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { scanWordsAtPositions } from '../../game/utils/board'
import { isValidWord } from '../../game/utils/dictionaryService'
import {
  getBoardFillPercent,
  getDifficultyBand,
  getNextDifficultyMilestone,
  getTickIntervalFromPressure,
} from '../../game/utils/pressure'
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

export const selectDifficultyBand = createSelector(
  [(state: RootState) => state.session.totalWordsCleared],
  (totalWordsCleared) => getDifficultyBand(totalWordsCleared),
)

export const selectDifficultyStage = createSelector(
  [
    selectDifficultyBand,
    (state: RootState) => state.session.totalWordsCleared,
  ],
  (band, totalWordsCleared) => {
    const nextMilestone = getNextDifficultyMilestone(totalWordsCleared)

    if (band === 'guided') {
      return {
        band,
        label: 'Guided Build',
        helper: 'Strong assist and slow pressure to help you learn the board.',
        nextMilestone,
      }
    }

    if (band === 'steady') {
      return {
        band,
        label: 'Steady Rise',
        helper: 'Assist is still helping, but the board is asking for cleaner setups.',
        nextMilestone,
      }
    }

    if (band === 'climb') {
      return {
        band,
        label: 'Tower Climb',
        helper: 'Pressure and speed now matter. Plan around space, not just obvious clears.',
        nextMilestone,
      }
    }

    return {
      band,
      label: 'Survival Push',
      helper: 'Late-run pace. Power-ups and pressure control decide how long you last.',
      nextMilestone,
    }
  },
)

export const selectTickInterval = createSelector(
  [(state: RootState) => state.pressure.current, selectDifficultyBand],
  (pressure, difficultyBand) => getTickIntervalFromPressure(pressure, difficultyBand),
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

const tutorialColumns = [4, 5, 6]
const tutorialWord = ['C', 'A', 'T']

export const selectProjectedMatches = createSelector(
  [selectLockedTiles, selectActiveTile, selectGhostTilePosition],
  (lockedTiles, activeTile, ghostTile) => {
    if (!activeTile || !ghostTile) {
      return []
    }

    const simulatedTiles = [
      ...lockedTiles,
      {
        ...activeTile,
        x: ghostTile.x,
        y: ghostTile.y,
        isMoving: false,
      },
    ]

    return scanWordsAtPositions(simulatedTiles, [ghostTile], isValidWord)
  },
)

export const selectTutorialCoach = createSelector(
  [
    selectLockedTiles,
    selectActiveTile,
    (state: RootState) => state.session.guidedOpeningComplete,
  ],
  (lockedTiles, activeTile, guidedOpeningComplete) => {
    const targetCells = tutorialColumns.map((x, index) => ({
      x,
      y: 19,
      letter: tutorialWord[index],
    }))

    const matchedCount = targetCells.reduce((count, cell, index) => {
      if (count !== index) {
        return count
      }

      const tile = lockedTiles.find((candidate) => candidate.x === cell.x && candidate.y === cell.y)
      return tile?.letter === cell.letter ? count + 1 : count
    }, 0)

    const active = !guidedOpeningComplete && matchedCount < tutorialWord.length
    const currentTarget = targetCells[matchedCount] ?? null

    return {
      active,
      matchedCount,
      targetCells,
      currentTarget,
      message: currentTarget
        ? `Guided opener: place ${currentTarget.letter} on the glowing pad in column ${currentTarget.x + 1}.`
        : 'Guided opener complete.',
      helper: currentTarget
        ? activeTile
          ? `Current tile: ${activeTile.letter}. Move it with the arrows, then let it lock on the highlighted bottom pad.`
          : 'A new tile is about to spawn for the guided opener.'
        : 'You cleared your first guided word. Nice.',
    }
  },
)

export const selectProjectedClearCells = createSelector(
  [selectProjectedMatches],
  (projectedMatches) =>
    projectedMatches.flatMap((match) =>
      match.cells.map((cell) => positionKey(cell.x, cell.y)),
    ),
)

export const selectCelebration = (state: RootState) => state.session.celebration
export const selectCurrentObjective = (state: RootState) => state.session.objective
export const selectGameOverSummary = (state: RootState) => state.session.gameOverSummary
export const selectAudioState = (state: RootState) => ({
  unlocked: state.session.audioUnlocked,
  muted: state.session.audioMuted,
  cue: state.session.lastAudioCue,
})
