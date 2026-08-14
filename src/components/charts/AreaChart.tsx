export interface AreaPoint {
  label: string
  value: number
}

interface AreaChartProps {
  points: AreaPoint[]
  color: string
  height?: number
  ariaLabel?: string
}

const WIDTH = 320
const PAD_LEFT = 16
const PAD_RIGHT = 16
const PAD_TOP = 8
const PAD_BOTTOM = 20

/** Lightweight SVG area chart: one series, zero-baseline fill, dot markers,
 * and a grid baseline. Values are normalized to the viewBox, and text uses
 * semantic fill classes so it stays theme-aware. */
export function AreaChart({ points, color, height = 160, ariaLabel }: AreaChartProps) {
  const n = points.length
  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT
  const innerH = height - PAD_TOP - PAD_BOTTOM

  const values = points.map((p) => p.value)
  const min = Math.min(0, ...values)
  const max = Math.max(...values, 0)
  const range = max - min || 1

  const x = (i: number) => (n <= 1 ? PAD_LEFT + innerW / 2 : PAD_LEFT + (i / (n - 1)) * innerW)
  const y = (v: number) => PAD_TOP + (1 - (v - min) / range) * innerH
  const baselineY = y(0)

  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area =
    n > 0
      ? `M ${x(0).toFixed(1)},${baselineY.toFixed(1)} L ${line.replaceAll(' ', ' L ')} L ${x(n - 1).toFixed(1)},${baselineY.toFixed(1)} Z`
      : ''

  const gradientId = `area-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <svg
      role="img"
      aria-label={ariaLabel ?? `Area chart with ${n} points`}
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="w-full select-none"
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <line
        x1={PAD_LEFT}
        y1={baselineY}
        x2={WIDTH - PAD_RIGHT}
        y2={baselineY}
        strokeWidth={1}
        className="stroke-border/70"
      />
      {area && <path d={area} fill={`url(#${gradientId})`} />}
      {n > 0 && (
        <path
          d={`M ${line}`}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {points.map((p, i) => (
        <g key={p.label} className="group cursor-pointer">
          <circle cx={x(i)} cy={y(p.value)} r={5} fill={color} fillOpacity={0.2} />
          <circle
            cx={x(i)}
            cy={y(p.value)}
            r={3}
            fill={color}
            className="transition-transform group-hover:scale-125"
          />
        </g>
      ))}
      {points.map((p, i) => (
        <text
          key={`label-${p.label}`}
          x={x(i)}
          y={height - 4}
          textAnchor="middle"
          fontSize={9}
          fontWeight={500}
          className="fill-text-tertiary"
        >
          {p.label}
        </text>
      ))}
    </svg>
  )
}
