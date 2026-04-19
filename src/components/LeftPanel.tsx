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
  const nextTile = useAppSelector((state) => state.session.nextTile)
  const ink = useAppSelector((state) => state.economy.ink)
  const inventory = useAppSelector((state) => state.economy.inventory)
  const queuedPowerUp = useAppSelector((state) => state.economy.queuedPowerUp)
  const tutorialQueue = useAppSelector((state) => state.session.tutorialQueue)

  return (
    <aside className="flex flex-col gap-4">
      <section className="arcade-panel px-5 py-5">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-700">
          Next Tile
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-[24px] border-4 border-white bg-[linear-gradient(180deg,_#f9a8d4,_#ec4899)] text-5xl font-black text-white shadow-[0_18px_30px_rgba(236,72,153,0.35)]">
            {nextTile?.letter ?? '?'}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-800">
              Queue a power-up to transform the next drop.
            </p>
            {nextTile?.hint ? (
              <p className="text-sm font-semibold text-slate-700">
                {nextTile.hint}
              </p>
            ) : null}
            {tutorialQueue.length > 0 ? (
              <div className="rounded-[18px] border-4 border-white bg-emerald-100 px-3 py-3 text-sm font-bold text-emerald-950">
                Starter assist active. The opening letters are seeded to help you
                discover easy words first.
              </div>
            ) : null}
            {queuedPowerUp ? (
              <div className="space-y-2">
                <span className="arcade-pill bg-cyan-300 text-cyan-950">
                  Queued: {POWER_UP_LABELS[queuedPowerUp]}
                </span>
                <button
                  type="button"
                  className="arcade-button bg-slate-800 text-white shadow-[0_10px_0_#0f172a]"
                  onClick={() => dispatch(clearQueuedPowerUp())}
                >
                  Clear Queue
                </button>
              </div>
            ) : (
              <span className="arcade-pill bg-white text-slate-800">No modifier queued</span>
            )}
          </div>
        </div>
      </section>

      <section className="arcade-panel px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">
              Ink Balance
            </p>
            <h3 className="text-3xl font-black text-slate-950">{ink}</h3>
          </div>
          <span className="arcade-pill bg-amber-300 text-amber-950">Soft Currency</span>
        </div>

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
      </section>

      <section className="arcade-panel px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-700">
              Inventory
            </p>
            <h3 className="text-2xl font-black text-slate-950">Three Hot Slots</h3>
          </div>
          <span className="arcade-pill bg-fuchsia-300 text-fuchsia-950">
            Keys 1-3
          </span>
        </div>

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
      </section>
    </aside>
  )
}
