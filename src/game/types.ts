export type Axis = 'horizontal' | 'vertical'
export type PowerUpType = 'steel' | 'wrecking-ball' | 'mortar'
export type QueuedPowerUp = Exclude<PowerUpType, 'wrecking-ball'> | null
export type GamePhase = 'idle' | 'running' | 'scanning' | 'clearing' | 'game-over'
export type ObjectiveId =
  | 'double-clear-run'
  | 'combo-two'
  | 'wildcard-clear'
  | 'pressure-survivor'
export type AudioCue =
  | 'tile-lock'
  | 'word-clear'
  | 'combo-escalation'
  | 'objective-complete'
  | 'pressure-danger'
  | 'game-over'
  | 'restart'

export interface Position {
  x: number
  y: number
}

export interface TileEntity {
  id: string
  letter: string
  x: number
  y: number
  isMoving: boolean
  isSteel: boolean
  isWildcard: boolean
  fortifiedRowId?: number
}

export interface WordMatch {
  id: string
  axis: Axis
  cells: Position[]
  tileIds: string[]
  resolvedText: string
  usedWildcard: boolean
  scoreValue: number
}

export interface TilePreview {
  letter: string
}

export interface PressurePoint {
  tick: number
  pressure: number
}

export interface TilePositionUpdate {
  id: string
  x: number
  y: number
}

export interface ObjectiveReward {
  ink: number
  pressureRelief: number
  bonusPowerUp?: PowerUpType
}

export interface ObjectiveState {
  id: ObjectiveId
  title: string
  description: string
  progress: number
  target: number
  reward: ObjectiveReward
}

export interface CelebrationState {
  title: string
  body: string
  tone: 'success' | 'objective' | 'warning'
}

export interface GameOverSummary {
  reason: string
  finalScore: number
  bestWord: string | null
  latestWord: string | null
  topCombo: number
  peakPressure: number
}

export interface AudioCueEvent {
  id: string
  cue: AudioCue
}
