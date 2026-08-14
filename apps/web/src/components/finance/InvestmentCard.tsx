import { useState } from 'react'
import { TrendingUp, TrendingDown, Pencil, Trash2, RefreshCw } from 'lucide-react'
import type { Investment } from '@/types/entities'
import { computeGainLoss } from '@/services/InvestmentService'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const TYPE_LABELS: Record<Investment['type'], string> = {
  stock: 'Stock',
  mutual_fund: 'Mutual Fund',
  fixed_deposit: 'Fixed Deposit',
  other: 'Other',
}

interface InvestmentCardProps {
  investment: Investment
  onEdit: () => void
  onUpdatePrice: () => void
  onDelete: () => void
}

export function InvestmentCard({
  investment,
  onEdit,
  onUpdatePrice,
  onDelete,
}: InvestmentCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { investedValue, currentValue, gainLoss, gainLossPercent } = computeGainLoss(investment)
  const isGain = gainLoss >= 0

  return (
    <div className="flex flex-col gap-12 rounded-md border border-border bg-surface-card p-16">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <p className="truncate text-body font-medium text-text-primary">{investment.name}</p>
          <p className="text-caption text-text-tertiary">
            {TYPE_LABELS[investment.type]} · {investment.units} units ·{' '}
            {new Date(investment.priceUpdatedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
        <div className="flex shrink-0 gap-4">
          <Button variant="tertiary" size="sm" onClick={onUpdatePrice} aria-label="Update price">
            <RefreshCw className="size-14" aria-hidden="true" />
          </Button>
          <Button variant="tertiary" size="sm" onClick={onEdit} aria-label="Edit holding">
            <Pencil className="size-14" aria-hidden="true" />
          </Button>
          {confirmingDelete ? (
            <Button variant="tertiary" size="sm" onClick={onDelete} aria-label="Confirm delete">
              <span className="text-expense">Confirm?</span>
            </Button>
          ) : (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete holding"
            >
              <Trash2 className="size-14 text-expense" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 border-t border-border-subtle pt-12">
        <div>
          <p className="text-caption text-text-tertiary">Invested</p>
          <p className="tabular-nums text-body-sm font-semibold text-text-primary">
            {fmt(investedValue)}
          </p>
        </div>
        <div>
          <p className="text-caption text-text-tertiary">Current</p>
          <p className="tabular-nums text-body-sm font-semibold text-text-primary">
            {fmt(currentValue)}
          </p>
        </div>
        <div>
          <p className="text-caption text-text-tertiary">Gain/Loss</p>
          <p
            className={cn(
              'flex items-center gap-4 tabular-nums text-body-sm font-semibold',
              isGain ? 'text-income' : 'text-expense'
            )}
          >
            {isGain ? (
              <TrendingUp className="size-12" aria-hidden="true" />
            ) : (
              <TrendingDown className="size-12" aria-hidden="true" />
            )}
            {fmt(Math.abs(gainLoss))}
            {gainLossPercent !== null &&
              ` (${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(1)}%)`}
          </p>
        </div>
      </div>
    </div>
  )
}
