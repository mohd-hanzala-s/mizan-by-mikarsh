import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, addMonths, subMonths } from 'date-fns'
import {
  Bell,
  Target,
  Vault,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { useSettingsStore } from '@/app/settingsStore'
import { getUpcomingObligations } from '@/services/RecurringService'
import { GoalService } from '@/services/GoalService'
import { Button } from '@/components/ui/button'
import { SkeletonPage } from '@/components/common/Skeleton'
import { cn } from '@/utils/cn'

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function CalendarMini() {
  const [viewDate, setViewDate] = useState(() => new Date())
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart)
  const transactions = useTransactionsStore((s) => s.transactions)

  const daysWithTx = useMemo(() => {
    const set = new Set<string>()
    for (const tx of transactions) {
      if (tx.isDeleted) continue
      set.add(format(new Date(tx.transactionDate), 'yyyy-MM-dd'))
    }
    return set
  }, [transactions])

  const prevMonth = () => setViewDate(subMonths(viewDate, 1))
  const nextMonth = () => setViewDate(addMonths(viewDate, 1))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="flex size-32 items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-16" aria-hidden="true" />
        </button>
        <span className="text-body font-semibold text-text-primary">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex size-32 items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-all"
          aria-label="Next month"
        >
          <ChevronRight className="size-16" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="flex h-28 items-center justify-center text-[10px] font-semibold text-text-tertiary uppercase">
            {d}
          </div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-28" />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const hasTx = daysWithTx.has(key)
          const isCurrentDay = isToday(day)
          return (
            <div
              key={key}
              className={cn(
                'flex h-28 items-center justify-center rounded-full text-body-sm font-medium transition-all',
                isCurrentDay && 'bg-brand-teal900 text-white font-bold',
                !isCurrentDay && hasTx && 'bg-gold-500/20 text-text-primary',
                !isCurrentDay && !hasTx && 'text-text-secondary'
              )}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PlannerHubPage() {
  const loadTx = useTransactionsStore((s) => s.load)
  const txIsLoading = useTransactionsStore((s) => s.isLoading)
  const recurringRules = useRecurringStore((s) => s.rules)
  const loadRecurring = useRecurringStore((s) => s.load)
  const recIsLoading = useRecurringStore((s) => s.isLoading)
  const goals = useGoalsStore((s) => s.goals)
  const loadGoals = useGoalsStore((s) => s.load)
  const goalsIsLoading = useGoalsStore((s) => s.isLoading)
  const settings = useSettingsStore((s) => s.settings)
  const navigate = useNavigate()

  useEffect(() => {
    loadTx()
    loadRecurring()
    loadGoals()
  }, [loadTx, loadRecurring, loadGoals])

  const obligations = useMemo(
    () => getUpcomingObligations(recurringRules, 30),
    [recurringRules]
  )

  const goalsWithDeadlines = useMemo(
    () => goals
      .filter((g) => g.status === 'active' && g.deadline)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()),
    [goals]
  )

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status === 'active'),
    [goals]
  )

  if (txIsLoading || recIsLoading || goalsIsLoading || !settings) {
    return <SkeletonPage sections={3} />
  }

  return (
    <div className="flex flex-col gap-20 p-16 md:p-24">
      <div>
        <h1 className="font-heading text-h2 font-bold text-text-primary tracking-tight">Planner</h1>
        <p className="text-body-sm text-text-tertiary mt-4">Calendar &amp; organization hub</p>
      </div>

      <section className="card flex flex-col gap-14 p-20">
        <div className="flex items-center justify-between">
          <h2 className="text-overline font-bold tracking-wider text-text-tertiary uppercase">Calendar</h2>
          <Button variant="tertiary" size="sm" onClick={() => navigate('/calendar')}>
            Full Calendar <ArrowRight className="size-14" aria-hidden="true" />
          </Button>
        </div>
        <CalendarMini />
      </section>

      <section className="card flex flex-col gap-14 p-20">
        <div className="flex items-center justify-between">
          <h2 className="text-overline font-bold tracking-wider text-text-tertiary uppercase">Upcoming Bills</h2>
          <Button variant="tertiary" size="sm" onClick={() => navigate('/recurring')}>
            Manage <ArrowRight className="size-14" aria-hidden="true" />
          </Button>
        </div>
        {obligations.length === 0 ? (
          <p className="text-body-sm text-text-secondary py-8">No bills due in the next 30 days.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
            {obligations.slice(0, 8).map((o) => (
              <div key={o.ruleId} className="flex items-center justify-between gap-8 px-16 py-14">
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-text-primary">{o.title}</p>
                  <p className="text-caption text-text-tertiary mt-1">
                    {o.type === 'income' ? 'Incoming' : 'Due'} {format(o.date, 'd MMM yyyy')}
                  </p>
                </div>
                <span className={`shrink-0 tabular-nums text-body font-bold ${o.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {o.type === 'income' ? '+' : '\u2212'}\u20B9{o.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card flex flex-col gap-14 p-20">
        <div className="flex items-center justify-between">
          <h2 className="text-overline font-bold tracking-wider text-text-tertiary uppercase">Goals &amp; Deadlines</h2>
          <Button variant="tertiary" size="sm" onClick={() => navigate('/goals')}>
            View All <ArrowRight className="size-14" aria-hidden="true" />
          </Button>
        </div>
        {activeGoals.length === 0 ? (
          <p className="text-body-sm text-text-secondary py-8">Set a goal with a deadline to track it here.</p>
        ) : goalsWithDeadlines.length === 0 ? (
          <div className="flex flex-col gap-8">
            {activeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center justify-between gap-8 py-8">
                <div className="flex items-center gap-8">
                  <Target className="size-16 text-text-tertiary" aria-hidden="true" />
                  <span className="text-body-sm font-medium text-text-primary">{goal.name}</span>
                </div>
                <span className="text-caption text-text-tertiary">No deadline</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
            {goalsWithDeadlines.slice(0, 5).map((goal) => {
              const progress = GoalService.computeProgress(goal)
              const daysLeft = progress.daysLeft
              return (
                <button
                  key={goal.id}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                  className="flex items-center justify-between gap-8 px-16 py-14 text-left hover:bg-surface transition-colors"
                >
                  <div className="min-w-0 flex items-center gap-8">
                    <Target className="size-16 shrink-0 text-text-tertiary" aria-hidden="true" />
                    <div>
                      <p className="truncate text-body font-semibold text-text-primary">{goal.name}</p>
                      <p className="text-caption text-text-tertiary mt-1">
                        {format(new Date(goal.deadline!), 'd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="tabular-nums text-body font-bold text-text-primary">
                      {progress.percentage.toFixed(0)}%
                    </span>
                    {daysLeft !== null && (
                      <p className={cn('text-caption font-medium', daysLeft <= 7 ? 'text-expense' : 'text-text-tertiary')}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="card flex flex-col gap-14 p-20">
        <div className="flex items-center justify-between">
          <h2 className="text-overline font-bold tracking-wider text-text-tertiary uppercase">Quick Access</h2>
        </div>
        <div className="grid grid-cols-2 gap-12">
          <button
            onClick={() => navigate('/vault')}
            className="flex flex-col items-center gap-8 rounded-2xl border border-border/40 p-16 transition-all duration-fast hover:bg-brand-teal900/5 hover:border-brand-teal900/20"
          >
            <span className="flex size-40 items-center justify-center rounded-xl bg-brand-teal900/8 text-accent">
              <Vault className="size-20" aria-hidden="true" />
            </span>
            <span className="text-body-sm font-medium text-text-primary">Document Vault</span>
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="flex flex-col items-center gap-8 rounded-2xl border border-border/40 p-16 transition-all duration-fast hover:bg-brand-teal900/5 hover:border-brand-teal900/20"
          >
            <span className="flex size-40 items-center justify-center rounded-xl bg-brand-teal900/8 text-accent">
              <Bell className="size-20" aria-hidden="true" />
            </span>
            <span className="text-body-sm font-medium text-text-primary">Reminders</span>
          </button>
        </div>
      </section>

      <section className="card flex flex-col gap-14 p-20">
        <h2 className="text-overline font-bold tracking-wider text-text-tertiary uppercase">Warranty &amp; Insurance</h2>
        <div className="flex flex-col items-center gap-12 py-16">
          <Shield className="size-40 text-brand-teal400/40" aria-hidden="true" />
          <p className="text-body-sm text-text-secondary text-center max-w-[280px]">
            Policy and warranty expiry tracking will be available in a future update.
          </p>
        </div>
      </section>
    </div>
  )
}
