import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { MAX_INVENTORY_SLOTS } from '../../game/constants'
import type { PowerUpType, QueuedPowerUp } from '../../game/types'

interface EconomyState {
  ink: number
  inventory: PowerUpType[]
  queuedPowerUp: QueuedPowerUp
}

const initialState: EconomyState = {
  ink: 0,
  inventory: [],
  queuedPowerUp: null,
}

const economySlice = createSlice({
  name: 'economy',
  initialState,
  reducers: {
    economyReset: () => initialState,
    inkAwarded: (state, action: PayloadAction<number>) => {
      state.ink += action.payload
    },
    inkSpent: (state, action: PayloadAction<number>) => {
      state.ink = Math.max(0, state.ink - action.payload)
    },
    powerUpPurchased: (state, action: PayloadAction<PowerUpType>) => {
      if (state.inventory.length < MAX_INVENTORY_SLOTS) {
        state.inventory.push(action.payload)
      }
    },
    powerUpGranted: (state, action: PayloadAction<PowerUpType>) => {
      if (state.inventory.length < MAX_INVENTORY_SLOTS) {
        state.inventory.push(action.payload)
      }
    },
    inventorySlotRemoved: (state, action: PayloadAction<number>) => {
      state.inventory.splice(action.payload, 1)
    },
    queuedPowerUpSet: (state, action: PayloadAction<QueuedPowerUp>) => {
      state.queuedPowerUp = action.payload
    },
    queuedPowerUpCleared: (state) => {
      state.queuedPowerUp = null
    },
  },
})

export const economyActions = economySlice.actions
export default economySlice.reducer
