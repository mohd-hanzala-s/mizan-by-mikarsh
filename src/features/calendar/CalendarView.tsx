import { useMemo } from 'react'
import type { CalendarEvent, CalendarEventKind } from '@/services/CalendarService'
import { dotColor, getDaySummary } from '@/services/CalendarService'
import { cn } from '@/utils/cn'

interface CalendarViewProps {
  year: number
  monthIndex: number
  firstDayOfWeek: number
  events: CalendarEvent[]
  selectedDate: Date | null
  onSelectDay: (date: Date) => void
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function compactAmount(net: number): string {
  const sign = net < 0 ? '−' : '+'
  const abs = Math.abs(net)
  if (abs >= 1000) {
    const k = (abs / 1000).toFixed(1).replace(/\.0$/, '')
    return `${sign}₹${k}k`
  }
  return `${sign}₹${abs}`
}

function uniqueEventKinds(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Map<CalendarEventKind, CalendarEvent>()
  for (const e of events) {
    if (!seen.has(e.kind)) {
      seen.set(e.kind, e)
    }
  }
  return [...seen.values()]
}

export function CalendarView({
  year,
  monthIndex,
  firstDayOfWeek,
  events,
  selectedDate,
  onSelectDay,
}: CalendarViewProps) {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`

  const cells = useMemo(() => {
    const monthStart = new Date(year, monthIndex, 1)
    const offset = (monthStart.getDay() - firstDayOfWeek + 7) % 7
    const gridStart = new Date(year, monthIndex, 1 - offset)
    const out: Date[] = []
    for (let i = 0; i < 42; i++) {
      out.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
    }
    return out
  }, [year, monthIndex, firstDayOfWeek])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`
      const list = map.get(key) ?? []
      list.push(e)
      map.set(key, list)
    }
    return map
  }, [events])

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface-card">
      <div className="grid grid-cols-7 border-b border-border-subtle">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              'py-8 text-center text-caption font-medium text-text-tertiary',
              (i + firstDayOfWeek) % 7 === 0 && 'text-expense'
            )}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const dayEvents =
            eventsByDay.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`) ?? []
          const summary = getDaySummary(dayEvents)
          const isOutsideMonth = date.getMonth() !== monthIndex
          const isToday = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey
          const isSelected =
            selectedDate !== null &&
            selectedDate.getFullYear() === date.getFullYear() &&
            selectedDate.getMonth() === date.getMonth() &&
            selectedDate.getDate() === date.getDate()

          const kindEvents = uniqueEventKinds(dayEvents).slice(0, 3)
          const extraCount = Math.max(0, uniqueEventKinds(dayEvents).length - 3)

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDay(date)}
              aria-label={`${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`}
              className={cn(
                'flex h-24 min-w-0 flex-col items-start justify-between gap-4 border-border-subtle p-4 text-left outline-none',
                isSelected ? 'bg-income-subtle' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <span
                className={cn(
                  'flex size-24 items-center justify-center rounded-full text-caption font-medium tabular-nums',
                  isToday
                    ? 'bg-income text-white'
                    : isSelected
                      ? 'text-income'
                      : 'text-text-secondary',
                  isOutsideMonth && !isToday && 'text-text-tertiary opacity-50'
                )}
              >
                {date.getDate()}
              </span>
              <span className="flex w-full flex-col gap-4">
                {dayEvents.length > 0 && (
                  <span className="flex items-center gap-4">
                    {kindEvents.map((e) => (
                      <span
                        key={e.id}
                        className={cn('size-4 rounded-full', dotColor(e))}
                        aria-hidden="true"
                      />
                    ))}
                    {extraCount > 0 && (
                      <span className="text-caption text-text-tertiary tabular-nums">
                        +{extraCount}
                      </span>
                    )}
                  </span>
                )}
                {summary.net !== 0 && (
                  <span
                    className={cn(
                      'truncate text-caption tabular-nums',
                      summary.net < 0 ? 'text-expense' : 'text-income'
                    )}
                  >
                    {compactAmount(summary.net)}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
