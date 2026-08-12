import type { Recommendation, RecommendationPriority } from '@/services/InsightService'
import { cn } from '@/utils/cn'

const PRIORITY_STYLE: Record<
  RecommendationPriority,
  { badge: string; border: string; label: string }
> = {
  critical: {
    badge: 'bg-expense-subtle text-expense',
    border: 'border-expense/30',
    label: 'Critical',
  },
  high: {
    badge: 'bg-gold-500/15 text-gold-500',
    border: 'border-gold-500/30',
    label: 'High',
  },
  medium: {
    badge: 'bg-brand-teal400/15 text-brand-teal400',
    border: 'border-brand-teal400/30',
    label: 'Medium',
  },
  low: {
    badge: 'bg-brand-teal900/5 text-text-secondary dark:bg-brand-teal900/10',
    border: 'border-brand-teal900/10',
    label: 'Low',
  },
}

interface InsightCardProps {
  recommendation: Recommendation
  /** Optional feedback — pass null/omit to hide the buttons entirely. */
  onFeedback?: (id: string, type: 'helpful' | 'dismissed') => void
}

/** §7 recommendation card. Each item exposes the spec's explainability
 * structure (Observation → Reason → Recommendation → Expected Impact) plus a
 * priority badge so the ordering is legible at a glance. */
export function InsightCard({ recommendation, onFeedback }: InsightCardProps) {
  const style = PRIORITY_STYLE[recommendation.priority]

  return (
    <div
      className={cn(
        'card flex flex-col gap-14 p-16 transition-all duration-fast',
        style.border
      )}
    >
      <div className="flex items-center justify-between gap-12">
        <h3 className="font-heading text-body-lg font-bold text-text-primary">
          {recommendation.title}
        </h3>
        <span
          className={cn(
            'shrink-0 rounded-full px-10 py-4 text-caption font-semibold tracking-wide uppercase',
            style.badge
          )}
        >
          {style.label}
        </span>
      </div>

      <dl className="flex flex-col gap-10">
        <div className="flex gap-12">
          <dt className="w-96 shrink-0 text-caption font-bold uppercase tracking-wider text-text-tertiary">
            Observation
          </dt>
          <dd className="min-w-0 text-body-sm text-text-secondary">{recommendation.observation}</dd>
        </div>
        <div className="flex gap-12">
          <dt className="w-96 shrink-0 text-caption font-bold uppercase tracking-wider text-text-tertiary">
            Reason
          </dt>
          <dd className="min-w-0 text-body-sm text-text-secondary">{recommendation.reason}</dd>
        </div>
        <div className="flex gap-12">
          <dt className="w-96 shrink-0 text-caption font-bold uppercase tracking-wider text-text-tertiary">
            Action
          </dt>
          <dd className="min-w-0 text-body-sm font-semibold text-text-primary">
            {recommendation.recommendation}
          </dd>
        </div>
        <div className="flex gap-12">
          <dt className="w-96 shrink-0 text-caption font-bold uppercase tracking-wider text-text-tertiary">
            Impact
          </dt>
          <dd className="min-w-0 text-body-sm text-text-secondary">{recommendation.impact}</dd>
        </div>
      </dl>

      {onFeedback && (
        <div className="mt-4 flex items-center gap-12 border-t border-border/60 pt-10">
          <span className="text-caption font-medium text-text-tertiary">Was this helpful?</span>
          <button
            type="button"
            onClick={() => onFeedback(recommendation.id, 'helpful')}
            className="inline-flex min-h-touch items-center rounded-lg border border-brand-teal400/20 bg-brand-teal400/10 px-14 text-caption font-semibold text-brand-teal400 transition-all duration-fast hover:bg-brand-teal400/20"
          >
            Helpful
          </button>
          <button
            type="button"
            onClick={() => onFeedback(recommendation.id, 'dismissed')}
            className="inline-flex min-h-touch items-center rounded-lg border border-expense/20 bg-expense/10 px-14 text-caption font-semibold text-expense transition-all duration-fast hover:bg-expense/20"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
