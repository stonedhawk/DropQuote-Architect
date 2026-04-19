import type { PowerUpType } from './types'

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const SPAWN_COLUMN = Math.floor(BOARD_WIDTH / 2)
export const MAX_PRESSURE = 100
export const MAX_HISTORY_POINTS = 40
export const MAX_INVENTORY_SLOTS = 3
export const STARTER_TUTORIAL_QUEUE = ['C', 'A', 'T', 'S', 'U', 'N', 'C', 'O', 'D', 'E']
export const PRESSURE_OBJECTIVE_THRESHOLD = 45
export const PRESSURE_OBJECTIVE_TICKS = 6
export const MIN_WORDS_BEFORE_OBJECTIVES = 3

export const EASY_WORD_POOL = [
  'CAT',
  'DOG',
  'SUN',
  'STAR',
  'CODE',
  'GAME',
  'TILE',
  'STACK',
]

export const FUN_FIRST_SEQUENCE = EASY_WORD_POOL.join('').split('')

export const LETTER_BAG = [
  'A',
  'A',
  'A',
  'A',
  'A',
  'E',
  'E',
  'E',
  'E',
  'I',
  'I',
  'I',
  'O',
  'O',
  'O',
  'U',
  'U',
  'L',
  'L',
  'N',
  'N',
  'N',
  'R',
  'R',
  'S',
  'S',
  'S',
  'T',
  'T',
  'T',
  'C',
  'C',
  'D',
  'D',
  'G',
  'G',
  'M',
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
