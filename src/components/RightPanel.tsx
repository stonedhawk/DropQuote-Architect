import { useAppSelector } from '../app/hooks'
import { PressureChart } from './PressureChart'

export const RightPanel = () => {
  const pressure = useAppSelector((state) => state.pressure.current)
  const maxPressure = useAppSelector((state) => state.pressure.max)
  const history = useAppSelector((state) => state.pressure.history)
  const recentMatches = useAppSelector((state) => state.session.recentMatches)
  const fortifiedRows = useAppSelector((state) => state.pressure.fortifiedRows)
  const tick = useAppSelector((state) => state.session.tick)

  return (
    <aside className="flex flex-col gap-4">
      <section className="arcade-panel px-5 py-5">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-700">
          Heat Readout
        </p>
        <PressureChart
          currentPressure={pressure}
          maxPressure={maxPressure}
          points={history}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border-4 border-white bg-white/85 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">
              Tick
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">{tick}</p>
          </div>
          <div className="rounded-[20px] border-4 border-white bg-white/85 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-700">
              Fortified Rows
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {fortifiedRows.length}
            </p>
          </div>
        </div>
      </section>

      <section className="arcade-panel px-5 py-5">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">
          Recent Clears
        </p>
        <div className="mt-4 space-y-3">
          {recentMatches.length > 0 ? (
            recentMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-[20px] border-4 border-white bg-white/85 px-4 py-3"
              >
                <p className="text-xs font-black uppercase tracking-[0.25em] text-fuchsia-700">
                  {match.axis} clear
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {match.resolvedText}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {match.tileIds.length} tiles {match.usedWildcard ? 'with wildcard support' : 'clean clear'}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[20px] border-4 border-dashed border-white/70 bg-white/45 px-4 py-5 text-sm font-semibold text-slate-700">
              Your next valid horizontal or vertical word will show up here.
            </div>
          )}
        </div>
      </section>

      <section className="arcade-panel px-5 py-5">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-700">
          Controls
        </p>
        <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-800">
          <div className="flex items-center justify-between rounded-[18px] bg-white/80 px-4 py-3">
            <span>Move left / right</span>
            <span className="arcade-pill bg-cyan-300 text-cyan-950">Arrows</span>
          </div>
          <div className="flex items-center justify-between rounded-[18px] bg-white/80 px-4 py-3">
            <span>Soft drop</span>
            <span className="arcade-pill bg-emerald-300 text-emerald-950">Down</span>
          </div>
          <div className="flex items-center justify-between rounded-[18px] bg-white/80 px-4 py-3">
            <span>Hard drop</span>
            <span className="arcade-pill bg-amber-300 text-amber-950">Space</span>
          </div>
          <div className="flex items-center justify-between rounded-[18px] bg-white/80 px-4 py-3">
            <span>Use power slot</span>
            <span className="arcade-pill bg-fuchsia-300 text-fuchsia-950">1-3</span>
          </div>
          <div className="flex items-center justify-between rounded-[18px] bg-white/80 px-4 py-3">
            <span>Clear queued modifier</span>
            <span className="arcade-pill bg-slate-800 text-white">C</span>
          </div>
        </div>
      </section>
    </aside>
  )
}
