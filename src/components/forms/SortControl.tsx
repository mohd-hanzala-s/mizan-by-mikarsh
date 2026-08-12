import {
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpZA,
  CalendarArrowDown,
  CalendarArrowUp,
} from 'lucide-react'
import { cn } from '@/utils/cn'

export type SortField = 'date' | 'amount'
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  field: SortField
  direction: SortDirection
}

const SORT_OPTIONS: {
  field: SortField
  direction: SortDirection
  label: string
  icon: typeof ArrowUpDown
}[] = [
  { field: 'date', direction: 'desc', label: 'Newest first', icon: CalendarArrowDown },
  { field: 'date', direction: 'asc', label: 'Oldest first', icon: CalendarArrowUp },
  { field: 'amount', direction: 'desc', label: 'Highest amount', icon: ArrowDownAZ },
  { field: 'amount', direction: 'asc', label: 'Lowest amount', icon: ArrowUpZA },
]

interface SortControlProps {
  value: SortState
  onChange: (sort: SortState) => void
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <div className="flex items-center gap-6">
      <ArrowUpDown className="size-16 text-text-tertiary" aria-hidden="true" />
      {SORT_OPTIONS.map((opt) => {
        const isActive = opt.field === value.field && opt.direction === value.direction
        const Icon = opt.icon
        return (
          <button
            key={`${opt.field}-${opt.direction}`}
            type="button"
            onClick={() => onChange({ field: opt.field, direction: opt.direction })}
            className={cn(
              'flex min-h-touch items-center gap-6 rounded-full px-12 text-body-sm font-medium transition-all duration-fast',
              isActive
                ? 'bg-info-subtle text-info shadow-pressed'
                : 'bg-surface text-text-secondary shadow-sm hover:shadow-pressed'
            )}
          >
            <Icon className="size-14" aria-hidden="true" />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
