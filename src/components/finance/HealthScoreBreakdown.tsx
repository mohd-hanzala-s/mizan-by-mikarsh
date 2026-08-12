import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ProgressRing } from '@/components/charts/ProgressRing'
import { CHART_ACCENTS } from '@/theme/chartColors'
import { cn } from '@/utils/cn'
import type { HealthScore } from '@/services/InsightService'

export interface BreakdownFactor {
  key: string
  label: string
  weight: number
  value: number
  displayValue: string
}

interface HealthScoreBreakdownProps {
  health: HealthScore
  factors: BreakdownFactor[]
}

const TONE_RING: Record<string, string> = {
  poor: CHART_ACCENTS.expense,
  fair: '#D9A441',
  good: '#62C3A7',
  excellent: '#0F4D45',
}

const TONE_LABEL: Record<string, { badge: string; label: string }> = {
  poor: { badge: 'bg-expense-subtle text-expense', label: 'Needs attention' },
  fair: { badge: 'bg-gold-500/15 text-gold-500', label: 'On the way' },
  good: { badge: 'bg-brand-teal400/15 text-brand-teal400', label: 'Healthy' },
  excellent: { badge: 'bg-brand-teal900/15 text-brand-teal900', label: 'Excellent' },
}

function scoreTone(score: number): string {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}

export function HealthScoreBreakdown({ health, factors }: HealthScoreBreakdownProps) {
  const [expanded, setExpanded] = useState(false)
  const tone = scoreTone(health.score)
  const ring = TONE_RING[tone]
  const { badge, label } = TONE_LABEL[tone]

  return (
    <section className="card p-16">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full flex-col gap-16 lg:flex-row lg:items-center text-left group cursor-pointer"
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
            <span className="flex items-center gap-2 text-caption text-text-tertiary">
              {expanded ? (
                <ChevronUp className="size-14" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-14" aria-hidden="true" />
              )}
              {expanded ? 'Collapse' : 'Details'}
            </span>
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
      </button>

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
            {factors.map((f) => (
              <div key={f.key} className="flex items-center gap-8 py-10">
                <div className="flex min-w-0 flex-1 items-center gap-8">
                  <span className="truncate text-body-sm font-medium text-text-primary">
                    {f.label}
                  </span>
                  <span className="shrink-0 rounded-full bg-brand-teal900/8 px-8 py-2 text-caption font-medium text-text-tertiary">
                    {f.weight}%
                  </span>
                </div>
                <div className="flex w-128 shrink-0 items-center gap-8">
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
    </section>
  )
}
