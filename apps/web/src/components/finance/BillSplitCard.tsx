import { Trash2, Check } from 'lucide-react'
import type { BillSplit } from '@/types/entities'
import { computeSummary } from '@/services/BillSplitService'
import { cn } from '@/utils/cn'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

interface BillSplitCardProps {
  split: BillSplit
  onToggleSettled: (participantId: string) => void
  onDelete: () => void
}

export function BillSplitCard({ split, onToggleSettled, onDelete }: BillSplitCardProps) {
  const summary = computeSummary(split)
  const allSettled = summary.totalOutstanding === 0

  return (
    <div className="flex flex-col gap-12 rounded-md border border-border bg-surface-card p-16">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-text-primary">{split.description}</p>
          <p className="text-caption text-text-tertiary">
            {fmt(split.totalAmount)} total ·{' '}
            {new Date(split.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-8">
          {allSettled && (
            <span className="rounded-full bg-income-subtle px-8 py-2 text-caption font-medium text-income">
              Settled
            </span>
          )}
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete split"
            className="flex size-32 items-center justify-center rounded-full text-text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Trash2 className="size-14 text-expense" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border-subtle">
        {split.participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-8 py-8">
            <span
              className={cn(
                'text-body-sm',
                p.isSettled ? 'text-text-tertiary line-through' : 'text-text-primary'
              )}
            >
              {p.name}
            </span>
            <div className="flex items-center gap-8">
              <span className="tabular-nums text-body-sm font-medium text-text-primary">
                {fmt(p.shareAmount)}
              </span>
              <button
                type="button"
                onClick={() => onToggleSettled(p.id)}
                aria-pressed={p.isSettled}
                aria-label={p.isSettled ? `Mark ${p.name} as unsettled` : `Mark ${p.name} as paid`}
                className={cn(
                  'flex size-28 items-center justify-center rounded-full border transition-colors',
                  p.isSettled
                    ? 'border-income bg-income-subtle text-income'
                    : 'border-border text-text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
              >
                <Check className="size-14" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!allSettled && (
        <p className="text-caption text-text-tertiary">
          {fmt(summary.totalOutstanding)} still outstanding
        </p>
      )}
    </div>
  )
}
