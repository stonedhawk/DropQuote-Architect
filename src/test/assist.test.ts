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
  isWildcard: overrides.isWildcard ?? false,
  fortifiedRowId: overrides.fortifiedRowId,
})

describe('assist generator', () => {
  it('prefers visible near-completions over the fallback sequence', () => {
    const opportunity = findAssistOpportunity([
      createLockedTile({ letter: 'C', x: 0, y: 19 }),
      createLockedTile({ letter: 'A', x: 1, y: 19 }),
    ])

    expect(opportunity).not.toBeNull()
    expect(opportunity?.letter).toBe('T')
    expect(['CAT', 'CATS']).toContain(opportunity?.targetWord)
  })

  it('does not treat a single lonely letter as a completion opportunity', () => {
    const preview = createFunFirstPreview(
      [createLockedTile({ letter: 'O', x: 4, y: 19 })],
      0,
      'guided',
    )

    expect(preview.assistMode).toBe('sequence')
    expect(preview.letter).toBe('C')
  })

  it('falls back safely when the board has no assistable opportunities', () => {
    const preview = createFunFirstPreview([], 4, 'survival')

    expect(preview.letter).toBeTruthy()
    expect(preview.assistMode).toBe('fallback')
  })
})
