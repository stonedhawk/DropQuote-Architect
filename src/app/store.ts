import { configureStore } from '@reduxjs/toolkit'
import economyReducer from '../features/economy/economySlice'
import pressureReducer from '../features/pressure/pressureSlice'
import sessionReducer from '../features/session/sessionSlice'
import tilesReducer from '../features/tiles/tilesSlice'

export const createAppStore = () =>
  configureStore({
    reducer: {
      tiles: tilesReducer,
      session: sessionReducer,
      economy: economyReducer,
      pressure: pressureReducer,
    },
  })

export const store = createAppStore()

export type AppStore = typeof store
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
