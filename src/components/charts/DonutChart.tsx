import { cn } from '@/utils/cn'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  centerLabel?: string
  centerValue?: string
  ariaLabel?: string
  className?: string
}

const RADIUS = 42
const STROKE_WIDTH = 16
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** SVG donut ring. Values are rendered as proportional arcs (stroke-dasharray
 * on full circles, so a single segment draws a complete ring). Segment colors
 * are caller-supplied design accents or category data colors; the empty state
 * is a plain border-colored track. The center is HTML text so it uses the
 * design system's type scale. */
export function DonutChart({
  segments,
  size = 160,
  centerLabel,
  centerValue,
  ariaLabel,
  className,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0)

  let accumulated = 0

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `${segments.length} segments, total ${total}`}
      className={cn('relative select-none', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-border/60"
        />
        <g transform="rotate(-90 60 60)">
          {total > 0 &&
            segments.map((seg) => {
              if (seg.value <= 0) return null
              const dash = (Math.max(0, seg.value) / total) * CIRCUMFERENCE
              const offset = accumulated
              accumulated += dash
              return (
                <circle
                  key={seg.label}
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  strokeDashoffset={-offset}
                  className="transition-all duration-fast hover:opacity-90 hover:stroke-[18px] cursor-pointer"
                >
                  <title>{`${seg.label}: ₹${seg.value.toLocaleString('en-IN')}`}</title>
                </circle>
              )
            })}
        </g>
      </svg>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-8">
          {centerLabel && (
            <span className="text-overline font-bold tracking-widest text-text-tertiary uppercase">
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span className="font-heading text-h3 font-bold text-text-primary tracking-tight">
              {centerValue}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
