import type { LucideIcon } from 'lucide-react'
import { TrendIndicator } from '@/components/charts/TrendIndicator'
import { cn } from '@/utils/cn'

interface MetricCardProps {
  label: string
  amount: number
  icon: LucideIcon
  tone: 'income' | 'expense' | 'neutral'
  trend?: number | null
  trendPositiveDirection?: 'up' | 'down'
}

const TONE_CLASSES: Record<MetricCardProps['tone'], string> = {
  income: 'shadow-sm text-income',
  expense: 'shadow-sm text-expense',
  neutral: 'shadow-sm text-brand-teal900',
}

const TONE_BG: Record<MetricCardProps['tone'], string> = {
  income: 'bg-income-subtle',
  expense: 'bg-expense-subtle',
  neutral: 'bg-brand-teal900/8',
}

export function MetricCard({
  label,
  amount,
  icon: Icon,
  tone,
  trend,
  trendPositiveDirection = 'up',
}: MetricCardProps) {
  return (
    <div className="group card-sm flex flex-col justify-between gap-10 p-16 transition-all duration-standard hover:shadow-md">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex size-36 items-center justify-center rounded-xl transition-transform group-hover:scale-105 duration-fast',
            TONE_BG[tone],
            TONE_CLASSES[tone]
          )}
        >
          <Icon className="size-18" aria-hidden="true" />
        </span>
        {trend !== undefined && trend !== null && (
          <TrendIndicator value={trend} positiveDirection={trendPositiveDirection} />
        )}
      </div>
      <div>
        <p className="text-caption font-medium text-text-tertiary uppercase tracking-wide">
          {label}
        </p>
        <p className="font-heading text-h2 font-bold tabular-nums text-text-primary tracking-tight mt-2">
          {amount < 0 ? '\u2212' : ''}\u20B9{Math.abs(amount).toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  )
}
