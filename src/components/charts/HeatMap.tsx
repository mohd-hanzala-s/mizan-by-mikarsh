import { format } from 'date-fns'
import { cn } from '@/utils/cn'

export interface HeatMapCell {
  date: Date
  total: number
  intensity: number
}

export interface HeatMapWeek {
  weekStart: Date
  days: HeatMapCell[]
}

interface HeatMapProps {
  weeks: HeatMapWeek[]
  color?: string
  /** 0 = Sunday … 6 = Saturday. Defaults to Monday so rows align with a
   * Monday-start week (the service's `startOfWeek({ weekStartsOn: 1 })`). */
  weekStartsOn?: number
}

const DEFAULT_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const OPACITY = [0, 0.18, 0.38, 0.62, 0.95]

/** GitHub-style spending-intensity grid: one row per weekday, one column per
 * week. Cell intensity (0–4) maps to escalating fill opacity of the accent
 * color; hover/`title` shows the exact day + total. */
export function HeatMap({ weeks, color = '#10B981', weekStartsOn = 1 }: HeatMapProps) {
  const labels = [...DEFAULT_LABELS.slice(weekStartsOn), ...DEFAULT_LABELS.slice(0, weekStartsOn)]

  return (
    <div>
      <div
        role="img"
        aria-label={`Spending heatmap over ${weeks.length} weeks`}
        className="flex flex-col gap-4"
      >
        {labels.map((label, weekday) => (
          <div key={label} className="flex items-center gap-8">
            <span className="w-24 shrink-0 text-caption text-text-tertiary">{label}</span>
            <div className="flex gap-4">
              {weeks.map((week) => {
                const cell = week.days[weekday]
                return (
                  <div
                    key={week.weekStart.getTime()}
                    title={`${format(cell.date, 'd MMM')}: ₹${cell.total.toLocaleString('en-IN')}`}
                    className={cn(
                      'size-24 rounded-sm',
                      cell.intensity === 0 && 'bg-neutral-100 dark:bg-neutral-800'
                    )}
                    style={
                      cell.intensity > 0
                        ? { backgroundColor: color, opacity: OPACITY[cell.intensity] }
                        : undefined
                    }
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-end gap-8">
        <span className="text-caption text-text-tertiary">Less</span>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="size-16 rounded-sm"
            style={{ backgroundColor: color, opacity: OPACITY[i] }}
          />
        ))}
        <span className="text-caption text-text-tertiary">More</span>
      </div>
    </div>
  )
}
