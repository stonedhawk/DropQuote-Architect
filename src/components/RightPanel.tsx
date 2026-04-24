import { useAppDispatch, useAppSelector } from '../app/hooks'
import { POWER_UP_LABELS } from '../game/constants'
import { acceptedExampleWords } from '../game/utils/dictionaryService'
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
      <section className="arcade-panel px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-700">
              Heat Readout
            </p>
            <h3 className="text-2xl font-black text-slate-950">{difficultyStage.label}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {difficultyStage.helper}
            </p>
          </div>
          {difficultyStage.nextMilestone ? (
            <span className="arcade-pill bg-cyan-300 text-cyan-950">
              Next ramp {difficultyStage.nextMilestone}
            </span>
          ) : (
            <span className="arcade-pill bg-rose-300 text-rose-950">Final ramp</span>
          )}
        </div>
        <PressureChart
          currentPressure={pressure}
          maxPressure={maxPressure}
          points={history}
          celebrating={recentMatches.length > 0}
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">
              Live Objective
            </p>
            <h3 className="text-2xl font-black text-slate-950">
              {objective?.title ?? 'Unlock after 5 clears'}
            </h3>
          </div>
          <button
            type="button"
            className={[
              'arcade-button min-h-11 px-4 py-3 text-white',
              audioState.muted
                ? 'bg-slate-700 shadow-[0_8px_0_#334155]'
                : 'bg-cyan-500 shadow-[0_8px_0_#0f766e]',
            ].join(' ')}
            onClick={() => dispatch(setAudioMuted(!audioState.muted))}
          >
            {audioState.muted ? 'Sound Off' : 'Sound On'}
          </button>
        </div>

        {objective ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-[20px] border-4 border-white bg-white/85 px-4 py-4">
              <p className="text-sm font-semibold text-slate-800">
                {objective.description}
              </p>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,_#22d3ee,_#3b82f6,_#8b5cf6)] transition-[width] duration-300"
                  style={{ width: `${objectiveProgressPercent}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm font-black text-slate-900">
                <span>
                  {objective.progress} / {objective.target}
                </span>
                <span>
                  Reward: +{objective.reward.ink} Ink
                  {objective.reward.bonusPowerUp
                    ? ` • ${POWER_UP_LABELS[objective.reward.bonusPowerUp]}`
                    : ''}
                </span>
              </div>
            </div>
            <div className="rounded-[20px] border-4 border-dashed border-white/70 bg-white/60 px-4 py-4 text-sm font-semibold text-slate-700">
              Audio unlocks on your first tap or keypress. Use the toggle anytime if you want a quieter run.
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[20px] border-4 border-dashed border-white/70 bg-white/60 px-4 py-4 text-sm font-semibold text-slate-700">
            Clear 5 total words to start the rotating objective loop.
          </div>
        )}
      </section>

      <details className="arcade-panel group overflow-hidden px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-700">
              How To Play
            </p>
            <h3 className="text-2xl font-black text-slate-950">Quick Guide</h3>
          </div>
          <span className="arcade-pill bg-white text-slate-800">Open tips</span>
        </summary>

        <div className="mt-4 space-y-3 text-sm font-semibold text-slate-800">
          <div className="rounded-[20px] border-4 border-white bg-white/85 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-700">
              1. Drop and align
            </p>
            <p className="mt-2">
              Every falling tile locks when it lands. A word only clears after that
              lock happens.
            </p>
          </div>
          <div className="rounded-[20px] border-4 border-white bg-white/85 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">
              2. Make straight words
            </p>
            <p className="mt-2">
              Valid clears are 3+ connected letters in one horizontal row or one
              vertical column. Both reading directions count. Diagonals do not count.
            </p>
          </div>
          <div className="rounded-[20px] border-4 border-dashed border-white/80 bg-white/70 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-600">
              Good starter words
            </p>
            <p className="mt-2 text-base font-black text-slate-950">
              {acceptedExampleWords.join(' • ')}
            </p>
          </div>
        </div>
      </details>

      <details className="arcade-panel group overflow-hidden px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">
              Recent Clears
            </p>
            <h3 className="text-2xl font-black text-slate-950">Run History</h3>
          </div>
          <span className="arcade-pill bg-white text-slate-800">Open list</span>
        </summary>

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
      </details>

      <details className="arcade-panel group overflow-hidden px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-fuchsia-700">
              Controls
            </p>
            <h3 className="text-2xl font-black text-slate-950">Input Guide</h3>
          </div>
          <span className="arcade-pill bg-white text-slate-800">Open keys</span>
        </summary>

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
      </details>
    </aside>
  )
}
