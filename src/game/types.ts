export type Axis = 'horizontal' | 'vertical'
export type PowerUpType = 'steel' | 'wrecking-ball' | 'mortar'
export type QueuedPowerUp = Exclude<PowerUpType, 'wrecking-ball'> | null
export type GamePhase = 'idle' | 'running' | 'scanning' | 'clearing' | 'game-over'

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
