import { describe, expect, it } from 'vitest'
import { createFunFirstPreview, findAssistOpportunity } from '../game/utils/assist'
import type { TileEntity } from '../game/types'

const createLockedTile = (overrides: Partial<TileEntity>): TileEntity => ({
  id: overrides.id ?? crypto.randomUUID(),
  letter: overrides.letter ?? 'A',
  x: overrides.x ?? 0,
  y: overrides.y ?? 19,
  isMoving: false,
  isSteel: false,
  isWildcard: false,
  fortifiedRowId: overrides.fortifiedRowId,
})

describe('fun-first assist', () => {
  it('prefers visible near-completions over the scripted sequence', () => {
    const tiles = [
      createLockedTile({ id: 'c', letter: 'C', x: 0, y: 19 }),
      createLockedTile({ id: 'a', letter: 'A', x: 1, y: 19 }),
    ]

    const opportunity = findAssistOpportunity(tiles)
    const preview = createFunFirstPreview(tiles, 12)

    expect(opportunity?.letter).toBe('T')
    expect(opportunity?.targetWord).toBe('CAT')
    expect(preview.letter).toBe('T')
    expect(preview.assistMode).toBe('completion')
  })

  it('falls back to the generous scripted sequence when no board opportunity exists', () => {
    const preview = createFunFirstPreview([], 0)

    expect(preview.letter).toBe('C')
    expect(preview.assistMode).toBe('sequence')
    expect(preview.targetWord).toBe('CAT')
  })
})
