import type { PowerUpType } from './types'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const SPAWN_COLUMN = Math.floor(BOARD_WIDTH / 2)
export const MAX_PRESSURE = 100
export const MAX_HISTORY_POINTS = 40
export const MAX_INVENTORY_SLOTS = 3

export const LETTER_BAG = [
  'A',
  'A',
  'A',
  'E',
  'E',
  'E',
  'I',
  'I',
  'O',
  'O',
  'U',
  'L',
  'N',
  'R',
  'S',
  'T',
  'D',
  'G',
  'M',
  'P',
  'B',
  'C',
  'F',
  'H',
]

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const POWER_UP_COSTS: Record<PowerUpType, number> = {
  steel: 6,
  'wrecking-ball': 10,
  mortar: 8,
}

export const POWER_UP_LABELS: Record<PowerUpType, string> = {
  steel: 'Steel Beams',
  'wrecking-ball': 'Wrecking Ball',
  mortar: 'Mortar',
}
