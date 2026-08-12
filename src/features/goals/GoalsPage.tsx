import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ChevronDown } from 'lucide-react'
import { useGoalsStore } from './goalsStore'
import { GoalService } from '@/services/GoalService'
import { GoalCard } from '@/components/finance/GoalCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SkeletonList } from '@/components/common/Skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { GoalType } from '@/types/entities'

const CATEGORY_ORDER: GoalType[] = [
  'emergency_fund',
  'house',
  'vehicle',
  'education',
  'retirement',
  'travel',
  'investment',
  'gadget',
  'wedding',
  'custom',
]

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string }[] = CATEGORY_ORDER.map((t) => ({
  value: t,
  label: GoalService.getCategoryLabel(t),
}))

export function GoalsPage() {
  const goals = useGoalsStore((s) => s.goals)
  const isLoading = useGoalsStore((s) => s.isLoading)
  const load = useGoalsStore((s) => s.load)
  const create = useGoalsStore((s) => s.create)
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load goals'))
  }, [load])

  const totalTarget = useMemo(() => goals.reduce((sum, g) => sum + g.targetAmount, 0), [goals])
  const totalCurrent = useMemo(() => goals.reduce((sum, g) => sum + g.currentAmount, 0), [goals])
  const overallProgress = useMemo(
    () => (totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0),
    [totalTarget, totalCurrent]
  )

  const goalsByCategory = useMemo(() => {
    const grouped: Record<string, typeof goals> = {}
    for (const cat of CATEGORY_ORDER) {
      const catGoals = goals.filter((g) => g.type === cat)
      if (catGoals.length > 0) grouped[cat] = catGoals
    }
    return grouped
  }, [goals])

  const toggleSection = (category: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null)
          load().catch((err) =>
            setError(err instanceof Error ? err.message : 'Failed to load goals')
          )
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="p-16">
        <SkeletonList count={3} />
      </div>
    )
  }

  if (goals.length === 0 && !showForm) {
    return (
      <EmptyState
        illustration={
          <div className="flex flex-col items-center gap-12">
            <div className="flex flex-wrap justify-center gap-8 max-w-[280px]">
              {GOAL_TYPE_OPTIONS.slice(0, 6).map((opt) => (
                <span
                  key={opt.value}
                  className="rounded-full bg-surface-card px-10 py-4 text-caption font-medium text-text-secondary shadow-glass-sm"
                >
                  {opt.label}
                </span>
              ))}
            </div>
          </div>
        }
        title="No goals yet"
        description="Start your Goal Center. Track savings, plan big purchases, invest for the future. Every great journey begins with the first step."
        actionLabel="Create your first goal"
        onAction={() => setShowForm(true)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 text-text-primary">Goal Center</h1>
          <p className="text-body-sm text-text-secondary">
            {goals.length} goals · {overallProgress}% overall
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="size-16" aria-hidden="true" />
          New Goal
        </Button>
      </div>

      <div className="card flex flex-col gap-12 p-20 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-16">
          <div className="relative size-56">
            <svg viewBox="0 0 56 56" className="size-56 -rotate-90">
              <circle
                cx="28" cy="28" r="24"
                fill="none"
                stroke="currentColor"
                className="text-border-subtle"
                strokeWidth="6"
              />
              <circle
                cx="28" cy="28" r="24"
                fill="none"
                stroke="#62C3A7"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${overallProgress * 1.51} 151`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading text-body font-semibold text-text-primary tabular-nums">
                {overallProgress}%
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-body-sm text-text-secondary">Total Progress</p>
            <p className="font-heading text-body-lg font-semibold text-text-primary tabular-nums">
              {'\u20B9'}
              {totalCurrent.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className="flex gap-24 md:gap-32">
          <div className="flex flex-col gap-2">
            <p className="text-body-sm text-text-secondary">Target</p>
            <p className="font-heading text-body font-semibold text-text-primary tabular-nums">
              {'\u20B9'}
              {totalTarget.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-body-sm text-text-secondary">Remaining</p>
            <p className="font-heading text-body font-semibold text-text-primary tabular-nums">
              {'\u20B9'}
              {(totalTarget - totalCurrent).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      <div className="card-input mt-8 h-10 w-full overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-brand-teal400 transition-all duration-slow"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {Object.entries(goalsByCategory).map(([category, categoryGoals]) => {
        const isCollapsed = collapsedSections.has(category)
        const label = GoalService.getCategoryLabel(category as GoalType)
        const categoryTarget = categoryGoals.reduce((s, g) => s + g.targetAmount, 0)
        const categoryCurrent = categoryGoals.reduce((s, g) => s + g.currentAmount, 0)
        const categoryProgress =
          categoryTarget > 0 ? Math.round((categoryCurrent / categoryTarget) * 100) : 0

        return (
          <section key={category} className="flex flex-col gap-8">
            <button
              type="button"
              onClick={() => toggleSection(category)}
              className="flex items-center justify-between rounded-xl px-4 py-8 transition-colors hover:bg-border-subtle"
            >
              <div className="flex items-center gap-8">
                <span className="font-heading text-body font-semibold text-text-primary">
                  {label}
                </span>
                <span className="rounded-full bg-border-subtle px-8 py-2 text-caption font-medium text-text-tertiary">
                  {categoryGoals.length}
                </span>
                {categoryGoals.length > 0 && (
                  <span className="rounded-full px-6 py-2 text-caption font-medium text-income bg-income-subtle tabular-nums">
                    {categoryProgress}%
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  'size-18 text-text-tertiary transition-transform duration-fast',
                  isCollapsed && '-rotate-90'
                )}
                aria-hidden="true"
              />
            </button>
            {!isCollapsed && (
              <div className="flex flex-col gap-8">
                {categoryGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    progress={GoalService.computeProgress(goal)}
                    onClick={() => navigate(`/goals/${goal.id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {goals.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-96 right-16 z-40 flex size-56 items-center justify-center rounded-full bg-brand-teal900 text-white shadow-lg transition-transform duration-fast active:scale-95 md:bottom-24"
          aria-label="Create new goal"
        >
          <Plus className="size-24" aria-hidden="true" />
        </button>
      )}

      {showForm && (
        <GoalFormSheet
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            void load()
          }}
          create={create}
        />
      )}
    </div>
  )
}

function GoalFormSheet({
  onClose,
  onCreated,
  create,
}: {
  onClose: () => void
  onCreated: () => void
  create: ReturnType<typeof useGoalsStore.getState>['create']
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<GoalType>('emergency_fund')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !targetAmount) {
      setFormError('Please fill in all required fields.')
      return
    }
    const amount = parseFloat(targetAmount)
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid target amount.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await create({
        name: name.trim(),
        type,
        targetAmount: amount,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        categoryId: null,
        notes,
      })
      onCreated()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 md:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-surface-card p-24 shadow-lg md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-16 flex items-center justify-between">
          <h2 className="font-heading text-h2 text-text-primary">New Goal</h2>
          <button
            onClick={onClose}
            className="flex size-40 items-center justify-center rounded-lg text-text-tertiary hover:bg-border-subtle"
            aria-label="Close"
          >
            <X className="size-20" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-16">
          <label className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Name</span>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund"
              className="min-h-touch rounded-lg border border-border bg-surface px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:border-brand-teal900 focus:outline-none"
              autoFocus
            />
          </label>

          <div className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Category</span>
            <div className="grid grid-cols-2 gap-8">
              {GOAL_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`rounded-lg px-12 py-8 text-body-sm font-medium transition-colors ${type === opt.value ? 'bg-brand-teal900 text-white' : 'bg-border-subtle text-text-secondary hover:bg-border'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Target Amount (INR)</span>
            <input
              type="number"
              inputMode="decimal"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="min-h-touch rounded-lg border border-border bg-surface px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:border-brand-teal900 focus:outline-none"
              min="1"
            />
          </label>

          <label className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Deadline (optional)</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="min-h-touch rounded-lg border border-border bg-surface px-12 py-8 text-body text-text-primary focus:border-brand-teal900 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this goal matters..."
              rows={2}
              className="min-h-touch rounded-lg border border-border bg-surface px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:border-brand-teal900 focus:outline-none"
            />
          </label>

          {formError && (
            <p
              className="rounded-lg bg-expense-subtle px-12 py-8 text-body-sm text-expense"
              role="alert"
            >
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="mt-8">
            {submitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </form>
      </div>
    </div>
  )
}
