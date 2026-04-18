import { useEffect, useEffectEvent } from 'react'
import { useAppDispatch } from '../app/hooks'
import {
  activateInventorySlot,
  clearQueuedPowerUp,
  hardDropActiveTile,
  moveActiveHorizontally,
  softDropActiveTile,
} from '../features/game/thunks'

export const useGameInput = () => {
  const dispatch = useAppDispatch()

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat) {
      return
    }

    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault()
        dispatch(moveActiveHorizontally(-1))
        break
      case 'ArrowRight':
        event.preventDefault()
        dispatch(moveActiveHorizontally(1))
        break
      case 'ArrowDown':
        event.preventDefault()
        dispatch(softDropActiveTile())
        break
      case 'Space':
        event.preventDefault()
        dispatch(hardDropActiveTile())
        break
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
        dispatch(activateInventorySlot(Number(event.code.slice(-1)) - 1))
        break
      case 'KeyC':
        dispatch(clearQueuedPowerUp())
        break
      default:
        break
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
