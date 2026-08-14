import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Plus, Trash2, CheckCircle, Target, CalendarClock } from 'lucide-react'
import { useGoalsStore } from './goalsStore'
import { GoalService } from '@/services/GoalService'
import {
  DEFAULT_AI_FEATURES,
  useFinancialIdentityStore,
} from '@/features/profile/financialIdentityStore'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SkeletonCard } from '@/components/common/Skeleton'
import { cn } from '@/utils/cn'

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goals = useGoalsStore((s) => s.goals)
  const contributionsByGoal = useGoalsStore((s) => s.contributionsByGoal)
  const isLoading = useGoalsStore((s) => s.isLoading)
  const load = useGoalsStore((s) => s.load)
  const contribute = useGoalsStore((s) => s.contribute)
  const cancelGoal = useGoalsStore((s) => s.cancel)
  const removeGoal = useGoalsStore((s) => s.remove)
  const aiFeatures = useFinancialIdentityStore((s) => s.identity?.aiFeatures) ?? DEFAULT_AI_FEATURES

  const [showContribute, setShowContribute] = useState(false)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionNotes, setContributionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [load])

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id])
  const contributions = useMemo(
    () => contributionsByGoal[id ?? ''] ?? [],
    [contributionsByGoal, id]
  )

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null)
          load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="p-16">
        <SkeletonCard />
      </div>
    )
  }

  if (!goal) {
    return (
      <EmptyState
        icon={Target}
        title="Goal not found"
        description="This goal may have been deleted or the link is invalid."
        actionLabel="Back to Goals"
        onAction={() => navigate('/goals')}
      />
    )
  }

  const progress = GoalService.computeProgress(goal, {
    predictions: aiFeatures.goalPrediction,
  })
  const sortedContributions = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const categoryLabel = GoalService.getCategoryLabel(goal.type)
  const color = GoalService.getColor(goal)
  const circumference = 2 * Math.PI * 36
  const progressOffset = circumference - (progress.percentage / 100) * circumference

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(contributionAmount)
    if (isNaN(amount) || amount <= 0) return
    setSubmitting(true)
    try {
      await contribute(goal.id, amount, undefined, contributionNotes)
      setContributionAmount('')
      setContributionNotes('')
      setShowContribute(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contribution')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (!confirm('Mark this goal as completed?')) return
    try {
      await cancelGoal(goal.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal')
    }
  }

  return (
    <div className="flex flex-col gap-24 p-16 md:p-24">
      <div className="flex items-center gap-12">
        <button
          onClick={() => navigate('/goals')}
          className="flex size-40 items-center justify-center rounded-lg text-text-secondary hover:bg-border-subtle"
          aria-label="Back to goals"
        >
          <ArrowLeft className="size-20" aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-h2 text-text-primary">{goal.name}</h1>
          <div className="flex items-center gap-8 mt-2">
            <span
              className="rounded-full px-8 py-2 text-caption font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {categoryLabel}
            </span>
            {goal.status === 'completed' && (
              <span className="rounded-full bg-income-subtle px-8 py-2 text-caption font-semibold text-income">
                Completed
              </span>
            )}
            {goal.status === 'cancelled' && (
              <span className="rounded-full bg-surface px-8 py-2 text-caption font-semibold text-text-tertiary">
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card flex flex-col items-center gap-20 p-24 md:flex-row md:items-start">
        <div className="relative size-128 shrink-0">
          <svg viewBox="0 0 128 128" className="size-128 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              className="text-border-subtle"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              className="transition-all duration-slow"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="font-heading text-h1 font-bold text-text-primary tabular-nums">
              {progress.percentage}%
            </span>
            <span className="text-body-sm text-text-secondary">
              {progress.remaining > 0
                ? `\u20B9${progress.remaining.toLocaleString('en-IN')} left`
                : 'Reached!'}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-16">
          <div className="grid grid-cols-2 gap-12">
            <div className="rounded-xl bg-surface p-12">
              <p className="text-caption text-text-tertiary">Target</p>
              <p className="font-heading text-body-lg font-semibold text-text-primary tabular-nums">
                {'\u20B9'}
                {goal.targetAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-xl bg-surface p-12">
              <p className="text-caption text-text-tertiary">Current</p>
              <p className="font-heading text-body-lg font-semibold text-text-primary tabular-nums">
                {'\u20B9'}
                {goal.currentAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-xl bg-surface p-12">
              <p className="text-caption text-text-tertiary">Remaining</p>
              <p className="font-heading text-body-lg font-semibold text-text-primary tabular-nums">
                {'\u20B9'}
                {progress.remaining.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-xl bg-surface p-12">
              <p className="text-caption text-text-tertiary">Monthly Needed</p>
              <p className="font-heading text-body-lg font-semibold text-text-primary tabular-nums">
                {progress.monthlyTarget !== null && progress.monthlyTarget > 0
                  ? `\u20B9${progress.monthlyTarget.toLocaleString('en-IN')}`
                  : goal.monthlyContribution > 0
                    ? `\u20B9${goal.monthlyContribution.toLocaleString('en-IN')}`
                    : '--'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-text-secondary">Progress</span>
              <span className="text-body-sm tabular-nums font-medium text-text-primary">
                {progress.percentage}%
              </span>
            </div>
            <div className="card-input h-10 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-brand-teal400 transition-all duration-slow"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {goal.status === 'active' && progress.probability && (
        <div className="card flex flex-col gap-12 p-20">
          <div className="flex items-center gap-8">
            <CalendarClock className="size-18 text-text-secondary" aria-hidden="true" />
            <span className="text-body-sm font-semibold text-text-primary">Probability</span>
          </div>
          <div className="flex items-center gap-12">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={cn(
                    'text-body-sm font-semibold',
                    progress.probability === 'on_track' && 'text-income',
                    progress.probability === 'at_risk' && 'text-warning',
                    progress.probability === 'off_track' && 'text-expense'
                  )}
                >
                  {progress.probability === 'on_track'
                    ? 'On Track'
                    : progress.probability === 'at_risk'
                      ? 'At Risk'
                      : 'Off Track'}
                </span>
              </div>
              <div className="h-8 w-full overflow-hidden rounded-full bg-border-subtle">
                <div
                  className="h-full rounded-full transition-all duration-slow"
                  style={{
                    width: `${Math.max(5, progress.percentage)}%`,
                    backgroundColor:
                      progress.probability === 'on_track'
                        ? '#62C3A7'
                        : progress.probability === 'at_risk'
                          ? '#D9A441'
                          : '#D9534F',
                  }}
                />
              </div>
            </div>
          </div>
          {progress.daysLeft !== null && (
            <p className="text-body-sm text-text-secondary">
              {progress.isOverdue
                ? 'Deadline has passed.'
                : progress.daysLeft > 0
                  ? `${progress.daysLeft} days remaining until deadline.`
                  : 'Deadline is today.'}
            </p>
          )}
          {progress.monthlyTarget !== null && progress.monthlyTarget > 0 && !progress.isOverdue && (
            <p className="text-body-sm tabular-nums text-text-secondary">
              Contribute {'\u20B9'}
              {progress.monthlyTarget.toLocaleString('en-IN')}/month to stay on track.
            </p>
          )}
        </div>
      )}

      {goal.status === 'active' && (
        <div className="flex gap-12">
          <Button variant="primary" onClick={() => setShowContribute(true)} className="flex-1">
            <Plus className="size-16" aria-hidden="true" />
            Add Contribution
          </Button>
          <Button variant="secondary" onClick={handleComplete}>
            <CheckCircle className="size-16" aria-hidden="true" />
            Complete
          </Button>
        </div>
      )}

      {goal.notes && (
        <div className="rounded-xl bg-surface-card p-16 shadow-sm">
          <p className="text-body-sm font-medium text-text-secondary">Notes</p>
          <p className="mt-4 text-body text-text-primary">{goal.notes}</p>
        </div>
      )}

      <div>
        <h2 className="mb-12 font-heading text-h3 text-text-primary">Contribution History</h2>
        {sortedContributions.length === 0 ? (
          <p className="text-body-sm text-text-secondary">
            No contributions yet. Add one to start tracking progress.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-xl bg-surface-card shadow-sm">
            {sortedContributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-16 py-12">
                <div>
                  <p className="text-body tabular-nums font-medium text-text-primary">
                    {'\u20B9'}
                    {c.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    {format(new Date(c.date), 'd MMM yyyy')}
                  </p>
                </div>
                {c.notes && (
                  <p className="max-w-[40%] truncate text-body-sm text-text-tertiary">{c.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {goal.status !== 'completed' && (
        <Button
          variant="tertiary"
          onClick={() => {
            if (confirm('Delete this goal and all its contributions?')) {
              void removeGoal(goal.id).then(() => navigate('/goals'))
            }
          }}
        >
          <Trash2 className="size-16" aria-hidden="true" />
          Delete Goal
        </Button>
      )}

      {showContribute && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 md:items-center"
          onClick={() => setShowContribute(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-surface-card p-24 shadow-lg md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-16 font-heading text-h2 text-text-primary">Add Contribution</h2>
            <form onSubmit={handleContribute} className="flex flex-col gap-16">
              <label className="flex flex-col gap-4">
                <span className="text-body-sm font-medium text-text-primary">Amount (INR)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="min-h-touch rounded-lg border border-border bg-surface px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:border-brand-teal900 focus:outline-none"
                  autoFocus
                  min="1"
                />
              </label>
              <label className="flex flex-col gap-4">
                <span className="text-body-sm font-medium text-text-primary">Notes (optional)</span>
                <input
                  type="text"
                  value={contributionNotes}
                  onChange={(e) => setContributionNotes(e.target.value)}
                  placeholder="e.g. Monthly deposit"
                  className="min-h-touch rounded-lg border border-border bg-surface px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:border-brand-teal900 focus:outline-none"
                />
              </label>
              <div className="flex gap-12">
                <Button type="button" variant="secondary" onClick={() => setShowContribute(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                  {submitting ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
