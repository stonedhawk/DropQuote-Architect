import type { AppDispatch, RootState } from '../../app/store'
import {
  LETTER_BAG,
  MIN_WORDS_BEFORE_OBJECTIVES,
  POWER_UP_COSTS,
  POWER_UP_LABELS,
  PRESSURE_OBJECTIVE_THRESHOLD,
  SPAWN_COLUMN,
} from '../../game/constants'
import type {
  CelebrationState,
  ObjectiveState,
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
import { createFunFirstPreview } from '../../game/utils/assist'
import { isValidWord } from '../../game/utils/dictionaryService'
import { createObjectiveState, getNextObjectiveId, rewardCanBeGranted } from '../../game/utils/objectives'
import { calculateRawPressure } from '../../game/utils/pressure'
import {
  getPressureReliefForSteel,
  inkForWordMatch,
  scoreWordMatch,
} from '../../game/utils/scoring'
import { economyActions } from '../economy/economySlice'
import { pressureActions } from '../pressure/pressureSlice'
import { sessionActions } from '../session/sessionSlice'
import { tilesActions } from '../tiles/tilesSlice'
import { selectActiveTile, selectAllTiles, selectLockedTiles } from './selectors'

type AppThunk = (dispatch: AppDispatch, getState: () => RootState) => void

interface ClearResolutionSummary {
  clearedWords: number
  maxCascade: number
  usedWildcard: boolean
  resolvedWords: string[]
  matches: WordMatch[]
}

const getAllLockedPositions = (state: RootState) =>
  selectLockedTiles(state).map((tile) => ({ x: tile.x, y: tile.y }))

const getUpcomingPreview = (state: RootState): { preview: TilePreview; fromTutorial: boolean } => {
  const nextTutorialLetter = state.session.tutorialQueue[0]

  if (nextTutorialLetter) {
    return {
      preview: { letter: nextTutorialLetter, assistMode: 'tutorial' },
      fromTutorial: true,
    }
  }

  return {
    preview: createFunFirstPreview(selectAllTiles(state), state.session.assistCursor),
    fromTutorial: false,
  }
}

const createRandomTilePreview = (): TilePreview => ({
  letter: LETTER_BAG[Math.floor(Math.random() * LETTER_BAG.length)] ?? 'A',
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

const chooseBestWord = (currentBest: string | null, candidates: string[]) =>
  candidates.reduce((best, candidate) => {
    if (!best) {
      return candidate
    }

    if (candidate.length > best.length) {
      return candidate
    }

    return candidate
  }, currentBest)

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

const buildClearCelebration = (
  summary: ClearResolutionSummary,
  completedGuidedOpening: boolean,
): CelebrationState => {
  if (completedGuidedOpening) {
    return {
      title: 'First Word Cleared!',
      body: `You popped ${summary.resolvedWords.join(' + ')} and the easy-assist phase is now fully live.`,
      tone: 'success',
    }
  }

  if (summary.maxCascade >= 2) {
    return {
      title: `Cascade x${summary.maxCascade}!`,
      body: `Chain reaction cleared ${summary.resolvedWords.join(' + ')} and bought you breathing room.`,
      tone: 'success',
    }
  }

  return {
    title: summary.clearedWords > 1 ? 'Multi Clear!' : 'Word Clear!',
    body: `Resolved ${summary.resolvedWords.join(' + ')} and kept the tower under control.`,
    tone: 'success',
  }
}

const buildGameOverSummary = (state: RootState, reason: string) => ({
  reason,
  finalScore: state.session.score,
  bestWord: state.session.bestWord,
  latestWord: state.session.latestWord,
  topCombo: state.session.topCombo,
  peakPressure: Math.max(state.session.peakPressure, state.pressure.current),
})

const setGameOver = (
  dispatch: AppDispatch,
  getState: () => RootState,
  reason: string,
  statusMessage: string,
) => {
  if (getState().session.phase === 'game-over') {
    return
  }

  dispatch(sessionActions.phaseSet('game-over'))
  dispatch(sessionActions.peakPressureUpdated(getState().pressure.current))
  dispatch(sessionActions.gameOverSummarySet(buildGameOverSummary(getState(), reason)))
  dispatch(sessionActions.celebrationSet({
    title: 'Run Over',
    body: statusMessage,
    tone: 'warning',
  }))
  dispatch(sessionActions.statusMessageSet(statusMessage))
  dispatch(sessionActions.audioCueEmitted('game-over'))
}

const maybeStartObjectiveLoop = (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()

  if (
    !state.session.guidedOpeningComplete ||
    state.session.objective ||
    state.session.totalWordsCleared < MIN_WORDS_BEFORE_OBJECTIVES
  ) {
    return false
  }

  dispatch(sessionActions.objectiveSet(createObjectiveState(getNextObjectiveId(null))))
  return true
}

const completeGuidedOpeningIfNeeded = (
  dispatch: AppDispatch,
  getState: () => RootState,
) => {
  const state = getState()

  if (state.session.guidedOpeningComplete) {
    return false
  }

  dispatch(sessionActions.guidedOpeningCompleted())
  return true
}

const grantObjectiveReward = (
  dispatch: AppDispatch,
  getState: () => RootState,
  objective: ObjectiveState,
) => {
  const rewardBits = [`+${objective.reward.ink} Ink`]

  if (objective.reward.ink > 0) {
    dispatch(economyActions.inkAwarded(objective.reward.ink))
  }

  if (objective.reward.pressureRelief > 0) {
    dispatch(pressureActions.pressureReliefGranted(objective.reward.pressureRelief))
    rewardBits.push(`-${objective.reward.pressureRelief}% pressure`)
  }

  if (
    objective.reward.bonusPowerUp &&
    rewardCanBeGranted(objective.reward.bonusPowerUp, getState().economy.inventory.length)
  ) {
    dispatch(economyActions.powerUpGranted(objective.reward.bonusPowerUp))
    rewardBits.push(`${POWER_UP_LABELS[objective.reward.bonusPowerUp]} bonus`)
  }

  return rewardBits.join(' • ')
}

const completeObjective = (
  dispatch: AppDispatch,
  getState: () => RootState,
  objective: ObjectiveState,
) => {
  const rewardSummary = grantObjectiveReward(dispatch, getState, objective)
  const nextObjective = createObjectiveState(getNextObjectiveId(objective.id))

  dispatch(sessionActions.audioCueEmitted('objective-complete'))
  dispatch(sessionActions.objectiveSet(nextObjective))
  dispatch(
    sessionActions.celebrationSet({
      title: `Objective Complete: ${objective.title}`,
      body: `${rewardSummary}. Next objective: ${nextObjective.title}.`,
      tone: 'objective',
    }),
  )
  dispatch(
    sessionActions.statusMessageSet(
      `${objective.title} complete. ${nextObjective.title} is now live.`,
    ),
  )
}

const updateResolutionObjectiveProgress = (
  dispatch: AppDispatch,
  getState: () => RootState,
  summary: ClearResolutionSummary,
) => {
  const objective = getState().session.objective
  if (!objective) {
    return false
  }

  let nextProgress = objective.progress

  switch (objective.id) {
    case 'double-clear-run':
      nextProgress = summary.clearedWords
      break
    case 'combo-two':
      nextProgress = summary.maxCascade
      break
    case 'wildcard-clear':
      nextProgress = summary.usedWildcard ? 1 : 0
      break
    case 'pressure-survivor':
      return false
  }

  dispatch(sessionActions.objectiveProgressSet(nextProgress))

  if (nextProgress >= objective.target) {
    completeObjective(dispatch, getState, objective)
    return true
  }

  return false
}

const resetRunScopedObjectiveProgress = (
  dispatch: AppDispatch,
  getState: () => RootState,
) => {
  const objective = getState().session.objective

  if (!objective || objective.id === 'pressure-survivor') {
    return
  }

  dispatch(sessionActions.objectiveProgressSet(0))
}

const advancePressureObjectiveTick = (
  dispatch: AppDispatch,
  getState: () => RootState,
) => {
  const objective = getState().session.objective
  if (!objective || objective.id !== 'pressure-survivor') {
    return false
  }

  if (getState().pressure.current < PRESSURE_OBJECTIVE_THRESHOLD) {
    if (objective.progress !== 0) {
      dispatch(sessionActions.objectiveProgressSet(0))
    }
    return false
  }

  const nextProgress = Math.min(objective.progress + 1, objective.target)
  dispatch(sessionActions.objectiveProgressIncremented(1))

  if (nextProgress >= objective.target) {
    completeObjective(dispatch, getState, objective)
    return true
  }

  return false
}

const applyPressureSnapshot = (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const previousPressure = state.pressure.current
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

  const currentPressure = getState().pressure.current
  dispatch(sessionActions.peakPressureUpdated(currentPressure))

  const objective = getState().session.objective
  if (
    objective?.id === 'pressure-survivor' &&
    currentPressure < PRESSURE_OBJECTIVE_THRESHOLD &&
    objective.progress !== 0
  ) {
    dispatch(sessionActions.objectiveProgressSet(0))
  }

  const activeCelebration = getState().session.celebration
  if (
    previousPressure < 80 &&
    currentPressure >= 80 &&
    (!activeCelebration || activeCelebration.tone === 'warning')
  ) {
    dispatch(sessionActions.audioCueEmitted('pressure-danger'))
    dispatch(
      sessionActions.celebrationSet({
        title: 'Pressure Spike',
        body: 'The tower is heating up. Clear space or fire a power-up fast.',
        tone: 'warning',
      }),
    )
  }

  if (currentPressure >= 100) {
    setGameOver(
      dispatch,
      getState,
      'Pressure reached 100%',
      'Pressure maxed out. The tower collapsed.',
    )
  }
}

const spawnNextTile = (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState()
  const preview = state.session.nextTile ?? createRandomTilePreview()
  const queuedPowerUp = state.economy.queuedPowerUp
  const tile = createSpawnTile(preview, queuedPowerUp)

  if (!canOccupyPosition(selectAllTiles(state), tile.x, tile.y)) {
    setGameOver(
      dispatch,
      getState,
      'Spawn lane blocked',
      'No room to spawn. The tower sealed shut.',
    )
    return false
  }

  dispatch(tilesActions.tileSpawned(tile))
  dispatch(sessionActions.activeTileSet(tile.id))
  dispatch(sessionActions.phaseSet('running'))
  const upcoming = getUpcomingPreview(getState())
  dispatch(sessionActions.nextTilePrepared(upcoming.preview))
  if (upcoming.fromTutorial) {
    dispatch(sessionActions.tutorialQueueAdvanced())
  } else {
    dispatch(sessionActions.assistCursorAdvanced())
  }

  let guidedOpeningCompleted = false
  if (getState().session.tutorialQueue.length === 0) {
    guidedOpeningCompleted = completeGuidedOpeningIfNeeded(dispatch, getState)
  }
  if (guidedOpeningCompleted) {
    maybeStartObjectiveLoop(dispatch, getState)
  }

  dispatch(
    sessionActions.statusMessageSet(
      getState().session.tutorialQueue.length > 0
        ? 'Starter queue active. Follow the glowing pads and build your first easy clears.'
        : getState().session.objective
          ? `${getState().session.objective?.title}: ${getState().session.objective?.description}`
          : getState().session.totalWordsCleared < MIN_WORDS_BEFORE_OBJECTIVES
            ? `Fun-first assist is live. Clear ${MIN_WORDS_BEFORE_OBJECTIVES - getState().session.totalWordsCleared} more word${MIN_WORDS_BEFORE_OBJECTIVES - getState().session.totalWordsCleared === 1 ? '' : 's'} to unlock live objectives.`
            : 'Drop in and keep the combo alive.',
    ),
  )

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

const resolveBoardAfterLock = (
  dispatch: AppDispatch,
  getState: () => RootState,
  anchors: Position[],
) => {
  let cascadeDepth = 1
  let scanAnchors = anchors
  let clearedAnyWords = false
  let completedGuidedOpening = false
  let clearedWords = 0
  let maxCascade = 0
  let usedWildcard = false
  const resolvedWords: string[] = []
  const resolvedMatches: WordMatch[] = []

  while (true) {
    const state = getState()
    const lockedTiles = selectLockedTiles(state)
    const scanPool = [...scanAnchors, ...getAllLockedPositions(state)]
    const matches = scanWordsAtPositions(lockedTiles, scanPool, isValidWord)

    if (matches.length === 0) {
      dispatch(sessionActions.comboSet(clearedAnyWords ? cascadeDepth - 1 : 0))
      dispatch(sessionActions.phaseSet('running'))

      if (!clearedAnyWords) {
        dispatch(sessionActions.recentMatchesSet([]))
        dispatch(sessionActions.celebrationSet(null))
        resetRunScopedObjectiveProgress(dispatch, getState)
        dispatch(
          sessionActions.statusMessageSet(
            'No clear this drop. Words must be 3+ connected letters in a straight row or column after the tile locks, and reverse words count too.',
          ),
        )
      }
      break
    }

    clearedAnyWords = true
    clearedWords += matches.length
    maxCascade = Math.max(maxCascade, cascadeDepth)
    usedWildcard ||= matches.some((match) => match.usedWildcard)
    resolvedWords.push(...matches.map((match) => match.resolvedText))
    resolvedMatches.push(...matches)

    dispatch(sessionActions.phaseSet('clearing'))

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
    dispatch(sessionActions.audioCueEmitted('word-clear'))
    if (cascadeDepth > 1) {
      dispatch(sessionActions.audioCueEmitted('combo-escalation'))
    }

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
        : [...matches.flatMap((match) => match.cells), ...getAllLockedPositions(getState())]

    dispatch(sessionActions.phaseSet('scanning'))
    cascadeDepth += 1
  }

  if (clearedAnyWords) {
    completedGuidedOpening = completeGuidedOpeningIfNeeded(dispatch, getState) || completedGuidedOpening
    const stateAfterClears = getState()
    const bestWord = chooseBestWord(stateAfterClears.session.bestWord, resolvedWords)
    const latestWord = resolvedWords[resolvedWords.length - 1] ?? stateAfterClears.session.latestWord
    const summary: ClearResolutionSummary = {
      clearedWords,
      maxCascade,
      usedWildcard,
      resolvedWords,
      matches: resolvedMatches,
    }

    dispatch(
      sessionActions.wordStatsUpdated({
        bestWord,
        latestWord,
      }),
    )
    dispatch(sessionActions.wordsClearedAdded(clearedWords))
    dispatch(sessionActions.recentMatchesSet(resolvedMatches))
    dispatch(sessionActions.celebrationSet(buildClearCelebration(summary, completedGuidedOpening)))

    const objectiveCompleted = updateResolutionObjectiveProgress(dispatch, getState, summary)
    const startedObjective = maybeStartObjectiveLoop(dispatch, getState)

    if (!objectiveCompleted) {
      dispatch(
        sessionActions.statusMessageSet(
          startedObjective
            ? 'You have enough clears. Objectives are now live on the HUD.'
            : maxCascade > 1
              ? `Cascade x${maxCascade}! Cleared ${resolvedWords.join(' + ')}.`
              : getState().session.totalWordsCleared < MIN_WORDS_BEFORE_OBJECTIVES
                ? `Cleared ${resolvedWords.join(' + ')}. Fun-first assist stays on until you reach ${MIN_WORDS_BEFORE_OBJECTIVES} total clears.`
                : `Cleared ${resolvedWords.join(' + ')}.`,
        ),
      )
    }
  }

  applyPressureSnapshot(dispatch, getState)
}

const lockAndResolveActiveTile = (dispatch: AppDispatch, getState: () => RootState) => {
  const activeTile = selectActiveTile(getState())
  if (!activeTile) {
    return
  }

  dispatch(tilesActions.tileLocked(activeTile.id))
  dispatch(sessionActions.audioCueEmitted('tile-lock'))
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
    dispatch(sessionActions.celebrationSet(null))
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
    const upcoming = getUpcomingPreview(getState())
    dispatch(sessionActions.nextTilePrepared(upcoming.preview))
    if (upcoming.fromTutorial) {
      dispatch(sessionActions.tutorialQueueAdvanced())
    } else {
      dispatch(sessionActions.assistCursorAdvanced())
    }
  }

  if (!getState().session.activeTileId && getState().session.phase !== 'game-over') {
    spawnNextTile(dispatch, getState)
    applyPressureSnapshot(dispatch, getState)
  }
}

export const restartGame = (): AppThunk => (dispatch, getState) => {
  const audioState = {
    unlocked: getState().session.audioUnlocked,
    muted: getState().session.audioMuted,
  }

  dispatch(tilesActions.boardReset())
  dispatch(sessionActions.sessionReset())
  dispatch(economyActions.economyReset())
  dispatch(pressureActions.pressureReset())

  if (audioState.unlocked) {
    dispatch(sessionActions.audioUnlocked())
  }
  if (audioState.muted) {
    dispatch(sessionActions.audioMutedSet(true))
  }

  dispatch(sessionActions.audioCueEmitted('restart'))
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
  const completedPressureObjective = advancePressureObjectiveTick(dispatch, getState)
  if (completedPressureObjective) {
    applyPressureSnapshot(dispatch, getState)
  }

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
          deltaX < 0
            ? 'Slide left. Build 3+ letter words horizontally or vertically.'
            : 'Slide right. Build 3+ letter words horizontally or vertically.',
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

export const unlockAudio = (): AppThunk => (dispatch, getState) => {
  if (!getState().session.audioUnlocked) {
    dispatch(sessionActions.audioUnlocked())
  }
}

export const setAudioMuted =
  (muted: boolean): AppThunk =>
  (dispatch) => {
    dispatch(sessionActions.audioMutedSet(muted))
  }
