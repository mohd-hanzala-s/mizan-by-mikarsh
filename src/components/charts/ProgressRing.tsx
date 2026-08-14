import { cn } from '@/utils/cn'

interface ProgressRingProps {
  /** 0–100. */
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  /** Track circle color (defaults to var(--border)). */
  trackColor?: string
  /** Optional center text — top line. */
  label?: string
  /** Optional center text — bottom line. */
  sublabel?: string
  className?: string
}

/** SVG circular progress ring (spec §3 Visualization `ProgressRing`).
 * Value drives the arc via stroke-dashoffset; the track uses a semantic
 * border class and the center is HTML text so it uses the design system's
 * type scale. */
export function ProgressRing({
  value,
  size = 160,
  strokeWidth = 14,
  color,
  trackColor,
  label,
  sublabel,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div
      role="img"
      aria-label={`${label ?? 'Progress'}: ${clamped} percent`}
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className={!trackColor ? 'stroke-border' : undefined}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {(label || sublabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
          {label && <span className="text-h3 text-text-primary">{label}</span>}
          {sublabel && <span className="text-caption text-text-tertiary">{sublabel}</span>}
        </div>
      )}
    </div>
  )
}
