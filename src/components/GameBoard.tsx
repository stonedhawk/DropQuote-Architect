import { BOARD_HEIGHT, BOARD_WIDTH } from '../game/constants'
import { positionKey } from '../game/utils/board'
import { useAppSelector } from '../app/hooks'
import {
  selectGhostTilePosition,
  selectProjectedMatches,
  selectTileGrid,
  selectTutorialCoach,
} from '../features/game/selectors'

const boardCells = Array.from({ length: BOARD_WIDTH * BOARD_HEIGHT }, (_, index) => ({
  x: index % BOARD_WIDTH,
  y: Math.floor(index / BOARD_WIDTH),
}))

export const GameBoard = () => {
  const tileGrid = useAppSelector(selectTileGrid)
  const ghostTile = useAppSelector(selectGhostTilePosition)
  const score = useAppSelector((state) => state.session.score)
  const combo = useAppSelector((state) => state.session.combo)
  const tutorialQueue = useAppSelector((state) => state.session.tutorialQueue)
  const tutorialCoach = useAppSelector(selectTutorialCoach)
  const projectedMatches = useAppSelector(selectProjectedMatches)
  const projectedTileIds = new Set(projectedMatches.flatMap((match) => match.tileIds))

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

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-bold">
        <span className="arcade-pill bg-white text-slate-900">
          Landing shadow shows where the tile will lock
        </span>
        {tutorialQueue.length > 0 ? (
          <span className="arcade-pill bg-emerald-300 text-emerald-950">
            Tutorial queue: {tutorialQueue.slice(0, 3).join(' → ')}
          </span>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-[30px] border-[6px] border-white/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.7),_rgba(255,255,255,0.12)),linear-gradient(180deg,_#64d2ff_0%,_#2563eb_35%,_#7c3aed_100%)] p-4 shadow-[inset_0_0_0_4px_rgba(255,255,255,0.25),0_25px_60px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_70%)]" />

        <div className="relative grid aspect-[10/20] w-full grid-cols-10 gap-1 rounded-[22px] bg-slate-900/25 p-1.5">
          {boardCells.map((cell) => {
            const tile = tileGrid.get(positionKey(cell.x, cell.y))
            const tileLabel = tile?.isWildcard ? '*' : tile?.letter
            const showGhost =
              ghostTile &&
              ghostTile.x === cell.x &&
              ghostTile.y === cell.y &&
              !tile
            const tutorialPad = tutorialCoach.targetCells.find(
              (targetCell) => targetCell.x === cell.x && targetCell.y === cell.y,
            )
            const isCurrentPad =
              tutorialCoach.currentTarget?.x === cell.x &&
              tutorialCoach.currentTarget?.y === cell.y
            const isProjectedClear =
              tile ? projectedTileIds.has(tile.id) : ghostTile?.x === cell.x && ghostTile?.y === cell.y && projectedMatches.length > 0

            return (
              <div
                key={`${cell.x}-${cell.y}`}
                className={[
                  'relative aspect-square overflow-hidden rounded-[16px] border-2 bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]',
                  tutorialPad
                    ? isCurrentPad
                      ? 'border-emerald-200 bg-emerald-200/18 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25),0_0_0_2px_rgba(16,185,129,0.4)]'
                      : 'border-emerald-100/70 bg-emerald-100/12'
                    : 'border-white/20',
                ].join(' ')}
              >
                <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.12),_transparent_55%)]" />

                {tutorialPad ? (
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-1">
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em]',
                        isCurrentPad
                          ? 'bg-emerald-300 text-emerald-950'
                          : 'bg-white/80 text-emerald-900',
                      ].join(' ')}
                    >
                      {tutorialPad.letter}
                    </span>
                  </div>
                ) : null}

                {showGhost ? (
                  <div
                    className={[
                      'absolute inset-[6px] rounded-[10px] border-2 border-dashed shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]',
                      projectedMatches.length > 0
                        ? 'projected-clear-glow border-emerald-100 bg-emerald-200/18'
                        : 'border-white/80 bg-white/12',
                    ].join(' ')}
                  />
                ) : null}

                {tile ? (
                  <div
                    className={[
                      'tile-pop absolute inset-[3px] flex items-center justify-center rounded-[12px] border-2 text-xl font-black shadow-[0_10px_22px_rgba(15,23,42,0.25)] sm:text-2xl',
                      isProjectedClear ? 'projected-clear-glow ring-4 ring-emerald-200/80' : '',
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
