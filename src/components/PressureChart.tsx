import type { PressurePoint } from '../game/types'

interface PressureChartProps {
  currentPressure: number
  maxPressure: number
  points: PressurePoint[]
}

const GraphifySequenceAdapter = ({
  sequence,
  maxPressure,
}: {
  sequence: number[]
  maxPressure: number
}) => {
  const width = 320
  const height = 180
  const horizontalStep = sequence.length > 1 ? width / (sequence.length - 1) : width

  const polylinePoints = sequence
    .map((value, index) => {
      const x = index * horizontalStep
      const y = height - (value / maxPressure) * height
      return `${x},${y}`
    })
    .join(' ')

  const areaPoints = `0,${height} ${polylinePoints} ${width},${height}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full overflow-visible"
      role="img"
      aria-label="Pressure history chart"
    >
      <defs>
        <linearGradient id="pressure-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((fraction) => (
        <line
          key={fraction}
          x1="0"
          x2={width}
          y1={height - height * fraction}
          y2={height - height * fraction}
          stroke="rgba(255,255,255,0.35)"
          strokeDasharray="6 10"
        />
      ))}

      <polygon points={areaPoints} fill="url(#pressure-fill)" />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#f97316"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {sequence.map((value, index) => {
        const x = index * horizontalStep
        const y = height - (value / maxPressure) * height
        return (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="5"
            fill="#fff7ed"
            stroke="#ea580c"
            strokeWidth="3"
          />
        )
      })}
    </svg>
  )
}

export const PressureChart = ({
  currentPressure,
  maxPressure,
  points,
}: PressureChartProps) => {
  const sequence = points.map((point) => point.pressure)

  return (
    <div className="rounded-[26px] border-4 border-white/80 bg-slate-950/80 p-4 text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-orange-300">
            Pressure Pulse
          </p>
          <h3 className="text-2xl font-black text-white">
            {currentPressure}% / {maxPressure}%
          </h3>
        </div>

        <span
          className={[
            'arcade-pill',
            currentPressure >= 80
              ? 'bg-rose-400 text-white'
              : currentPressure >= 50
                ? 'bg-amber-300 text-amber-950'
                : 'bg-emerald-300 text-emerald-950',
          ].join(' ')}
        >
          {currentPressure >= 80
            ? 'Danger'
            : currentPressure >= 50
              ? 'Heating Up'
              : 'Stable'}
        </span>
      </div>

      <div className="h-[200px]">
        <GraphifySequenceAdapter sequence={sequence} maxPressure={maxPressure} />
      </div>
    </div>
  )
}
