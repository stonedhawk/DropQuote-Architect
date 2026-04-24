import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { GameBoard } from './components/GameBoard'
import { LeftPanel } from './components/LeftPanel'
import { RightPanel } from './components/RightPanel'
import { restartGame } from './features/game/thunks'
import {
  selectActiveTile,
  selectCelebration,
  selectBoardFillPercent,
  selectDifficultyStage,
  selectGameOverSummary,
  selectTickInterval,
  selectTutorialCoach,
} from './features/game/selectors'
import { useGameAudio } from './hooks/useGameAudio'
import { useGameInput } from './hooks/useGameInput'
import { useGameTick } from './hooks/useGameTick'

function App() {
  const dispatch = useAppDispatch()
  const activeTile = useAppSelector(selectActiveTile)
  const tickInterval = useAppSelector(selectTickInterval)
  const phase = useAppSelector((state) => state.session.phase)
  const statusMessage = useAppSelector((state) => state.session.statusMessage)
  const boardFill = useAppSelector(selectBoardFillPercent)
  const tutorialCoach = useAppSelector(selectTutorialCoach)
  const difficultyStage = useAppSelector(selectDifficultyStage)
  const celebration = useAppSelector(selectCelebration)
  const gameOverSummary = useAppSelector(selectGameOverSummary)
  const score = useAppSelector((state) => state.session.score)

  useEffect(() => {
    dispatch(restartGame())
  }, [dispatch])

  useGameTick(tickInterval)
  useGameInput()
  useGameAudio()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_40%),linear-gradient(180deg,_#5dc4ff_0%,_#4a8fff_35%,_#8c5bff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-3 sm:px-6 lg:px-8">
        <header className="arcade-panel mb-3 flex flex-wrap items-center justify-between gap-3 overflow-hidden px-5 py-3">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-fuchsia-700">
              DropQuote Architect
            </p>
            <h1 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              Stack words, calm the pressure, survive the tower.
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="arcade-pill bg-cyan-300 text-cyan-950">
              {difficultyStage.label}
            </span>
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

        <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold sm:text-sm">
          <span className="arcade-pill bg-white text-slate-900">{statusMessage}</span>
          {tutorialCoach.active ? (
            <span className="arcade-pill bg-emerald-300 text-emerald-950">
              {tutorialCoach.message}
            </span>
          ) : null}
          <span className="arcade-pill bg-cyan-300 text-cyan-950">
            {difficultyStage.helper}
          </span>
        </div>

        {celebration ? (
          <div
            className={[
              'mb-3 arcade-panel celebration-pop px-4 py-3',
              celebration.tone === 'warning'
                ? 'border-rose-200/90 bg-[linear-gradient(180deg,_rgba(255,241,242,0.98),_rgba(254,205,211,0.92))]'
                : celebration.tone === 'objective'
                  ? 'border-cyan-200/90 bg-[linear-gradient(180deg,_rgba(236,254,255,0.98),_rgba(165,243,252,0.92))]'
                  : 'border-amber-200/90 bg-[linear-gradient(180deg,_rgba(255,251,235,0.98),_rgba(253,230,138,0.92))]',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-black uppercase tracking-[0.34em]',
                celebration.tone === 'warning'
                  ? 'text-rose-700'
                  : celebration.tone === 'objective'
                    ? 'text-cyan-700'
                    : 'text-orange-700',
              ].join(' ')}
            >
              {celebration.tone === 'warning'
                ? 'Danger'
                : celebration.tone === 'objective'
                  ? 'Objective Pulse'
                  : 'Clear Celebration'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-xl font-black text-slate-950 sm:text-2xl">{celebration.title}</p>
              <span className="arcade-pill bg-rose-400 text-white">Score {score}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {celebration.body}
            </p>
          </div>
        ) : null}

        <section className="grid flex-1 items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <div className="order-2 xl:order-1">
            <LeftPanel />
          </div>
          <div className="order-1 xl:order-2">
            <GameBoard />
          </div>
          <div className="order-3">
            <RightPanel />
          </div>
        </section>
      </div>

      {phase === 'game-over' && gameOverSummary ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
          <div className="arcade-panel game-over-pop relative w-full max-w-2xl overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_72%)]" />
            <div className="relative">
              <p className="text-sm font-black uppercase tracking-[0.34em] text-rose-700">
                Tower Collapse
              </p>
              <h2 className="mt-2 text-4xl font-black text-slate-950 sm:text-5xl">
                {gameOverSummary.reason}
              </h2>
              <p className="mt-3 max-w-xl text-sm font-semibold text-slate-800 sm:text-base">
                {statusMessage} Restart to run the guided opener again or push for a bigger combo on the next attempt.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[22px] border-4 border-white bg-white/85 px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-700">
                    Final Score
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {gameOverSummary.finalScore}
                  </p>
                </div>
                <div className="rounded-[22px] border-4 border-white bg-white/85 px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">
                    Best Word
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {gameOverSummary.bestWord ?? '—'}
                  </p>
                </div>
                <div className="rounded-[22px] border-4 border-white bg-white/85 px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-700">
                    Top Combo
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    x{gameOverSummary.topCombo}
                  </p>
                </div>
                <div className="rounded-[22px] border-4 border-white bg-white/85 px-4 py-4">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
                    Peak Pressure
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {gameOverSummary.peakPressure}%
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Latest clear: {gameOverSummary.latestWord ?? 'None yet'}
                </p>
                <button
                  type="button"
                  className="arcade-button bg-rose-500 text-white shadow-[0_10px_0_#9f1239]"
                  onClick={() => dispatch(restartGame())}
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default App
