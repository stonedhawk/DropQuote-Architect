import { describe, expect, it } from 'vitest'
import { createAppStore } from '../app/store'
import { economyActions } from '../features/economy/economySlice'
import { advanceGameTick, activateInventorySlot, buyPowerUp, hardDropActiveTile, initializeGame, moveActiveHorizontally, restartGame } from '../features/game/thunks'
import { selectActiveTile, selectLockedTiles, selectProjectedMatches, selectTutorialCoach } from '../features/game/selectors'
import { sessionActions } from '../features/session/sessionSlice'
import { tilesActions } from '../features/tiles/tilesSlice'
import { createObjectiveState } from '../game/utils/objectives'
import type { TileEntity } from '../game/types'

const createLockedTile = (overrides: Partial<TileEntity>): TileEntity => ({
  id: overrides.id ?? crypto.randomUUID(),
  letter: overrides.letter ?? 'A',
  x: overrides.x ?? 0,
  y: overrides.y ?? 19,
  isMoving: false,
  isSteel: overrides.isSteel ?? false,
  isWildcard: overrides.isWildcard ?? false,
  fortifiedRowId: overrides.fortifiedRowId,
})

describe('game loop integration', () => {
  it('drops a tile, locks it, and spawns the next one', () => {
    const store = createAppStore()

    store.dispatch(restartGame())
    const firstActive = selectActiveTile(store.getState())
    expect(firstActive).not.toBeNull()
    expect(firstActive?.letter).toBe('C')

    store.dispatch(advanceGameTick())
    const movedTile = selectActiveTile(store.getState())
    expect(movedTile?.y).toBe(1)

    store.dispatch(hardDropActiveTile())
    const lockedTiles = selectLockedTiles(store.getState())

    expect(lockedTiles.length).toBe(1)
    expect(lockedTiles[0]?.y).toBe(19)
    expect(selectActiveTile(store.getState())).not.toBeNull()
    expect(selectActiveTile(store.getState())?.letter).toBe('A')
    expect(selectTutorialCoach(store.getState()).currentTarget?.letter).toBe('C')
  })

  it('keeps horizontal movement inside board boundaries', () => {
    const store = createAppStore()

    store.dispatch(restartGame())
    for (let index = 0; index < 10; index += 1) {
      store.dispatch(moveActiveHorizontally(-1))
    }

    expect(selectActiveTile(store.getState())?.x).toBe(0)
  })

  it('clears words and collapses tiles above the gap', () => {
    const store = createAppStore()

    store.dispatch(sessionActions.nextTilePrepared({ letter: 'C' }))
    store.dispatch(tilesActions.tileSpawned(createLockedTile({ id: 'a', letter: 'A', x: 3, y: 19 })))
    store.dispatch(tilesActions.tileSpawned(createLockedTile({ id: 'r', letter: 'R', x: 4, y: 19 })))
    store.dispatch(tilesActions.tileSpawned(createLockedTile({ id: 'b', letter: 'B', x: 3, y: 17 })))
    store.dispatch(initializeGame())

    store.dispatch(hardDropActiveTile())
    const lockedTiles = selectLockedTiles(store.getState())

    expect(lockedTiles.find((tile) => tile.id === 'a')).toBeUndefined()
    expect(lockedTiles.find((tile) => tile.id === 'r')).toBeUndefined()
    expect(lockedTiles.find((tile) => tile.id === 'b')?.y).toBe(19)
  })

  it('deploys a wrecking ball from inventory against the current column', () => {
    const store = createAppStore()

    store.dispatch(restartGame())
    store.dispatch(economyActions.inkAwarded(20))
    store.dispatch(buyPowerUp('wrecking-ball'))

    const activeColumn = selectActiveTile(store.getState())?.x ?? 5
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'column-a', x: activeColumn, y: 18 }),
      ),
    )
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'column-b', x: activeColumn, y: 19 }),
      ),
    )

    store.dispatch(activateInventorySlot(0))

    const lockedTiles = selectLockedTiles(store.getState())
    expect(lockedTiles.some((tile) => tile.x === activeColumn)).toBe(false)
  })

  it('fortifies rows and drops pressure when a steel tile completes a word', () => {
    const store = createAppStore()

    store.dispatch(economyActions.inkAwarded(20))
    store.dispatch(buyPowerUp('steel'))
    store.dispatch(activateInventorySlot(0))
    store.dispatch(sessionActions.nextTilePrepared({ letter: 'C' }))
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'a', letter: 'A', x: 3, y: 19 }),
      ),
    )
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'r', letter: 'R', x: 4, y: 19 }),
      ),
    )
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'spare', letter: 'Z', x: 8, y: 19 }),
      ),
    )
    store.dispatch(initializeGame())

    store.dispatch(hardDropActiveTile())

    expect(store.getState().pressure.fortifiedRows).toContain(19)
    expect(store.getState().pressure.current).toBe(0)
    expect(store.getState().pressure.history.length).toBeGreaterThan(1)
  })

  it('previews a clear when the active tile would finish the guided word', () => {
    const store = createAppStore()

    store.dispatch(restartGame())
    store.dispatch(hardDropActiveTile()) // C
    store.dispatch(moveActiveHorizontally(1))
    store.dispatch(hardDropActiveTile()) // A
    store.dispatch(moveActiveHorizontally(2))

    const projectedMatches = selectProjectedMatches(store.getState())

    expect(projectedMatches.map((match) => match.resolvedText)).toContain('CAT')
  })

  it('celebrates the guided first word when CAT is completed', () => {
    const store = createAppStore()

    store.dispatch(restartGame())
    store.dispatch(hardDropActiveTile()) // C
    store.dispatch(moveActiveHorizontally(1))
    store.dispatch(hardDropActiveTile()) // A
    store.dispatch(moveActiveHorizontally(2))
    store.dispatch(hardDropActiveTile()) // T

    expect(store.getState().session.recentMatches.map((match) => match.resolvedText)).toContain('CAT')
    expect(store.getState().session.score).toBeGreaterThan(0)
    expect(selectTutorialCoach(store.getState()).active).toBe(false)
    expect(store.getState().session.objective?.id).toBe('double-clear-run')
  })

  it('completes the double-clear objective and rotates to the next one', () => {
    const store = createAppStore()

    store.dispatch(sessionActions.guidedOpeningCompleted())
    store.dispatch(sessionActions.objectiveSet(createObjectiveState('double-clear-run')))
    store.dispatch(sessionActions.nextTilePrepared({ letter: 'C' }))
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'cab-mid', letter: 'A', x: 3, y: 17 }),
      ),
    )
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'cab-right', letter: 'B', x: 4, y: 17 }),
      ),
    )
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'cat-mid', letter: 'A', x: 2, y: 18 }),
      ),
    )
    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'cat-bottom', letter: 'T', x: 2, y: 19 }),
      ),
    )
    store.dispatch(initializeGame())

    store.dispatch(moveActiveHorizontally(-1))
    store.dispatch(moveActiveHorizontally(-1))
    store.dispatch(moveActiveHorizontally(-1))
    store.dispatch(hardDropActiveTile())

    expect(store.getState().session.recentMatches.map((match) => match.resolvedText)).toEqual(
      expect.arrayContaining(['CAB', 'CAT']),
    )
    expect(store.getState().session.objective?.id).toBe('combo-two')
    expect(store.getState().economy.ink).toBeGreaterThanOrEqual(4)
  })

  it('records a game-over summary when the spawn lane is blocked', () => {
    const store = createAppStore()

    store.dispatch(
      tilesActions.tileSpawned(
        createLockedTile({ id: 'spawn-blocker', x: 5, y: 0 }),
      ),
    )
    store.dispatch(initializeGame())

    expect(store.getState().session.phase).toBe('game-over')
    expect(store.getState().session.gameOverSummary?.reason).toBe('Spawn lane blocked')
  })

  it('restart resets score, objective progress, and game-over summary', () => {
    const store = createAppStore()

    store.dispatch(sessionActions.guidedOpeningCompleted())
    store.dispatch(sessionActions.objectiveSet(createObjectiveState('combo-two')))
    store.dispatch(
      sessionActions.gameOverSummarySet({
        reason: 'Pressure reached 100%',
        finalScore: 900,
        bestWord: 'CODE',
        latestWord: 'CAT',
        topCombo: 3,
        peakPressure: 100,
      }),
    )
    store.dispatch(
      sessionActions.scoreRegistered({
        points: 900,
        combo: 3,
      }),
    )

    store.dispatch(restartGame())

    expect(store.getState().session.score).toBe(0)
    expect(store.getState().session.objective).toBeNull()
    expect(store.getState().session.gameOverSummary).toBeNull()
    expect(store.getState().pressure.history).toEqual([{ tick: 0, pressure: 0 }])
    expect(store.getState().session.guidedOpeningComplete).toBe(false)
  })
})
