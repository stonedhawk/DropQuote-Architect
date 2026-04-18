import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { GamePhase, TilePreview, WordMatch } from '../../game/types'

interface SessionState {
  phase: GamePhase
  tick: number
  score: number
  combo: number
  activeTileId: string | null
  nextTile: TilePreview | null
  recentMatches: WordMatch[]
  statusMessage: string
}

const initialState: SessionState = {
  phase: 'idle',
  tick: 0,
  score: 0,
  combo: 0,
  activeTileId: null,
  nextTile: null,
  recentMatches: [],
  statusMessage: 'Press restart to begin the drop.',
}

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    sessionReset: () => initialState,
    tickAdvanced: (state) => {
      state.tick += 1
    },
    phaseSet: (state, action: PayloadAction<GamePhase>) => {
      state.phase = action.payload
    },
    activeTileSet: (state, action: PayloadAction<string | null>) => {
      state.activeTileId = action.payload
    },
    nextTilePrepared: (state, action: PayloadAction<TilePreview>) => {
      state.nextTile = action.payload
    },
    scoreRegistered: (
      state,
      action: PayloadAction<{ points: number; combo: number }>,
    ) => {
      state.score += action.payload.points
      state.combo = action.payload.combo
    },
    comboSet: (state, action: PayloadAction<number>) => {
      state.combo = action.payload
    },
    recentMatchesSet: (state, action: PayloadAction<WordMatch[]>) => {
      state.recentMatches = action.payload
    },
    statusMessageSet: (state, action: PayloadAction<string>) => {
      state.statusMessage = action.payload
    },
  },
})

export const sessionActions = sessionSlice.actions
export default sessionSlice.reducer
