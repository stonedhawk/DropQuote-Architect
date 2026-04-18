import type { WordMatch } from '../types'

export const scoreWordMatch = (match: WordMatch, cascadeDepth: number) =>
  match.scoreValue + (cascadeDepth - 1) * 60 + (match.usedWildcard ? 40 : 0)

export const inkForWordMatch = (match: WordMatch, cascadeDepth: number) =>
  match.tileIds.length + Math.max(0, cascadeDepth - 1)

export const getPressureReliefForSteel = (rowCount: number) => rowCount * 18
