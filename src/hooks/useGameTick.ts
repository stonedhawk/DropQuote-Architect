import { useEffect, useEffectEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { advanceGameTick } from '../features/game/thunks'

export const useGameTick = (intervalMs: number) => {
  const dispatch = useAppDispatch()
  const phase = useAppSelector((state) => state.session.phase)

  const onTick = useEffectEvent(() => {
    if (phase !== 'game-over') {
      dispatch(advanceGameTick())
    }
  })

  useEffect(() => {
    if (phase === 'game-over') {
      return undefined
    }

    const timer = window.setInterval(() => {
      onTick()
    }, intervalMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [intervalMs, phase])
}
