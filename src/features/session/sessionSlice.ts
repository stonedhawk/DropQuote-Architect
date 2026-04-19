import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { STARTER_TUTORIAL_QUEUE } from '../../game/constants'
import type {
  AudioCue,
  AudioCueEvent,
  CelebrationState,
  GameOverSummary,
  GamePhase,
  ObjectiveState,
  TilePreview,
  WordMatch,
} from '../../game/types'

interface SessionState {
  phase: GamePhase
  tick: number
  score: number
  combo: number
  topCombo: number
  activeTileId: string | null
  nextTile: TilePreview | null
  tutorialQueue: string[]
  guidedOpeningComplete: boolean
  celebration: CelebrationState | null
  objective: ObjectiveState | null
  gameOverSummary: GameOverSummary | null
  bestWord: string | null
  latestWord: string | null
  peakPressure: number
  audioUnlocked: boolean
  audioMuted: boolean
  lastAudioCue: AudioCueEvent | null
  recentMatches: WordMatch[]
  statusMessage: string
  totalWordsCleared: number
  assistCursor: number
}

const initialState: SessionState = {
  phase: 'idle',
  tick: 0,
  score: 0,
  combo: 0,
  topCombo: 0,
  activeTileId: null,
  nextTile: null,
  tutorialQueue: [...STARTER_TUTORIAL_QUEUE],
  guidedOpeningComplete: false,
  celebration: null,
  objective: null,
  gameOverSummary: null,
  bestWord: null,
  latestWord: null,
  peakPressure: 0,
  audioUnlocked: false,
  audioMuted: false,
  lastAudioCue: null,
  recentMatches: [],
  statusMessage: 'Press restart to begin the drop.',
  totalWordsCleared: 0,
  assistCursor: 0,
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
    tutorialQueueAdvanced: (state) => {
      state.tutorialQueue.shift()
    },
    scoreRegistered: (
      state,
      action: PayloadAction<{ points: number; combo: number }>,
    ) => {
      state.score += action.payload.points
      state.combo = action.payload.combo
      state.topCombo = Math.max(state.topCombo, action.payload.combo)
    },
    comboSet: (state, action: PayloadAction<number>) => {
      state.combo = action.payload
    },
    wordsClearedAdded: (state, action: PayloadAction<number>) => {
      state.totalWordsCleared += action.payload
    },
    assistCursorAdvanced: (state) => {
      state.assistCursor += 1
    },
    guidedOpeningCompleted: (state) => {
      state.guidedOpeningComplete = true
      state.tutorialQueue = []
    },
    celebrationSet: (state, action: PayloadAction<CelebrationState | null>) => {
      state.celebration = action.payload
    },
    objectiveSet: (state, action: PayloadAction<ObjectiveState | null>) => {
      state.objective = action.payload
    },
    objectiveProgressSet: (state, action: PayloadAction<number>) => {
      if (state.objective) {
        state.objective.progress = Math.min(action.payload, state.objective.target)
      }
    },
    objectiveProgressIncremented: (state, action: PayloadAction<number>) => {
      if (state.objective) {
        state.objective.progress = Math.min(
          state.objective.progress + action.payload,
          state.objective.target,
        )
      }
    },
    gameOverSummarySet: (state, action: PayloadAction<GameOverSummary | null>) => {
      state.gameOverSummary = action.payload
    },
    wordStatsUpdated: (
      state,
      action: PayloadAction<{ bestWord: string | null; latestWord: string | null }>,
    ) => {
      state.bestWord = action.payload.bestWord
      state.latestWord = action.payload.latestWord
    },
    peakPressureUpdated: (state, action: PayloadAction<number>) => {
      state.peakPressure = Math.max(state.peakPressure, action.payload)
    },
    recentMatchesSet: (state, action: PayloadAction<WordMatch[]>) => {
      state.recentMatches = action.payload
    },
    statusMessageSet: (state, action: PayloadAction<string>) => {
      state.statusMessage = action.payload
    },
    audioUnlocked: (state) => {
      state.audioUnlocked = true
    },
    audioMutedSet: (state, action: PayloadAction<boolean>) => {
      state.audioMuted = action.payload
    },
    audioCueEmitted: {
      reducer: (state, action: PayloadAction<AudioCueEvent>) => {
        state.lastAudioCue = action.payload
      },
      prepare: (cue: AudioCue) => ({
        payload: {
          id: crypto.randomUUID(),
          cue,
        },
      }),
    },
  },
})

export const sessionActions = sessionSlice.actions
export default sessionSlice.reducer
