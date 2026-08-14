import { useEffect, useMemo, useState } from 'react'
import {
  Play,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Trophy,
  Lightbulb,
  Target,
} from 'lucide-react'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { FinancialReplayService, type MonthlyReplay } from '@/services/FinancialReplayService'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/common/Skeleton'
import { cn } from '@/utils/cn'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function MetricBlock({
  label,
  value,
  subtitle,
  tone = 'default',
}: {
  label: string
  value: string
  subtitle?: string
  tone?: 'default' | 'income' | 'expense' | 'warning'
}) {
  const colors: Record<string, string> = {
    default: 'text-text-primary',
    income: 'text-income',
    expense: 'text-expense',
    warning: 'text-warning',
  }
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-surface-card p-12">
      <span className="text-caption text-text-tertiary">{label}</span>
      <span className={cn('text-h4 font-semibold', colors[tone])}>{value}</span>
      {subtitle && <span className="text-caption text-text-tertiary">{subtitle}</span>}
    </div>
  )
}

function WinCard({ win }: { win: { title: string; detail: string } }) {
  return (
    <div className="flex gap-12 rounded-md border border-income/20 bg-income-subtle p-12">
      <Trophy className="mt-2 size-20 shrink-0 text-income" aria-hidden="true" />
      <div>
        <p className="text-body-sm font-medium text-text-primary">{win.title}</p>
        <p className="text-caption text-text-secondary">{win.detail}</p>
      </div>
    </div>
  )
}

function RiskCard({
  risk,
}: {
  risk: { title: string; detail: string; severity: 'low' | 'medium' | 'high' }
}) {
  const severityColors = {
    high: 'border-expense/20 bg-expense-subtle',
    medium: 'border-warning/20 bg-warning-subtle',
    low: 'border-info/20 bg-info-subtle',
  }
  return (
    <div className={cn('flex gap-12 rounded-md border p-12', severityColors[risk.severity])}>
      <AlertTriangle
        className={cn(
          'mt-2 size-20 shrink-0',
          risk.severity === 'high'
            ? 'text-expense'
            : risk.severity === 'medium'
              ? 'text-warning'
              : 'text-info'
        )}
        aria-hidden="true"
      />
      <div>
        <p className="text-body-sm font-medium text-text-primary">{risk.title}</p>
        <p className="text-caption text-text-secondary">{risk.detail}</p>
      </div>
    </div>
  )
}

function MilestoneCard({ milestone }: { milestone: { title: string; detail: string } }) {
  return (
    <div className="flex gap-12 rounded-md border border-primary/20 bg-primary-subtle p-12">
      <Target className="mt-2 size-20 shrink-0 text-primary" aria-hidden="true" />
      <div>
        <p className="text-body-sm font-medium text-text-primary">{milestone.title}</p>
        <p className="text-caption text-text-secondary">{milestone.detail}</p>
      </div>
    </div>
  )
}

function SuggestionCard({ text }: { text: string }) {
  return (
    <div className="flex gap-12 rounded-md border border-border bg-surface-card p-12">
      <Lightbulb className="mt-2 size-20 shrink-0 text-warning" aria-hidden="true" />
      <p className="text-body-sm text-text-secondary">{text}</p>
    </div>
  )
}

export function FinancialReplayPage({ embedded = false }: { embedded?: boolean } = {}) {
  const transactions = useTransactionsStore((s) => s.transactions)
  const loadTransactions = useTransactionsStore((s) => s.load)
  const accounts = useAccountsStore((s) => s.accounts)
  const loadAccounts = useAccountsStore((s) => s.load)
  const goals = useGoalsStore((s) => s.goals)
  const loadGoals = useGoalsStore((s) => s.load)
  const contributions = useGoalsStore((s) => s.contributionsByGoal)

  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    // Standalone use only. When embedded (Dashboard's "Monthly Recap"
    // widget), the parent already loads these same stores and only
    // mounts this widget once they've resolved — calling load() again
    // here would flip the shared isLoading flag back to true, which
    // (since Dashboard gates its own render on that same flag) would
    // unmount-then-remount this widget in an infinite loop.
    if (embedded) return
    loadTransactions()
    loadAccounts()
    loadGoals()
  }, [embedded, loadTransactions, loadAccounts, loadGoals])

  const months = useMemo(() => FinancialReplayService.availableMonths(transactions), [transactions])

  const replay: MonthlyReplay | null = useMemo(() => {
    if (months.length === 0) return null
    const idx = Math.min(selectedIndex, months.length - 1)
    const m = months[idx]
    return FinancialReplayService.generate(
      m.year,
      m.month,
      transactions,
      accounts,
      goals,
      contributions,
      transactions
    )
  }, [months, selectedIndex, transactions, accounts, goals, contributions])

  // Standalone use: reflect this page's own loading state. Embedded use:
  // Dashboard already gates rendering on the same two stores' isLoading
  // flags before this widget mounts, so by the time we're here there's
  // nothing left to wait on — checking again (and forcing a skeleton
  // whenever someone legitimately has zero accounts, which the old
  // `accounts.length === 0` check did) would be redundant at best and
  // wrong at worst.
  const txLoading = useTransactionsStore((s) => s.isLoading)
  const acctLoading = useAccountsStore((s) => s.isLoading)
  const isLoading = !embedded && (txLoading || acctLoading)

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
        <Skeleton className="h-40 w-192" />
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
        {!embedded && <h1 className="text-h2 text-text-primary">Replay</h1>}
        <EmptyState
          icon={Play}
          title="No replay data yet"
          description="Log some transactions and a monthly financial recap will appear here — highlighting wins, risks, milestones, and suggestions."
        />
      </div>
    )
  }

  const prevDisabled = selectedIndex >= months.length - 1
  const nextDisabled = selectedIndex <= 0

  return (
    <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
      {!embedded && (
        <div className="flex flex-col gap-4">
          <h1 className="text-h2 text-text-primary">Replay</h1>
          <p className="text-body-sm text-text-tertiary">
            Monthly financial recap — your wins, risks, milestones, and suggestions.
          </p>
        </div>
      )}

      {months.length > 1 && (
        <div className="flex items-center gap-8">
          <button
            type="button"
            aria-label="Previous month"
            disabled={prevDisabled}
            onClick={() => setSelectedIndex((p) => p + 1)}
            className="flex size-48 items-center justify-center rounded-full text-text-secondary hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
          >
            <ChevronLeft className="size-24" aria-hidden="true" />
          </button>

          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            aria-label="Select month"
            className="flex-1 rounded-md border border-border bg-surface-card px-12 py-8 text-body-sm text-text-primary"
          >
            {months.map((m, i) => (
              <option key={m.label} value={i}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            aria-label="Next month"
            disabled={nextDisabled}
            onClick={() => setSelectedIndex((p) => p - 1)}
            className="flex size-48 items-center justify-center rounded-full text-text-secondary hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
          >
            <ChevronRight className="size-24" aria-hidden="true" />
          </button>
        </div>
      )}

      {replay && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
            <MetricBlock
              label="Income"
              value={fmt(replay.income)}
              subtitle={
                replay.incomeChange !== null
                  ? `${replay.incomeChange >= 0 ? '+' : ''}${replay.incomeChange}% vs prev`
                  : undefined
              }
              tone="income"
            />
            <MetricBlock
              label="Expenses"
              value={fmt(replay.expense)}
              subtitle={
                replay.expenseChange !== null
                  ? `${replay.expenseChange >= 0 ? '+' : ''}${replay.expenseChange}% vs prev`
                  : undefined
              }
              tone="expense"
            />
            <MetricBlock
              label="Net Cash Flow"
              value={fmt(replay.netCashFlow)}
              tone={replay.netCashFlow >= 0 ? 'income' : 'expense'}
            />
            <MetricBlock
              label="Savings Rate"
              value={`${replay.savingsRate}%`}
              tone={
                replay.savingsRate >= 20
                  ? 'income'
                  : replay.savingsRate >= 0
                    ? 'default'
                    : 'expense'
              }
            />
          </div>

          {/* Wins */}
          {replay.wins.length > 0 && (
            <section>
              <h2 className="text-overline text-text-tertiary mb-8">Wins</h2>
              <div className="flex flex-col gap-8">
                {replay.wins.map((w, i) => (
                  <WinCard key={i} win={w} />
                ))}
              </div>
            </section>
          )}

          {/* Risks */}
          {replay.risks.length > 0 && (
            <section>
              <h2 className="text-overline text-text-tertiary mb-8">Risks</h2>
              <div className="flex flex-col gap-8">
                {replay.risks.map((r, i) => (
                  <RiskCard key={i} risk={r} />
                ))}
              </div>
            </section>
          )}

          {/* Milestones */}
          {replay.milestones.length > 0 && (
            <section>
              <h2 className="text-overline text-text-tertiary mb-8">Milestones</h2>
              <div className="flex flex-col gap-8">
                {replay.milestones.map((m, i) => (
                  <MilestoneCard key={i} milestone={m} />
                ))}
              </div>
            </section>
          )}

          {/* Suggestions */}
          {replay.suggestions.length > 0 && (
            <section>
              <h2 className="text-overline text-text-tertiary mb-8">Suggestions</h2>
              <div className="flex flex-col gap-8">
                {replay.suggestions.map((s, i) => (
                  <SuggestionCard key={i} text={s} />
                ))}
              </div>
            </section>
          )}

          {replay.transactionCount > 0 && (
            <p className="text-caption text-text-tertiary text-center">
              Based on {replay.transactionCount} tracked transaction
              {replay.transactionCount !== 1 ? 's' : ''} in {replay.label}.
            </p>
          )}
        </>
      )}
    </div>
  )
}
