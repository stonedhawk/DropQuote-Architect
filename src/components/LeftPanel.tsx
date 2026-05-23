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
      {/* 1. Run Shop Header Card */}
      <section className="arcade-panel px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-fuchsia-700">
              Run Balance
            </p>
            <h3 className="text-3xl font-black text-slate-950 mt-1">{ink} Ink</h3>
          </div>
          {queuedPowerUp ? (
            <button
              type="button"
              className="arcade-button bg-slate-800 text-white shadow-[0_6px_0_#0f172a] hover:bg-slate-900 !py-2 !px-3 text-xs"
              onClick={() => dispatch(clearQueuedPowerUp())}
            >
              Clear {POWER_UP_LABELS[queuedPowerUp]}
            </button>
          ) : (
            <span className="arcade-pill bg-white text-slate-800 !min-h-8 text-xs font-bold px-3">
              No Active Modifier
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {tutorialQueue.length > 0 ? (
            <span className="arcade-pill bg-emerald-300 text-emerald-950 !min-h-7 !py-1">
              Opener Active
            </span>
          ) : null}
          <span className="arcade-pill bg-amber-300 text-amber-950 !min-h-7 !py-1">
            Slots {inventory.length}/3
          </span>
        </div>
      </section>

      {/* 2. Power Shop (Spend Ink) - Flat Visual Card */}
      <section className="arcade-panel px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cyan-700">
          Spend Ink
        </p>
        <h3 className="text-xl font-black text-slate-950 mt-1 mb-3">Power Store</h3>

        <div className="grid gap-3">
          {powerUps.map((powerUp) => {
            const canAfford = ink >= POWER_UP_COSTS[powerUp]
            const inventoryFull = inventory.length >= 3

            return (
              <button
                key={powerUp}
                type="button"
                className={[
                  'rounded-[20px] border-4 px-4 py-3 text-left transition-all duration-150',
                  canAfford && !inventoryFull
                    ? 'border-white bg-white/75 text-slate-950 hover:bg-white hover:-translate-y-0.5 shadow-sm'
                    : 'border-white/40 bg-white/35 text-slate-500 cursor-not-allowed',
                ].join(' ')}
                onClick={() => dispatch(buyPowerUp(powerUp))}
                disabled={!canAfford || inventoryFull}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-fuchsia-700">
                      {POWER_UP_LABELS[powerUp]}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-700 leading-relaxed">
                      {powerUp === 'steel'
                        ? 'Fortifies cleared row & slashes pressure.'
                        : powerUp === 'wrecking-ball'
                          ? 'Blasts a full column down.'
                          : 'Drops a Wildcard (?) tile.'}
                    </p>
                  </div>
                  <span className="arcade-pill bg-emerald-300 text-emerald-950 !min-h-7 !py-0.5 text-xs shrink-0 px-2 font-black">
                    {POWER_UP_COSTS[powerUp]} Ink
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 3. Three Hot Slots (Inventory) - Flat Horizontal Cards */}
      <section className="arcade-panel px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-amber-700">
          Active Inventory
        </p>
        <h3 className="text-xl font-black text-slate-950 mt-1 mb-3">Hot Slots (Keys 1-3)</h3>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, index) => inventory[index] ?? null).map(
            (powerUp, index) => (
              <button
                key={`inventory-${index}`}
                type="button"
                className={[
                  'flex flex-col items-center justify-between rounded-[20px] border-4 px-2 py-3 text-center transition-all duration-150 aspect-[5/6]',
                  powerUp
                    ? 'border-white bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(255,255,255,0.8))] hover:bg-white hover:-translate-y-0.5 cursor-pointer shadow-sm'
                    : 'border-dashed border-white/45 bg-white/20 text-slate-500 cursor-default',
                ].join(' ')}
                disabled={!powerUp}
                onClick={() => dispatch(activateInventorySlot(index))}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">
                    Slot {index + 1}
                  </p>
                  <p className="mt-1.5 text-xs font-black text-slate-950 leading-tight truncate max-w-full">
                    {powerUp ? POWER_UP_LABELS[powerUp].split(' ')[0] : 'Empty'}
                  </p>
                </div>
                <span className={[
                  'rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider mt-2 block',
                  powerUp ? 'bg-fuchsia-400 text-white' : 'bg-slate-300 text-slate-500'
                ].join(' ')}>
                  {powerUp ? 'USE' : 'WAIT'}
                </span>
              </button>
            ),
          )}
        </div>
      </section>
    </aside>
  )
}
