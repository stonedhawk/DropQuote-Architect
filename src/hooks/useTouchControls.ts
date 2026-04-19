import { useEffect, useEffectEvent, useRef, type RefObject } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { BOARD_WIDTH } from '../game/constants'
import { selectActiveTile } from '../features/game/selectors'
import {
  hardDropActiveTile,
  moveActiveHorizontally,
  softDropActiveTile,
} from '../features/game/thunks'

const DOUBLE_TAP_DELAY_MS = 220
const SWIPE_DROP_THRESHOLD = 40
const TAP_DRIFT_THRESHOLD = 16

export const useTouchControls = (boardRef: RefObject<HTMLElement | null>) => {
  const dispatch = useAppDispatch()
  const activeTile = useAppSelector(selectActiveTile)
  const gestureRef = useRef<{
    pointerId: number
    startX: number
    startY: number
  } | null>(null)
  const lastTapTimerRef = useRef<number | null>(null)
  const pendingTapColumnRef = useRef<number | null>(null)
  const activeTileRef = useRef(activeTile)

  useEffect(() => {
    activeTileRef.current = activeTile
  }, [activeTile])

  const clearPendingTap = useEffectEvent(() => {
    if (lastTapTimerRef.current !== null) {
      window.clearTimeout(lastTapTimerRef.current)
      lastTapTimerRef.current = null
    }
    pendingTapColumnRef.current = null
  })

  const moveToColumn = useEffectEvent((targetColumn: number) => {
    const tile = activeTileRef.current
    if (!tile) {
      return
    }

    const delta = targetColumn - tile.x
    const direction = Math.sign(delta)

    for (let step = 0; step < Math.abs(delta); step += 1) {
      dispatch(moveActiveHorizontally(direction))
    }
  })

  const handlePointerDown = useEffectEvent((event: PointerEvent) => {
    if (!event.isPrimary || event.pointerType === 'mouse') {
      return
    }

    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
    event.preventDefault()
  })

  const handlePointerUp = useEffectEvent((event: PointerEvent) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId || event.pointerType === 'mouse') {
      return
    }

    gestureRef.current = null
    const deltaX = event.clientX - gesture.startX
    const deltaY = event.clientY - gesture.startY
    const absoluteDeltaX = Math.abs(deltaX)
    const absoluteDeltaY = Math.abs(deltaY)

    if (deltaY > SWIPE_DROP_THRESHOLD && absoluteDeltaY > absoluteDeltaX) {
      clearPendingTap()
      dispatch(softDropActiveTile())
      event.preventDefault()
      return
    }

    if (absoluteDeltaX > TAP_DRIFT_THRESHOLD || absoluteDeltaY > TAP_DRIFT_THRESHOLD) {
      clearPendingTap()
      return
    }

    const board = boardRef.current
    if (!board) {
      return
    }

    const bounds = board.getBoundingClientRect()
    const relativeX = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width - 1)
    const targetColumn = Math.max(
      0,
      Math.min(BOARD_WIDTH - 1, Math.floor((relativeX / bounds.width) * BOARD_WIDTH)),
    )

    if (lastTapTimerRef.current !== null) {
      clearPendingTap()
      dispatch(hardDropActiveTile())
      event.preventDefault()
      return
    }

    pendingTapColumnRef.current = targetColumn
    lastTapTimerRef.current = window.setTimeout(() => {
      const pendingColumn = pendingTapColumnRef.current
      clearPendingTap()

      if (pendingColumn !== null) {
        moveToColumn(pendingColumn)
      }
    }, DOUBLE_TAP_DELAY_MS)

    event.preventDefault()
  })

  const handlePointerCancel = useEffectEvent(() => {
    gestureRef.current = null
  })

  useEffect(() => {
    const board = boardRef.current
    if (!board) {
      return
    }

    board.addEventListener('pointerdown', handlePointerDown)
    board.addEventListener('pointerup', handlePointerUp)
    board.addEventListener('pointercancel', handlePointerCancel)

    return () => {
      board.removeEventListener('pointerdown', handlePointerDown)
      board.removeEventListener('pointerup', handlePointerUp)
      board.removeEventListener('pointercancel', handlePointerCancel)
      clearPendingTap()
    }
  }, [boardRef])
}
