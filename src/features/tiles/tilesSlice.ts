import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import type { TileEntity, TilePositionUpdate } from '../../game/types'

const tilesAdapter = createEntityAdapter<TileEntity>()

const initialState = tilesAdapter.getInitialState({
  lastLockedTileId: null as string | null,
  lastClearedTileIds: [] as string[],
})

const tilesSlice = createSlice({
  name: 'tiles',
  initialState,
  reducers: {
    boardReset: (state) => {
      tilesAdapter.removeAll(state)
      state.lastLockedTileId = null
      state.lastClearedTileIds = []
    },
    tileSpawned: (state, action: PayloadAction<TileEntity>) => {
      tilesAdapter.addOne(state, action.payload)
      state.lastClearedTileIds = []
    },
    tileMoved: (
      state,
      action: PayloadAction<{ id: string; x: number; y: number }>,
    ) => {
      tilesAdapter.updateOne(state, {
        id: action.payload.id,
        changes: { x: action.payload.x, y: action.payload.y },
      })
    },
    tileLocked: (state, action: PayloadAction<string>) => {
      tilesAdapter.updateOne(state, {
        id: action.payload,
        changes: { isMoving: false },
      })
      state.lastLockedTileId = action.payload
    },
    tilesUpdated: (state, action: PayloadAction<TilePositionUpdate[]>) => {
      tilesAdapter.updateMany(
        state,
        action.payload.map((update) => ({
          id: update.id,
          changes: { x: update.x, y: update.y },
        })),
      )
    },
    tilesRemoved: (state, action: PayloadAction<string[]>) => {
      tilesAdapter.removeMany(state, action.payload)
      state.lastClearedTileIds = action.payload
    },
  },
})

export const tilesActions = tilesSlice.actions
export const tilesReducer = tilesSlice.reducer
export const tilesSelectors = tilesAdapter.getSelectors<RootState>(
  (state) => state.tiles,
)

export default tilesReducer
