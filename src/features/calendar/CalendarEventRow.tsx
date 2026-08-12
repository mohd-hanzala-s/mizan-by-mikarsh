import { format } from 'date-fns'
import { AlertTriangle, CreditCard, FileWarning, Landmark, Receipt, Repeat, Target } from 'lucide-react'
import type { CalendarEvent, CalendarEventKind } from '@/services/CalendarService'
import { cn } from '@/utils/cn'

interface CalendarEventRowProps {
  event: CalendarEvent
}

const ICON: Record<CalendarEventKind, typeof Receipt> = {
  transaction: Receipt,
  recurring: Repeat,
  loan: Landmark,
  goal_milestone: Target,
  document_expiry: FileWarning,
  tax_reminder: AlertTriangle,
  credit_card_due: CreditCard,
}

const ICON_BG: Record<CalendarEventKind, string> = {
  transaction: 'bg-neutral-100 dark:bg-neutral-800',
  recurring: 'bg-warning-subtle',
  loan: 'bg-liability-subtle',
  goal_milestone: 'bg-brand-teal900/10',
  document_expiry: 'bg-info-subtle',
  tax_reminder: 'bg-expense-subtle',
  credit_card_due: 'bg-warning-subtle',
}

const ICON_FG: Record<CalendarEventKind, string> = {
  transaction: 'text-text-secondary',
  recurring: 'text-warning',
  loan: 'text-liability',
  goal_milestone: 'text-brand-teal900',
  document_expiry: 'text-info',
  tax_reminder: 'text-expense',
  credit_card_due: 'text-warning',
}

function amountStyles(event: CalendarEvent): string {
  if (event.amount > 0) return 'text-income'
  if (event.amount < 0) {
    if (event.kind === 'loan') return 'text-liability'
    return 'text-expense'
  }
  return 'text-text-tertiary'
}

export function CalendarEventRow({ event }: CalendarEventRowProps) {
  const Icon = ICON[event.kind]
  const hasAmount = event.amount !== 0
  const isIn = event.amount > 0
  return (
    <div className="flex items-center justify-between gap-8 px-16 py-12">
      <div className="flex min-w-0 items-center gap-12">
        <span
          className={cn(
            'flex size-32 shrink-0 items-center justify-center rounded-full',
            ICON_BG[event.kind]
          )}
        >
          <Icon className={cn('size-16', ICON_FG[event.kind])} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-text-primary">{event.title}</p>
          <p className="text-body-sm text-text-secondary">{format(event.date, 'd MMM yyyy')}</p>
        </div>
      </div>
      {hasAmount && (
        <span
          className={cn('shrink-0 text-body font-semibold tabular-nums', amountStyles(event))}
        >
          {isIn ? '+' : '−'}₹{Math.abs(event.amount).toLocaleString('en-IN')}
        </span>
      )}
    </div>
  )
}
