import { useMemo } from 'react'
import type { DayTotal } from '@/services/DashboardService'
import { cn } from '@/utils/cn'

interface SpendingTimelineProps {
  days: DayTotal[]
}

export function SpendingTimeline({ days }: SpendingTimelineProps) {
  const max = useMemo(() => Math.max(...days.map((d) => d.total), 1), [days])
  const today = new Date().toDateString()
  const topDay = useMemo(() => days.reduce((a, b) => (b.total > a.total ? b : a), days[0]), [days])

  return (
    <div
      className="flex items-end justify-between gap-6"
      role="img"
      aria-label="Spending over the last 7 days"
    >
      {days.map((d, idx) => {
        const heightPct = Math.max((d.total / max) * 100, d.total > 0 ? 8 : 3)
        const isToday = d.date.toDateString() === today
        const isTop = d === topDay && d.total > 0
        const barId = `timeline-bar-${idx}`

        return (
          <div key={d.date.toISOString()} className="flex flex-1 flex-col items-center gap-6">
            {/* Amount label above tallest bar */}
            <span
              className={cn(
                'text-[9px] font-semibold tabular-nums transition-opacity duration-fast',
                isTop ? 'text-text-secondary opacity-100' : 'opacity-0'
              )}
              aria-hidden="true"
            >
              {isTop ? `₹${Math.round(d.total / 1000)}k` : ''}
            </span>

            {/* Bar container */}
            <div className="relative flex h-64 w-full items-end overflow-hidden rounded-t-md">
              {/* SVG gradient bar */}
              <svg
                id={barId}
                width="100%"
                height="100%"
                viewBox="0 0 24 64"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="w-full"
              >
                <defs>
                  <linearGradient id={`grad-${barId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isToday ? 'var(--color-income)' : '#62C3A7'}
                      stopOpacity={isToday ? 0.9 : 0.45}
                    />
                    <stop
                      offset="100%"
                      stopColor={isToday ? 'var(--color-income)' : '#62C3A7'}
                      stopOpacity={isToday ? 0.5 : 0.15}
                    />
                  </linearGradient>
                </defs>
                <rect
                  x="2"
                  y={64 - (heightPct / 100) * 64}
                  width="20"
                  height={(heightPct / 100) * 64}
                  rx="3"
                  fill={`url(#grad-${barId})`}
                  style={{
                    transformOrigin: 'bottom',
                    animation: `mzn-bar-grow 0.6s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.06}s both`,
                  }}
                />
                {/* Top glow dot for today */}
                {isToday && d.total > 0 && (
                  <circle
                    cx="12"
                    cy={64 - (heightPct / 100) * 64}
                    r="3"
                    fill="var(--color-income)"
                    style={{ animation: 'mzn-pulse-soft 1.5s ease-in-out infinite' }}
                  />
                )}
              </svg>
            </div>

            {/* Day label */}
            <span
              className={cn(
                'text-caption font-medium transition-colors duration-fast',
                isToday ? 'font-bold text-income' : 'text-text-tertiary'
              )}
            >
              {d.date.toLocaleDateString('en-IN', { weekday: 'narrow' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
