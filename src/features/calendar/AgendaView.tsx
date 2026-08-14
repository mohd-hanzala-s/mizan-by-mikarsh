import { format } from 'date-fns'
import type { CalendarEvent } from '@/services/CalendarService'
import { CalendarEventRow } from './CalendarEventRow'
import { EmptyState } from '@/components/common/EmptyState'

interface AgendaViewProps {
  events: CalendarEvent[]
  onSelectDay: (date: Date) => void
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function groupAndSort(
  events: CalendarEvent[]
): { key: string; date: Date; events: CalendarEvent[] }[] {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const key = dayKey(e.date)
    const list = map.get(key) ?? []
    list.push(e)
    map.set(key, list)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, list]) => ({ key, date: list[0].date, events: list }))
}

export function AgendaView({ events, onSelectDay }: AgendaViewProps) {
  const groups = groupAndSort(events)

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No upcoming events"
        description="Try changing your filters or the date range to see more activities."
      />
    )
  }

  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => onSelectDay(group.date)}
            className="px-4 text-left text-body-sm font-medium text-text-secondary hover:text-text-primary"
          >
            {format(group.date, 'EEEE, d MMM yyyy')}
          </button>
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-md border border-border bg-surface-card">
            {group.events.map((e) => (
              <CalendarEventRow key={e.id} event={e} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
