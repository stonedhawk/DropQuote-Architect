import type { ObjectiveId, ObjectiveState, PowerUpType } from '../types'

const objectiveSequence: ObjectiveId[] = [
  'double-clear-run',
  'combo-two',
  'wildcard-clear',
  'pressure-survivor',
]

const objectiveTemplates: Record<
  ObjectiveId,
  Omit<ObjectiveState, 'progress'> & { reward: ObjectiveState['reward'] }
> = {
  'double-clear-run': {
    id: 'double-clear-run',
    title: 'Double Draft',
    description: 'Clear 2 words in one locked turn.',
    target: 2,
    reward: {
      ink: 4,
      pressureRelief: 6,
    },
  },
  'combo-two': {
    id: 'combo-two',
    title: 'Combo Cadet',
    description: 'Hit combo x2 in one chain.',
    target: 2,
    reward: {
      ink: 5,
      pressureRelief: 8,
      bonusPowerUp: 'steel',
    },
  },
  'wildcard-clear': {
    id: 'wildcard-clear',
    title: 'Mortar Magic',
    description: 'Clear a word using a wildcard tile.',
    target: 1,
    reward: {
      ink: 4,
      pressureRelief: 10,
      bonusPowerUp: 'mortar',
    },
  },
  'pressure-survivor': {
    id: 'pressure-survivor',
    title: 'Pressure Proof',
    description: 'Stay alive for 6 ticks while pressure is at least 45%.',
    target: 6,
    reward: {
      ink: 6,
      pressureRelief: 12,
      bonusPowerUp: 'wrecking-ball',
    },
  },
}

export const createObjectiveState = (id: ObjectiveId): ObjectiveState => ({
  ...objectiveTemplates[id],
  progress: 0,
})

export const getNextObjectiveId = (currentId: ObjectiveId | null) => {
  if (!currentId) {
    return objectiveSequence[0]
  }

  const currentIndex = objectiveSequence.indexOf(currentId)
  const nextIndex = (currentIndex + 1) % objectiveSequence.length
  return objectiveSequence[nextIndex]
}

export const rewardCanBeGranted = (
  bonusPowerUp: PowerUpType | undefined,
  inventoryCount: number,
) => Boolean(bonusPowerUp) && inventoryCount < 3
