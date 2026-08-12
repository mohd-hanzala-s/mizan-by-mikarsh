import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export interface DateRange {
  start: string | null
  end: string | null
  preset: Preset | null
}

export type Preset =
  'this-month' | 'last-month' | 'this-week' | 'last-week' | 'this-year' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'this-week', label: 'This Week' },
  { key: 'last-week', label: 'Last Week' },
  { key: 'this-year', label: 'This Year' },
]

function computePreset(preset: Preset): { start: string; end: string } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const date = now.getDate()
  const dayOfWeek = now.getDay()

  switch (preset) {
    case 'this-month':
      return {
        start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        end: format(now, 'yyyy-MM-dd'),
      }
    case 'last-month': {
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate()
      return {
        start: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`,
        end: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      }
    }
    case 'this-week': {
      const startOfWeek = new Date(year, month, date - dayOfWeek)
      return {
        start: format(startOfWeek, 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
      }
    }
    case 'last-week': {
      const thisWeekStart = new Date(year, month, date - dayOfWeek)
      const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000)
      const lastWeekEnd = new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      return {
        start: format(lastWeekStart, 'yyyy-MM-dd'),
        end: format(lastWeekEnd, 'yyyy-MM-dd'),
      }
    }
    case 'this-year':
      return {
        start: `${year}-01-01`,
        end: format(now, 'yyyy-MM-dd'),
      }
    default:
      return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') }
  }
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom')

  function applyPreset(p: Preset) {
    if (p === 'custom') {
      setShowCustom(true)
      onChange({
        ...value,
        preset: 'custom',
        start: value.start ?? format(new Date(), 'yyyy-MM-dd'),
        end: value.end ?? format(new Date(), 'yyyy-MM-dd'),
      })
      return
    }
    setShowCustom(false)
    const range = computePreset(p)
    onChange({ start: range.start, end: range.end, preset: p })
  }

  function clear() {
    setShowCustom(false)
    onChange({ start: null, end: null, preset: null })
  }

  const hasFilter = value.preset !== null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6">
        <Calendar className="size-16 text-text-tertiary" aria-hidden="true" />
        {PRESETS.map((p) => {
          const active = value.preset === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={cn(
                'min-h-touch rounded-full border px-14 text-body-sm font-medium transition-all duration-fast',
                active
                  ? 'border-info bg-info-subtle text-info'
                  : 'border-border/60 bg-surface-card text-text-secondary shadow-sm'
              )}
            >
              {p.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => applyPreset('custom')}
          className={cn(
            'min-h-touch rounded-full border px-14 text-body-sm font-medium transition-all duration-fast',
            value.preset === 'custom'
              ? 'border-info bg-info-subtle text-info'
              : 'border-border/60 bg-surface-card text-text-secondary shadow-sm'
          )}
        >
          Custom
        </button>
        {hasFilter && (
          <Button variant="tertiary" size="sm" onClick={clear}>
            Clear
          </Button>
        )}
      </div>
      {showCustom && (
        <div className="flex items-center gap-12">
          <div className="flex flex-col gap-4">
            <label htmlFor="df-start" className="text-caption text-text-tertiary">
              From
            </label>
            <input
              id="df-start"
              type="date"
              value={value.start ?? ''}
              onChange={(e) => onChange({ ...value, start: e.target.value, preset: 'custom' })}
              className="rounded-lg border border-border/60 bg-surface-card px-12 py-8 text-body-sm text-text-primary"
            />
          </div>
          <span className="mt-auto pb-8 text-text-tertiary">to</span>
          <div className="flex flex-col gap-4">
            <label htmlFor="df-end" className="text-caption text-text-tertiary">
              To
            </label>
            <input
              id="df-end"
              type="date"
              value={value.end ?? ''}
              onChange={(e) => onChange({ ...value, end: e.target.value, preset: 'custom' })}
              className="rounded-lg border border-border/60 bg-surface-card px-12 py-8 text-body-sm text-text-primary"
            />
          </div>
        </div>
      )}
    </div>
  )
}
