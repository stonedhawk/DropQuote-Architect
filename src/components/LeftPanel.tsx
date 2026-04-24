import { useAppDispatch, useAppSelector } from '../app/hooks'
import { POWER_UP_COSTS, POWER_UP_LABELS } from '../game/constants'
import type { PowerUpType } from '../game/types'
import {
  activateInventorySlot,
  buyPowerUp,
  clearQueuedPowerUp,
} from '../features/game/thunks'

const powerUps: PowerUpType[] = ['steel', 'wrecking-ball', 'mortar']

export const LeftPanel = () => {
  const dispatch = useAppDispatch()
  const ink = useAppSelector((state) => state.economy.ink)
  const inventory = useAppSelector((state) => state.economy.inventory)
  const queuedPowerUp = useAppSelector((state) => state.economy.queuedPowerUp)
  const tutorialQueue = useAppSelector((state) => state.session.tutorialQueue)

  return (
    <aside className="flex flex-col gap-4">
      <section className="arcade-panel px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-700">
              Run Shop
            </p>
            <h3 className="text-2xl font-black text-slate-950">{ink} Ink</h3>
          </div>
          {queuedPowerUp ? (
            <button
              type="button"
              className="arcade-button bg-slate-800 text-white shadow-[0_8px_0_#0f172a]"
              onClick={() => dispatch(clearQueuedPowerUp())}
            >
              Clear {POWER_UP_LABELS[queuedPowerUp]}
            </button>
          ) : (
            <span className="arcade-pill bg-white text-slate-800">No modifier queued</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {tutorialQueue.length > 0 ? (
            <span className="arcade-pill bg-emerald-300 text-emerald-950">
              Starter assist active
            </span>
          ) : null}
          <span className="arcade-pill bg-amber-300 text-amber-950">
            Inventory {inventory.length}/3
          </span>
        </div>
      </section>

      <details className="arcade-panel group overflow-hidden px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">
              Power Shop
            </p>
            <h3 className="text-2xl font-black text-slate-950">Spend Ink</h3>
          </div>
          <span className="arcade-pill bg-amber-300 text-amber-950">
            Tap to {inventory.length >= 3 ? 'review' : 'buy'}
          </span>
        </summary>

        <div className="mt-4 grid gap-3">
          {powerUps.map((powerUp) => {
            const canAfford = ink >= POWER_UP_COSTS[powerUp]
            const inventoryFull = inventory.length >= 3

            return (
              <button
                key={powerUp}
                type="button"
                className={[
                  'rounded-[22px] border-4 px-4 py-4 text-left transition',
                  canAfford && !inventoryFull
                    ? 'border-white bg-white/75 text-slate-950 hover:-translate-y-0.5 hover:bg-white'
                    : 'border-white/50 bg-white/45 text-slate-500',
                ].join(' ')}
                onClick={() => dispatch(buyPowerUp(powerUp))}
                disabled={!canAfford || inventoryFull}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-fuchsia-700">
                      {POWER_UP_LABELS[powerUp]}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {powerUp === 'steel'
                        ? 'Fortify a cleared row and slam the pressure meter.'
                        : powerUp === 'wrecking-ball'
                          ? 'Blast the current column straight down.'
                          : 'Drop a wildcard tile that can finish almost anything.'}
                    </p>
                  </div>
                  <span className="arcade-pill bg-emerald-300 text-emerald-950">
                    {POWER_UP_COSTS[powerUp]} Ink
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </details>

      <details className="arcade-panel group overflow-hidden px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-700">
              Inventory
            </p>
            <h3 className="text-2xl font-black text-slate-950">Three Hot Slots</h3>
          </div>
          <span className="arcade-pill bg-fuchsia-300 text-fuchsia-950">
            Keys 1-3
          </span>
        </summary>

        <div className="mt-4 grid gap-3">
          {Array.from({ length: 3 }, (_, index) => inventory[index] ?? null).map(
            (powerUp, index) => (
              <button
                key={`inventory-${index}`}
                type="button"
                className={[
                  'rounded-[20px] border-4 px-4 py-4 text-left transition',
                  powerUp
                    ? 'border-white bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(255,255,255,0.75))] hover:-translate-y-0.5'
                    : 'border-dashed border-white/45 bg-white/30 text-slate-500',
                ].join(' ')}
                disabled={!powerUp}
                onClick={() => dispatch(activateInventorySlot(index))}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">
                      Slot {index + 1}
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">
                      {powerUp ? POWER_UP_LABELS[powerUp] : 'Empty'}
                    </p>
                  </div>
                  <span className="arcade-pill bg-white text-slate-700">
                    {powerUp ? 'Use now' : 'Waiting'}
                  </span>
                </div>
              </button>
            ),
          )}
        </div>
      </details>
    </aside>
  )
}
