import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DIFFICULTY_BAND_THRESHOLDS,
  MAX_PRESSURE,
} from '../constants'
import type { DifficultyBand, TileEntity } from '../types'

const PRESSURE_GRACE_BY_BAND: Record<DifficultyBand, number> = {
  guided: 12,
  steady: 8,
  climb: 4,
  survival: 2,
}

const PRESSURE_SCALE_BY_BAND: Record<DifficultyBand, number> = {
  guided: 0.55,
  steady: 0.75,
  climb: 0.95,
  survival: 1.1,
}

const TICK_PROFILE_BY_BAND: Record<
  DifficultyBand,
  {
    base: number
    light: number
    low: number
    medium: number
    high: number
    danger: number
  }
> = {
  guided: {
    base: 1620,
    light: 1490,
    low: 1360,
    medium: 1210,
    high: 1080,
    danger: 930,
  },
  steady: {
    base: 1480,
    light: 1360,
    low: 1230,
    medium: 1090,
    high: 960,
    danger: 820,
  },
  climb: {
    base: 1340,
    light: 1230,
    low: 1110,
    medium: 980,
    high: 850,
    danger: 720,
  },
  survival: {
    base: 1200,
    light: 1100,
    low: 995,
    medium: 875,
    high: 760,
    danger: 640,
  },
}

export const getDifficultyBand = (totalWordsCleared: number): DifficultyBand => {
  if (totalWordsCleared >= DIFFICULTY_BAND_THRESHOLDS.survival) {
    return 'survival'
  }

  if (totalWordsCleared >= DIFFICULTY_BAND_THRESHOLDS.climb) {
    return 'climb'
  }

  if (totalWordsCleared >= DIFFICULTY_BAND_THRESHOLDS.steady) {
    return 'steady'
  }

  return 'guided'
}

export const getNextDifficultyMilestone = (totalWordsCleared: number) => {
  if (totalWordsCleared < DIFFICULTY_BAND_THRESHOLDS.steady) {
    return DIFFICULTY_BAND_THRESHOLDS.steady
  }

  if (totalWordsCleared < DIFFICULTY_BAND_THRESHOLDS.climb) {
    return DIFFICULTY_BAND_THRESHOLDS.climb
  }

  if (totalWordsCleared < DIFFICULTY_BAND_THRESHOLDS.survival) {
    return DIFFICULTY_BAND_THRESHOLDS.survival
  }

  return null
}

export const calculateRawPressure = (
  tiles: TileEntity[],
  fortifiedRows: number[],
  difficultyBand: DifficultyBand = 'guided',
) => {
  const fortified = new Set(fortifiedRows)
  const contributingTiles = tiles.filter(
    (tile) => !tile.isMoving && !fortified.has(tile.y),
  )

  const effectiveTiles = Math.max(
    0,
    contributingTiles.length - PRESSURE_GRACE_BY_BAND[difficultyBand],
  )
  const ratio = effectiveTiles / (BOARD_WIDTH * BOARD_HEIGHT)
  return Math.min(
    MAX_PRESSURE,
    Math.round(ratio * 100 * PRESSURE_SCALE_BY_BAND[difficultyBand]),
  )
}

export const getTickIntervalFromPressure = (
  pressure: number,
  difficultyBand: DifficultyBand = 'guided',
) => {
  const profile = TICK_PROFILE_BY_BAND[difficultyBand]

  if (pressure >= 90) {
    return profile.danger
  }
  if (pressure >= 70) {
    return profile.high
  }
  if (pressure >= 50) {
    return profile.medium
  }
  if (pressure >= 30) {
    return profile.low
  }
  if (pressure >= 15) {
    return profile.light
  }
  return profile.base
}

export const getBoardFillPercent = (tiles: TileEntity[]) =>
  Math.round((tiles.filter((tile) => !tile.isMoving).length / (BOARD_WIDTH * BOARD_HEIGHT)) * 100)
