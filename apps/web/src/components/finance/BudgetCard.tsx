import { Landmark } from 'lucide-react'
import type { BudgetStatus } from '@/services/BudgetService'
import type { Category } from '@/types/entities'
import { GLOBAL_BUDGET_CATEGORY_ID } from '@/types/entities'
import { DynamicIcon } from '@/components/common/DynamicIcon'
import { cn } from '@/utils/cn'

interface BudgetCardProps {
  status: BudgetStatus
  category: Category | undefined
  onClick?: () => void
}

const SEVERITY_BAR: Record<BudgetStatus['severity'], string> = {
  ok: 'bg-brand-teal400',
  warning: 'bg-gold-500',
  over: 'bg-expense',
}

const STATUS_TAGS: Record<BudgetStatus['severity'], { label: string; style: string }> = {
  ok: { label: 'On Track', style: 'shadow-pressed text-brand-teal400' },
  warning: { label: 'Near Limit', style: 'shadow-pressed text-gold-500' },
  over: { label: 'Over Budget', style: 'shadow-pressed text-expense font-bold' },
}

export function BudgetCard({ status, category, onClick }: BudgetCardProps) {
  const isGlobal = status.budget.categoryId === GLOBAL_BUDGET_CATEGORY_ID
  const label = isGlobal ? 'Overall Budget' : (category?.name ?? 'Uncategorized')
  const barWidth = Math.min(status.percentUsed, 100)

  const Wrapper = onClick ? 'button' : 'div'
  const tag = STATUS_TAGS[status.severity]

  return (
    <Wrapper
      {...(onClick ? { type: 'button' } : {})}
      onClick={onClick}
      className={cn(
        'group card-sm flex w-full flex-col gap-12 p-16 text-left transition-all duration-fast',
        onClick && 'hover:shadow-md'
      )}
    >
      <div className="flex items-center justify-between gap-12">
        <span className="flex items-center gap-10 text-body font-semibold text-text-primary min-w-0">
          <span
            className="flex size-32 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 shadow-pressed"
            style={{
              backgroundColor: isGlobal ? 'rgba(15,77,69,0.12)' : `${category?.color}18`,
              color: isGlobal ? '#0F4D45' : category?.color,
            }}
          >
            {isGlobal ? (
              <Landmark className="size-16" aria-hidden="true" />
            ) : category ? (
              <DynamicIcon name={category.icon} className="size-16" />
            ) : null}
          </span>
          <span className="truncate">{label}</span>
        </span>
        <div className="flex items-center gap-8 shrink-0">
          <span
            className={cn(
              'rounded-full px-8 py-2 text-caption font-semibold bg-surface',
              tag.style
            )}
          >
            {tag.label}
          </span>
          <span className="font-heading text-body font-bold tabular-nums text-text-primary">
            {status.percentUsed.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="card-input h-8 overflow-hidden rounded-full p-0.5">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-standard',
            SEVERITY_BAR[status.severity]
          )}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-body-sm font-medium tabular-nums text-text-secondary">
        <span>
          \u20B9{status.spent.toLocaleString('en-IN')}{' '}
          <span className="text-text-tertiary font-normal">
            of \u20B9{status.allocated.toLocaleString('en-IN')}
          </span>
        </span>
        <span
          className={cn(
            'font-semibold',
            status.remaining < 0 ? 'text-expense' : 'text-text-primary'
          )}
        >
          {status.remaining < 0 ? 'Over by ' : ''}\u20B9
          {Math.abs(status.remaining).toLocaleString('en-IN')}
          {status.remaining >= 0 ? ' left' : ''}
        </span>
      </div>
    </Wrapper>
  )
}
