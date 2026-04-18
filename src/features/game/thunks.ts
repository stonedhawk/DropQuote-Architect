import type { AppDispatch, RootState } from '../../app/store'
import { POWER_UP_COSTS, POWER_UP_LABELS, SPAWN_COLUMN } from '../../game/constants'
import type {
  Position,
  PowerUpType,
  QueuedPowerUp,
  TileEntity,
  TilePreview,
  WordMatch,
} from '../../game/types'
import {
  canOccupyPosition,
  collapseFloatingTiles,
  scanWordsAtPositions,
} from '../../game/utils/board'
import { isValidWord } from '../../game/utils/dictionaryService'
import { calculateRawPressure } from '../../game/utils/pressure'
import {
  getPressureReliefForSteel,
  inkForWordMatch,
  scoreWordMatch,
} from '../../game/utils/scoring'
import { economyActions } from '../economy/economySlice'
import {
  selectActiveTile,
  selectAllTiles,
  selectLockedTiles,
} from './selectors'
import { pressureActions } from '../pressure/pressureSlice'
import { sessionActions } from '../session/sessionSlice'
import { tilesActions } from '../tiles/tilesSlice'

type AppThunk = (dispatch: AppDispatch, getState: () => RootState) => void

const createRandomTilePreview = (): TilePreview => ({
  letter:
    'AAAEEEIIOOULNRSTDGMPBCFH'[Math.floor(Math.random() * 'AAAEEEIIOOULNRSTDGMPBCFH'.length)] ??
    'A',
})

const createSpawnTile = (preview: TilePreview, queuedPowerUp: QueuedPowerUp): TileEntity => ({
  id: crypto.randomUUID(),
  letter: queuedPowerUp === 'mortar' ? '?' : preview.letter.toUpperCase(),
  x: SPAWN_COLUMN,
  y: 0,
  isMoving: true,
  isSteel: queuedPowerUp === 'steel',
  isWildcard: queuedPowerUp === 'mortar',
})

const applyPressureSnapshot = (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const rawPressure = calculateRawPressure(
    selectLockedTiles(state),
    state.pressure.fortifiedRows,
  )

  dispatch(
    pressureActions.pressureRecomputed({
      tick: state.session.tick,
      rawPressure,
    }),
  )

  if (getState().pressure.current >= 100) {
    dispatch(sessionActions.phaseSet('game-over'))
    dispatch(sessionActions.statusMessageSet('Pressure maxed out. The tower collapsed.'))
  }
}

const spawnNextTile = (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const preview = state.session.nextTile ?? createRandomTilePreview()
  const queuedPowerUp = state.economy.queuedPowerUp
  const tile = createSpawnTile(preview, queuedPowerUp)

  if (!canOccupyPosition(selectAllTiles(state), tile.x, tile.y)) {
    dispatch(sessionActions.phaseSet('game-over'))
    dispatch(sessionActions.statusMessageSet('No room to spawn. Game over.'))
    return false
  }

  dispatch(tilesActions.tileSpawned(tile))
  dispatch(sessionActions.activeTileSet(tile.id))
  dispatch(sessionActions.phaseSet('running'))
  dispatch(sessionActions.nextTilePrepared(createRandomTilePreview()))
  dispatch(sessionActions.statusMessageSet('Drop in and keep the combo alive.'))

  if (queuedPowerUp) {
    dispatch(economyActions.queuedPowerUpCleared())
  }

  return true
}

const tryMoveActiveTile = (
  dispatch: AppDispatch,
  getState: () => RootState,
  deltaX: number,
  deltaY: number,
) => {
  const state = getState()
  const activeTile = selectActiveTile(state)
  if (!activeTile) {
    return false
  }

  const nextX = activeTile.x + deltaX
  const nextY = activeTile.y + deltaY
  if (!canOccupyPosition(selectAllTiles(state), nextX, nextY, activeTile.id)) {
    return false
  }

  dispatch(
    tilesActions.tileMoved({
      id: activeTile.id,
      x: nextX,
      y: nextY,
    }),
  )
  return true
}

const collectSteelRows = (matches: WordMatch[], tiles: TileEntity[]) => {
  const tileMap = new Map(tiles.map((tile) => [tile.id, tile]))
  const rows = new Set<number>()

  matches.forEach((match) => {
    match.tileIds.forEach((tileId) => {
      const tile = tileMap.get(tileId)
      if (tile?.isSteel) {
        rows.add(tile.y)
      }
    })
  })

  return Array.from(rows)
}

const resolveBoardAfterLock = (
  dispatch: AppDispatch,
  getState: () => RootState,
  anchors: Position[],
) => {
  let cascadeDepth = 1
  let scanAnchors = anchors
  let clearedAnyWords = false

  while (true) {
    const state = getState()
    const lockedTiles = selectLockedTiles(state)
    const matches = scanWordsAtPositions(lockedTiles, scanAnchors, isValidWord)

    if (matches.length === 0) {
      dispatch(sessionActions.comboSet(clearedAnyWords ? cascadeDepth - 1 : 0))
      dispatch(sessionActions.phaseSet('running'))
      if (!clearedAnyWords) {
        dispatch(sessionActions.recentMatchesSet([]))
        dispatch(sessionActions.statusMessageSet('No clear. Keep stacking!'))
      }
      break
    }

    clearedAnyWords = true
    dispatch(sessionActions.phaseSet('clearing'))
    dispatch(sessionActions.recentMatchesSet(matches))

    const idsToRemove = Array.from(new Set(matches.flatMap((match) => match.tileIds)))
    const totalPoints = matches.reduce(
      (sum, match) => sum + scoreWordMatch(match, cascadeDepth),
      0,
    )
    const totalInk = matches.reduce(
      (sum, match) => sum + inkForWordMatch(match, cascadeDepth),
      0,
    )
    const steelRows = collectSteelRows(matches, lockedTiles)

    dispatch(
      sessionActions.scoreRegistered({
        points: totalPoints,
        combo: cascadeDepth,
      }),
    )
    dispatch(economyActions.inkAwarded(totalInk))

    if (steelRows.length > 0) {
      dispatch(pressureActions.rowsFortified(steelRows))
      dispatch(
        pressureActions.pressureReliefGranted(
          getPressureReliefForSteel(steelRows.length),
        ),
      )
    }

    dispatch(tilesActions.tilesRemoved(idsToRemove))

    const collapsed = collapseFloatingTiles(selectLockedTiles(getState()))
    if (collapsed.updates.length > 0) {
      dispatch(tilesActions.tilesUpdated(collapsed.updates))
    }

    scanAnchors =
      collapsed.impactedPositions.length > 0
        ? collapsed.impactedPositions
        : matches.flatMap((match) => match.cells)

    dispatch(sessionActions.phaseSet('scanning'))
    dispatch(
      sessionActions.statusMessageSet(
        cascadeDepth > 1 ? `Cascade x${cascadeDepth}!` : 'Word clear!',
      ),
    )
    cascadeDepth += 1
  }

  applyPressureSnapshot(dispatch, getState)
}

const lockAndResolveActiveTile = (dispatch: AppDispatch, getState: () => RootState) => {
  const activeTile = selectActiveTile(getState())
  if (!activeTile) {
    return
  }

  dispatch(tilesActions.tileLocked(activeTile.id))
  dispatch(sessionActions.activeTileSet(null))
  dispatch(sessionActions.phaseSet('scanning'))

  resolveBoardAfterLock(dispatch, getState, [{ x: activeTile.x, y: activeTile.y }])

  if (getState().session.phase !== 'game-over') {
    spawnNextTile(dispatch, getState)
  }
}

const deployWreckingBallAtColumn = (
  dispatch: AppDispatch,
  getState: () => RootState,
  column: number,
) => {
  const tiles = selectLockedTiles(getState())
  const removedIds = tiles
    .filter((tile) => tile.x === column)
    .map((tile) => tile.id)

  if (removedIds.length > 0) {
    dispatch(tilesActions.tilesRemoved(removedIds))
    dispatch(sessionActions.recentMatchesSet([]))
    dispatch(
      sessionActions.statusMessageSet(
        `Wrecking Ball smashed column ${column + 1}.`,
      ),
    )
  } else {
    dispatch(sessionActions.statusMessageSet('Wrecking Ball found open space.'))
  }

  applyPressureSnapshot(dispatch, getState)
}

export const initializeGame = (): AppThunk => (dispatch, getState) => {
  if (!getState().session.nextTile) {
    dispatch(sessionActions.nextTilePrepared(createRandomTilePreview()))
  }

  if (!getState().session.activeTileId && getState().session.phase !== 'game-over') {
    spawnNextTile(dispatch, getState)
    applyPressureSnapshot(dispatch, getState)
  }
}

export const restartGame = (): AppThunk => (dispatch, getState) => {
  dispatch(tilesActions.boardReset())
  dispatch(sessionActions.sessionReset())
  dispatch(economyActions.economyReset())
  dispatch(pressureActions.pressureReset())
  initializeGame()(dispatch, getState)
}

export const advanceGameTick = (): AppThunk => (dispatch, getState) => {
  const state = getState()
  if (state.session.phase === 'game-over') {
    return
  }

  if (state.session.phase === 'idle') {
    initializeGame()(dispatch, getState)
    return
  }

  dispatch(sessionActions.tickAdvanced())

  if (!selectActiveTile(getState())) {
    spawnNextTile(dispatch, getState)
    return
  }

  const moved = tryMoveActiveTile(dispatch, getState, 0, 1)
  if (!moved) {
    lockAndResolveActiveTile(dispatch, getState)
  }
}

export const moveActiveHorizontally =
  (deltaX: number): AppThunk =>
  (dispatch, getState) => {
    if (getState().session.phase === 'game-over') {
      return
    }

    const moved = tryMoveActiveTile(dispatch, getState, deltaX, 0)
    if (moved) {
      dispatch(
        sessionActions.statusMessageSet(
          deltaX < 0 ? 'Slide left.' : 'Slide right.',
        ),
      )
    }
  }

export const softDropActiveTile = (): AppThunk => (dispatch, getState) => {
  if (getState().session.phase === 'game-over') {
    return
  }

  const moved = tryMoveActiveTile(dispatch, getState, 0, 1)
  if (!moved) {
    lockAndResolveActiveTile(dispatch, getState)
  }
}

export const hardDropActiveTile = (): AppThunk => (dispatch, getState) => {
  if (getState().session.phase === 'game-over') {
    return
  }

  while (tryMoveActiveTile(dispatch, getState, 0, 1)) {
    // Keep dropping until collision.
  }

  lockAndResolveActiveTile(dispatch, getState)
}

export const buyPowerUp =
  (powerUp: PowerUpType): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const cost = POWER_UP_COSTS[powerUp]

    if (state.economy.inventory.length >= 3 || state.economy.ink < cost) {
      return
    }

    dispatch(economyActions.inkSpent(cost))
    dispatch(economyActions.powerUpPurchased(powerUp))
    dispatch(
      sessionActions.statusMessageSet(
        `${POWER_UP_LABELS[powerUp]} added to your inventory.`,
      ),
    )
  }

export const activateInventorySlot =
  (slotIndex: number): AppThunk =>
  (dispatch, getState) => {
    const powerUp = getState().economy.inventory[slotIndex]
    if (!powerUp) {
      return
    }

    dispatch(economyActions.inventorySlotRemoved(slotIndex))

    if (powerUp === 'wrecking-ball') {
      const column = selectActiveTile(getState())?.x ?? SPAWN_COLUMN
      deployWreckingBallAtColumn(dispatch, getState, column)
      return
    }

    dispatch(economyActions.queuedPowerUpSet(powerUp))
    dispatch(
      sessionActions.statusMessageSet(
        `${POWER_UP_LABELS[powerUp]} queued for the next drop.`,
      ),
    )
  }

export const clearQueuedPowerUp = (): AppThunk => (dispatch) => {
  dispatch(economyActions.queuedPowerUpCleared())
  dispatch(sessionActions.statusMessageSet('Queued modifier cleared.'))
}
