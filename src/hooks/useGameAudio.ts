import { useEffect, useEffectEvent, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { selectAudioState } from '../features/game/selectors'
import { unlockAudio } from '../features/game/thunks'
import type { AudioCue } from '../game/types'

const createAudioContext = () => {
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

  return AudioContextCtor ? new AudioContextCtor() : null
}

const beep = (
  context: AudioContext,
  {
    frequency,
    duration,
    type,
    volume,
    delay = 0,
  }: {
    frequency: number
    duration: number
    type: OscillatorType
    volume: number
    delay?: number
  },
) => {
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()
  const startAt = context.currentTime + delay
  const endAt = startAt + duration

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startAt)
  gainNode.gain.setValueAtTime(0.0001, startAt)
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.015)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.start(startAt)
  oscillator.stop(endAt)
}

const playCue = (context: AudioContext, cue: AudioCue) => {
  switch (cue) {
    case 'tile-lock':
      beep(context, { frequency: 220, duration: 0.08, type: 'square', volume: 0.04 })
      break
    case 'word-clear':
      beep(context, { frequency: 523.25, duration: 0.12, type: 'triangle', volume: 0.06 })
      beep(context, { frequency: 659.25, duration: 0.16, type: 'triangle', volume: 0.05, delay: 0.05 })
      break
    case 'combo-escalation':
      beep(context, { frequency: 659.25, duration: 0.1, type: 'square', volume: 0.05 })
      beep(context, { frequency: 783.99, duration: 0.12, type: 'square', volume: 0.05, delay: 0.04 })
      beep(context, { frequency: 987.77, duration: 0.16, type: 'triangle', volume: 0.05, delay: 0.08 })
      break
    case 'objective-complete':
      beep(context, { frequency: 392, duration: 0.08, type: 'triangle', volume: 0.05 })
      beep(context, { frequency: 523.25, duration: 0.1, type: 'triangle', volume: 0.05, delay: 0.05 })
      beep(context, { frequency: 783.99, duration: 0.18, type: 'sine', volume: 0.05, delay: 0.1 })
      break
    case 'pressure-danger':
      beep(context, { frequency: 196, duration: 0.16, type: 'sawtooth', volume: 0.045 })
      beep(context, { frequency: 164.81, duration: 0.2, type: 'sawtooth', volume: 0.04, delay: 0.08 })
      break
    case 'game-over':
      beep(context, { frequency: 261.63, duration: 0.14, type: 'square', volume: 0.05 })
      beep(context, { frequency: 196, duration: 0.18, type: 'square', volume: 0.045, delay: 0.08 })
      beep(context, { frequency: 130.81, duration: 0.24, type: 'triangle', volume: 0.04, delay: 0.18 })
      break
    case 'restart':
      beep(context, { frequency: 392, duration: 0.08, type: 'triangle', volume: 0.04 })
      beep(context, { frequency: 523.25, duration: 0.1, type: 'triangle', volume: 0.045, delay: 0.04 })
      break
  }
}

export const useGameAudio = () => {
  const dispatch = useAppDispatch()
  const { unlocked, muted, cue } = useAppSelector(selectAudioState)
  const contextRef = useRef<AudioContext | null>(null)
  const lastCueIdRef = useRef<string | null>(null)

  const unlockOnInteraction = useEffectEvent(async () => {
    if (!contextRef.current) {
      contextRef.current = createAudioContext()
    }

    if (contextRef.current?.state === 'suspended') {
      await contextRef.current.resume()
    }

    dispatch(unlockAudio())
  })

  useEffect(() => {
    const handlePointerDown = () => {
      void unlockOnInteraction()
    }

    const handleKeyDown = () => {
      void unlockOnInteraction()
    }

    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!cue || !unlocked || muted || lastCueIdRef.current === cue.id) {
      return
    }

    if (!contextRef.current) {
      contextRef.current = createAudioContext()
    }

    const context = contextRef.current
    if (!context) {
      return
    }

    lastCueIdRef.current = cue.id

    const play = async () => {
      if (context.state === 'suspended') {
        await context.resume()
      }

      playCue(context, cue.cue)
    }

    void play()
  }, [cue, unlocked, muted])

  useEffect(() => {
    return () => {
      void contextRef.current?.close()
    }
  }, [])
}
