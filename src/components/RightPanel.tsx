import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  selectAudioState,
  selectCurrentObjective,
  selectDifficultyStage,
} from '../features/game/selectors'
import { setAudioMuted } from '../features/game/thunks'
import { PressureChart } from './PressureChart'

export const RightPanel = () => {
  const dispatch = useAppDispatch()
  const pressure = useAppSelector((state) => state.pressure.current)
  const maxPressure = useAppSelector((state) => state.pressure.max)
  const history = useAppSelector((state) => state.pressure.history)
  const recentMatches = useAppSelector((state) => state.session.recentMatches)
  const fortifiedRows = useAppSelector((state) => state.pressure.fortifiedRows)
  const tick = useAppSelector((state) => state.session.tick)
  const objective = useAppSelector(selectCurrentObjective)
  const difficultyStage = useAppSelector(selectDifficultyStage)
  const audioState = useAppSelector(selectAudioState)
  const objectiveProgressPercent = objective
    ? Math.round((objective.progress / objective.target) * 100)
    : 0

  return (
    <aside className="flex flex-col gap-4">
      {/* 1. Heat Readout & Pressure Chart */}
      <section className="arcade-panel px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-amber-700">
              Heat Readout
            </p>
            <h3 className="text-xl font-black text-slate-950 mt-1">{difficultyStage.label}</h3>
          </div>
          {difficultyStage.nextMilestone ? (
            <span className="arcade-pill bg-cyan-300 text-cyan-950 !min-h-7 !py-0.5 text-xs">
              Ramp: {difficultyStage.nextMilestone}
            </span>
          ) : (
            <span className="arcade-pill bg-rose-300 text-rose-950 !min-h-7 !py-0.5 text-xs">
              Peak
            </span>
          )}
        </div>
        
        <PressureChart
          currentPressure={pressure}
          maxPressure={maxPressure}
          points={history}
          celebrating={recentMatches.length > 0}
        />

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-[18px] border-4 border-white bg-white/80 px-3 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">
              Tick Clock
            </p>
            <p className="mt-0.5 text-lg font-black text-slate-950">{tick}</p>
          </div>
          <div className="rounded-[18px] border-4 border-white bg-white/80 px-3 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-700">
              Fortified Rows
            </p>
            <p className="mt-0.5 text-lg font-black text-slate-950">
              {fortifiedRows.length}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Live Objective Banner */}
      <section className="arcade-panel px-5 py-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-cyan-700">
              Live Goal
            </p>
            <h3 className="text-lg font-black text-slate-950 mt-0.5">
              {objective?.title ?? 'Goal Locked'}
            </h3>
          </div>
          <button
            type="button"
            className={[
              'arcade-button !py-1.5 !px-3 text-[11px] text-white',
              audioState.muted
                ? 'bg-slate-700 shadow-[0_4px_0_#334155]'
                : 'bg-cyan-500 shadow-[0_4px_0_#0f766e]',
            ].join(' ')}
            onClick={() => dispatch(setAudioMuted(!audioState.muted))}
          >
            {audioState.muted ? 'Muted' : 'Sound On'}
          </button>
        </div>

        {objective ? (
          <div className="space-y-3">
            <div className="rounded-[20px] border-4 border-white bg-white/85 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold text-slate-700 leading-normal">
                {objective.description}
              </p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,_#22d3ee,_#3b82f6,_#8b5cf6)] transition-[width] duration-300"
                  style={{ width: `${objectiveProgressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs font-black text-slate-900">
                <span>
                  {objective.progress} / {objective.target}
                </span>
                <span>
                  +{objective.reward.ink} Ink
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] border-4 border-dashed border-white/70 bg-white/60 px-4 py-3 text-xs font-semibold text-slate-600 leading-normal text-center">
            Clear 5 words to begin rotating objectives.
          </div>
        )}
      </section>

      {/* 3. Recent Clears List - Flat visual feedback */}
      <section className="arcade-panel px-5 py-4">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-700">
          Recent Clears
        </p>
        <h3 className="text-xl font-black text-slate-950 mt-1 mb-3">Run History</h3>

        <div className="space-y-2">
          {recentMatches.length > 0 ? (
            recentMatches.slice(0, 2).map((match) => (
              <div
                key={match.id}
                className="rounded-[18px] border-4 border-white bg-white/85 px-3 py-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-fuchsia-700">
                    {match.axis} clear
                  </p>
                  <span className="text-[10px] font-bold text-slate-500">
                    {match.tileIds.length} tiles
                  </span>
                </div>
                <p className="text-xl font-black text-slate-950 mt-0.5">
                  {match.resolvedText}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-[20px] border-4 border-dashed border-white/70 bg-white/45 px-4 py-4 text-xs font-semibold text-slate-600 text-center leading-normal">
              Your cleared words will appear here in real-time.
            </div>
          )}
        </div>
      </section>
    </aside>
  )
}
