import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { GameBoard } from './components/GameBoard'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'
import { restartGame } from './features/game/thunks'
import {
  selectActiveTile,
  selectBoardFillPercent,
  selectProjectedMatches,
  selectTickInterval,
  selectTutorialCoach,
} from './features/game/selectors'
import { useGameInput } from './hooks/useGameInput'
import { useGameTick } from './hooks/useGameTick'

function App() {
  const dispatch = useAppDispatch()
  const activeTile = useAppSelector(selectActiveTile)
  const tickInterval = useAppSelector(selectTickInterval)
  const phase = useAppSelector((state) => state.session.phase)
  const statusMessage = useAppSelector((state) => state.session.statusMessage)
  const boardFill = useAppSelector(selectBoardFillPercent)
  const projectedMatches = useAppSelector(selectProjectedMatches)
  const tutorialCoach = useAppSelector(selectTutorialCoach)

  useEffect(() => {
    dispatch(restartGame())
  }, [dispatch])

  useGameTick(tickInterval)
  useGameInput()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_40%),linear-gradient(180deg,_#5dc4ff_0%,_#4a8fff_35%,_#8c5bff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="arcade-panel mb-4 flex flex-col gap-4 overflow-hidden px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-fuchsia-700">
              DropQuote Architect
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Stack bright words, beat the pressure, keep the tower bouncing.
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-slate-800 sm:text-base">
              Move with the arrow keys, tap down to soften the drop, smash space
              to slam pieces home, and spend Ink on wild arcade powers.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex gap-3 text-sm font-bold text-slate-900">
              <span className="arcade-pill bg-amber-300">
                {phase === 'game-over' ? 'Game Over' : activeTile ? 'Live Drop' : 'Respawning'}
              </span>
              <span className="arcade-pill bg-emerald-300">{boardFill}% filled</span>
            </div>

            <button
              type="button"
              className="arcade-button bg-rose-500 text-white shadow-[0_10px_0_#9f1239]"
              onClick={() => dispatch(restartGame())}
            >
              Restart Run
            </button>
          </div>
        </header>

        <div className="mb-4 rounded-[28px] border-4 border-white/80 bg-white/20 px-5 py-4 text-sm font-bold text-white shadow-[0_18px_50px_rgba(17,24,39,0.28)] backdrop-blur-md">
          {statusMessage}
        </div>

        {tutorialCoach.active ? (
          <div className="mb-4 arcade-panel border-emerald-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(209,250,229,0.92))] px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-emerald-700">
              Guided Opening
            </p>
            <p className="mt-2 text-xl font-black text-slate-950">
              {tutorialCoach.message}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {tutorialCoach.helper}
            </p>
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-3 text-sm font-bold">
          <span className="arcade-pill bg-white text-slate-900">
            Words clear after the tile locks
          </span>
          <span className="arcade-pill bg-cyan-300 text-cyan-950">
            Horizontal or vertical only
          </span>
          <span className="arcade-pill bg-amber-300 text-amber-950">
            Need 3+ letters to score
          </span>
          {projectedMatches.length > 0 ? (
            <span className="arcade-pill bg-emerald-300 text-emerald-950">
              If you drop now: {projectedMatches.map((match) => match.resolvedText).join(', ')}
            </span>
          ) : null}
        </div>

        <section className="grid flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          <LeftPanel />
          <GameBoard />
          <RightPanel />
        </section>
      </div>
    </main>
  )
}

export default App
