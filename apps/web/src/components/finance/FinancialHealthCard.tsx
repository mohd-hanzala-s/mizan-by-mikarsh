import { useState } from 'react'
import type { HealthScore } from '@/services/InsightService'
import { ProgressRing } from '@/components/charts/ProgressRing'
import { CHART_ACCENTS } from '@/theme/chartColors'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { BreakdownFactor } from '@/components/finance/HealthScoreBreakdown'

interface FinancialHealthCardProps {
  health: HealthScore
  previousScore?: number
  breakdownFactors?: BreakdownFactor[]
}

const TONE_RING: Record<string, string> = {
  poor: CHART_ACCENTS.expense,
  fair: '#D9A441',
  good: '#62C3A7',
  excellent: '#0F4D45',
}

const TONE_LABEL: Record<string, { badge: string; label: string }> = {
  poor: { badge: 'bg-expense-subtle text-expense', label: 'Needs attention' },
  fair: { badge: 'bg-warning-subtle text-warning', label: 'On the way' },
  good: { badge: 'bg-income-subtle text-income', label: 'Healthy' },
  excellent: { badge: 'bg-brand-teal900/15 text-brand-teal900', label: 'Excellent' },
}

function scoreTone(score: number): string {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}

export function FinancialHealthCard({
  health,
  previousScore,
  breakdownFactors,
}: FinancialHealthCardProps) {
  const [expanded, setExpanded] = useState(false)
  const tone = scoreTone(health.score)
  const ring = TONE_RING[tone]
  const { badge, label } = TONE_LABEL[tone]
  const hasBreakdown = breakdownFactors && breakdownFactors.length > 0

  const trend =
    previousScore !== undefined
      ? health.score > previousScore + 2
        ? 'up'
        : health.score < previousScore - 2
          ? 'down'
          : 'stable'
      : null

  return (
    <section className="card p-16">
      <div
        className={cn(
          'flex flex-col gap-16 lg:flex-row lg:items-center',
          hasBreakdown && 'cursor-pointer'
        )}
        onClick={hasBreakdown ? () => setExpanded(!expanded) : undefined}
      >
        <div className="flex flex-col items-center gap-8">
          <ProgressRing
            value={health.score}
            size={160}
            strokeWidth={14}
            color={ring}
            label={String(health.score)}
            sublabel="Health score"
          />
          <div className="flex items-center gap-8">
            <span className={cn('rounded-full px-12 py-4 text-caption font-medium', badge)}>
              {label}
            </span>
            {trend && (
              <span className="flex items-center gap-2 text-caption text-text-tertiary">
                {trend === 'up' && (
                  <TrendingUp className="size-12 text-income" aria-hidden="true" />
                )}
                {trend === 'down' && (
                  <TrendingDown className="size-12 text-expense" aria-hidden="true" />
                )}
                {trend === 'stable' && (
                  <Minus className="size-12 text-text-tertiary" aria-hidden="true" />
                )}
                {trend === 'up' && (
                  <span className="text-income">
                    +{health.score - (previousScore ?? health.score)}
                  </span>
                )}
                {trend === 'down' && (
                  <span className="text-expense">
                    {health.score - (previousScore ?? health.score)}
                  </span>
                )}
                {trend === 'stable' && 'No change'}
              </span>
            )}
            {hasBreakdown && (
              <span className="flex items-center gap-2 text-caption text-text-tertiary ml-8">
                {expanded ? (
                  <ChevronUp className="size-14" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-14" aria-hidden="true" />
                )}
                {expanded ? 'Collapse' : 'Details'}
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-overline text-text-tertiary">Top strength</span>
            <p className="text-body-sm text-text-primary">
              <span className="font-medium">{health.topStrength.label}</span>{' '}
              <span className="tabular-nums text-text-secondary">
                &middot; {health.topStrength.value.toFixed(0)}/100
              </span>
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-overline text-text-tertiary">Top concern</span>
            <p className="text-body-sm text-text-primary">
              <span className="font-medium">{health.topConcern.label}</span>{' '}
              <span className="tabular-nums text-text-secondary">
                &middot; {health.topConcern.value.toFixed(0)}/100
              </span>
            </p>
          </div>
          <p className="text-body-sm text-text-secondary">{health.recommendedAction}</p>
        </div>
      </div>

      {hasBreakdown && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-standard',
            expanded ? 'mt-16 max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="border-t border-border-subtle pt-16">
            <div className="flex items-center gap-8 mb-12">
              <span className="text-overline text-brand-teal400">Factor breakdown</span>
            </div>
            <div className="flex flex-col divide-y divide-border-subtle">
              {breakdownFactors!.map((f) => (
                <div key={f.key} className="flex items-center gap-8 py-10">
                  <div className="flex min-w-0 flex-1 items-center gap-8">
                    <span className="truncate text-body-sm font-medium text-text-primary">
                      {f.label}
                    </span>
                    <span className="shrink-0 rounded-full bg-brand-teal900/8 px-8 py-2 text-caption font-medium text-text-tertiary">
                      {f.weight}%
                    </span>
                  </div>
                  <div className="flex w-120 shrink-0 items-center gap-8">
                    <div className="h-8 flex-1 overflow-hidden rounded-full bg-border-subtle dark:bg-surface-raised">
                      <div
                        className="h-full rounded-full bg-brand-teal400 transition-all duration-standard"
                        style={{ width: `${Math.min(100, f.value)}%` }}
                      />
                    </div>
                    <span className="w-36 text-right text-body-sm font-medium tabular-nums text-text-primary">
                      {f.value.toFixed(0)}
                    </span>
                  </div>
                  <span className="w-80 shrink-0 text-right text-caption text-text-tertiary">
                    {f.displayValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!hasBreakdown && (
        <div className="mt-16 flex flex-col divide-y divide-border-subtle">
          {health.factors.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-8 py-8">
              <span className="min-w-0 truncate text-body-sm text-text-secondary">
                {f.label}
                <span className="text-caption text-text-tertiary">
                  {' '}
                  &middot; weight {f.weight}%
                </span>
              </span>
              <div className="h-8 w-64 shrink-0 overflow-hidden rounded-full bg-border-subtle dark:bg-surface-raised">
                <div
                  className="h-full rounded-full transition-all duration-standard"
                  style={{ width: `${Math.min(100, f.value)}%`, backgroundColor: ring }}
                />
              </div>
              <span className="w-40 shrink-0 text-right text-body-sm font-medium tabular-nums text-text-primary">
                {f.value.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
