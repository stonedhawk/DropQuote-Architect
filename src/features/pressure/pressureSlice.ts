import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { MAX_HISTORY_POINTS, MAX_PRESSURE } from '../../game/constants'
import type { PressurePoint } from '../../game/types'

interface PressureState {
  current: number
  max: number
  history: PressurePoint[]
  fortifiedRows: number[]
  reliefReserve: number
}

const initialState: PressureState = {
  current: 0,
  max: MAX_PRESSURE,
  history: [{ tick: 0, pressure: 0 }],
  fortifiedRows: [],
  reliefReserve: 0,
}

const pressureSlice = createSlice({
  name: 'pressure',
  initialState,
  reducers: {
    pressureReset: () => initialState,
    rowsFortified: (state, action: PayloadAction<number[]>) => {
      state.fortifiedRows = Array.from(
        new Set([...state.fortifiedRows, ...action.payload]),
      ).sort((left, right) => left - right)
    },
    pressureReliefGranted: (state, action: PayloadAction<number>) => {
      state.reliefReserve += action.payload
    },
    pressureRecomputed: (
      state,
      action: PayloadAction<{ tick: number; rawPressure: number }>,
    ) => {
      const adjustedPressure = Math.max(
        0,
        action.payload.rawPressure - state.reliefReserve,
      )
      state.current = adjustedPressure
      state.reliefReserve = Math.max(0, state.reliefReserve - 2)

      const lastPoint = state.history[state.history.length - 1]
      if (
        lastPoint?.tick === action.payload.tick &&
        lastPoint.pressure === adjustedPressure
      ) {
        lastPoint.pressure = adjustedPressure
      } else {
        state.history.push({ tick: action.payload.tick, pressure: adjustedPressure })
        if (state.history.length > MAX_HISTORY_POINTS) {
          state.history.shift()
        }
      }
    },
  },
})

export const pressureActions = pressureSlice.actions
export default pressureSlice.reducer
