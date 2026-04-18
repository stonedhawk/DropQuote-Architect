import { BOARD_HEIGHT, BOARD_WIDTH } from '../game/constants'
import { positionKey } from '../game/utils/board'
import { useAppSelector } from '../app/hooks'
import { selectTileGrid } from '../features/game/selectors'

const boardCells = Array.from({ length: BOARD_WIDTH * BOARD_HEIGHT }, (_, index) => ({
  x: index % BOARD_WIDTH,
  y: Math.floor(index / BOARD_WIDTH),
}))

export const GameBoard = () => {
  const tileGrid = useAppSelector(selectTileGrid)
  const score = useAppSelector((state) => state.session.score)
  const combo = useAppSelector((state) => state.session.combo)

  return (
    <section className="arcade-panel flex min-h-[760px] flex-col px-5 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">
            Main Stage
          </p>
          <h2 className="text-3xl font-black text-slate-950">Word Tower</h2>
        </div>

        <div className="flex gap-2">
          <span className="arcade-pill bg-fuchsia-300 text-fuchsia-950">
            Score {score}
          </span>
          <span className="arcade-pill bg-amber-300 text-amber-950">
            Combo x{combo}
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[30px] border-[6px] border-white/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.7),_rgba(255,255,255,0.12)),linear-gradient(180deg,_#64d2ff_0%,_#2563eb_35%,_#7c3aed_100%)] p-4 shadow-[inset_0_0_0_4px_rgba(255,255,255,0.25),0_25px_60px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_70%)]" />

        <div className="relative grid aspect-[10/20] w-full grid-cols-10 gap-1 rounded-[22px] bg-slate-900/25 p-1.5">
          {boardCells.map((cell) => {
            const tile = tileGrid.get(positionKey(cell.x, cell.y))
            const tileLabel = tile?.isWildcard ? '*' : tile?.letter

            return (
              <div
                key={`${cell.x}-${cell.y}`}
                className="relative aspect-square overflow-hidden rounded-[16px] border-2 border-white/20 bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
              >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.12),_transparent_55%)]" />

                {tile ? (
                  <div
                    className={[
                      'tile-pop absolute inset-[3px] flex items-center justify-center rounded-[12px] border-2 text-xl font-black shadow-[0_10px_22px_rgba(15,23,42,0.25)] sm:text-2xl',
                      tile.isWildcard
                        ? 'border-amber-100 bg-[linear-gradient(180deg,_#ffe082,_#ffb703)] text-slate-950'
                        : tile.isSteel
                          ? 'border-slate-100 bg-[linear-gradient(180deg,_#dbeafe,_#60a5fa)] text-slate-950'
                          : tile.isMoving
                            ? 'border-fuchsia-100 bg-[linear-gradient(180deg,_#f9a8d4,_#ec4899)] text-white'
                            : 'border-emerald-100 bg-[linear-gradient(180deg,_#86efac,_#22c55e)] text-slate-950',
                    ].join(' ')}
                  >
                    <span className="drop-shadow-[0_2px_0_rgba(255,255,255,0.35)]">
                      {tileLabel}
                    </span>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
