import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { TrendingDown, TrendingUp, Wallet, CalendarClock, PiggyBank, Landmark } from 'lucide-react'
import { db } from '@/database/db'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useSettingsStore } from '@/app/settingsStore'
import { AnalyticsService } from '@/services/AnalyticsService'
import { CHART_ACCENTS } from '@/theme/chartColors'
import { DonutChart } from '@/components/charts/DonutChart'
import { BarChart } from '@/components/charts/BarChart'
import { AreaChart } from '@/components/charts/AreaChart'
import { HeatMap } from '@/components/charts/HeatMap'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/utils/cn'
import type { Category } from '@/types/entities'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-16 p-16">
      <h2 className="text-overline text-brand-teal400">{title}</h2>
      {children}
    </section>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Wallet
  label: string
  value: string
  tone?: 'default' | 'income' | 'expense' | 'info'
}) {
  const toneClass =
    tone === 'income'
      ? 'text-brand-teal400'
      : tone === 'expense'
        ? 'text-expense'
        : tone === 'info'
          ? 'text-brand-teal600'
          : 'text-text-primary'
  return (
    <div className="card-sm flex flex-col gap-8 p-12">
      <div className="flex items-center gap-8 text-text-secondary">
        <Icon className="size-16" aria-hidden="true" />
        <span className="text-caption font-medium">{label}</span>
      </div>
      <span className={cn('text-h3 tabular-nums', toneClass)}>{value}</span>
    </div>
  )
}

function SeverityPill({ severity }: { severity: 'ok' | 'warning' | 'over' }) {
  const cls =
    severity === 'over'
      ? 'bg-expense-subtle text-expense'
      : severity === 'warning'
        ? 'bg-gold-500/15 text-gold-500'
        : 'bg-brand-teal400/15 text-brand-teal400'
  const label = severity === 'over' ? 'Over' : severity === 'warning' ? 'Near limit' : 'Healthy'
  return <span className={cn('rounded-full px-8 py-4 text-caption font-medium', cls)}>{label}</span>
}

export function AnalyticsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const rules = useRecurringStore((s) => s.rules)
  const loans = useLoansStore((s) => s.loans)
  const payments = useLoansStore((s) => s.payments)
  const budgets = useBudgetsStore((s) => s.budgets)
  const settings = useSettingsStore((s) => s.settings)

  const loadsRef = useRef({
    tx: useTransactionsStore.getState().load,
    acct: useAccountsStore.getState().load,
    rec: useRecurringStore.getState().load,
    loans: useLoansStore.getState().load,
    budgets: useBudgetsStore.getState().load,
    settings: useSettingsStore.getState().load,
  })

  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    loadsRef.current.tx()
    loadsRef.current.acct()
    loadsRef.current.rec()
    loadsRef.current.loans()
    loadsRef.current.budgets()
    loadsRef.current.settings()
    db.categories.toArray().then((all) => setCategories(all.filter((c) => !c.isArchived)))
  }, [])

  const budgetMonthStart = settings?.budgetMonthStart ?? 1

  const cashFlow = useMemo(
    () => AnalyticsService.getCashFlowSeries(transactions, 6),
    [transactions]
  )
  const categoryBreakdown = useMemo(
    () => AnalyticsService.getCategoryBreakdown(transactions, categories),
    [transactions, categories]
  )
  const budgetAnalysis = useMemo(
    () => AnalyticsService.getBudgetAnalysis(budgets, categories, transactions, budgetMonthStart),
    [budgets, categories, transactions, budgetMonthStart]
  )
  const loanAnalysis = useMemo(() => AnalyticsService.getLoanAnalysis(loans), [loans])
  const heatmap = useMemo(() => AnalyticsService.getSpendingHeatmap(transactions), [transactions])
  const yoy = useMemo(() => AnalyticsService.getYearOverYear(transactions), [transactions])
  const forecast = useMemo(
    () => AnalyticsService.getForecast(transactions, accounts, rules, loans, payments),
    [transactions, accounts, rules, loans, payments]
  )

  if (transactions.length === 0) {
    return (
      <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
        {!embedded && <h1 className="text-h2 text-text-primary">Analytics</h1>}
        <EmptyState
          icon={TrendingUp}
          title="No analytics yet"
          description="Add a few transactions and the charts, forecasts, and spending insights here will light up."
        />
      </div>
    )
  }

  const cashFlowGroups = cashFlow.map((m) => ({
    label: m.label,
    series: [
      { label: 'Income', value: m.income, color: CHART_ACCENTS.income },
      { label: 'Expense', value: m.expense, color: CHART_ACCENTS.expense },
    ],
  }))

  const yoyGroups = (type: 'income' | 'expense', color: string) =>
    yoy.months.map((m) => ({
      label: m.label,
      series: [
        { label: String(yoy.lastYear), value: m.lastYear[type], color: CHART_ACCENTS.neutral },
        { label: String(yoy.thisYear), value: m.thisYear[type], color },
      ],
    }))

  const confidencePill =
    forecast.confidence === 'high'
      ? 'bg-brand-teal400/15 text-brand-teal400'
      : forecast.confidence === 'medium'
        ? 'bg-gold-500/15 text-gold-500'
        : 'bg-expense-subtle text-expense'

  return (
    <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
      <div className="flex items-center justify-between">
        {!embedded && <h1 className="text-h2 text-text-primary">Analytics</h1>}
        <span className={cn('rounded-full px-12 py-4 text-caption font-medium', confidencePill)}>
          {forecast.confidence === 'high'
            ? 'High confidence'
            : forecast.confidence === 'medium'
              ? 'Medium confidence'
              : 'Low confidence'}
        </span>
      </div>

      <Card title={`Forecast · ${forecast.monthLabel}`}>
        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
          <Stat
            icon={TrendingDown}
            label="Month-end spending"
            value={fmt(forecast.expenseProjection)}
            tone="expense"
          />
          <Stat
            icon={Wallet}
            label="Expected balance"
            value={fmt(forecast.expectedBalance)}
            tone={forecast.expectedBalance >= 0 ? 'income' : 'expense'}
          />
          <Stat
            icon={CalendarClock}
            label="Upcoming obligations"
            value={fmt(forecast.upcomingObligations)}
            tone="info"
          />
          <Stat
            icon={PiggyBank}
            label="Expected savings"
            value={fmt(forecast.expectedSavings)}
            tone={forecast.expectedSavings >= 0 ? 'income' : 'expense'}
          />
        </div>
        <p className="text-body-sm text-text-tertiary">
          Pace-based projection from the trailing 90 days, plus known recurring and EMI obligations
          this month.
        </p>
      </Card>

      <div className="grid gap-16 lg:grid-cols-2">
        <Card title="Cash flow · last 6 months">
          <div className="flex flex-wrap gap-16">
            <span className="inline-flex items-center gap-8 text-caption text-text-secondary">
              <span
                className="size-16 rounded-sm"
                style={{ backgroundColor: CHART_ACCENTS.income }}
              />
              Income
            </span>
            <span className="inline-flex items-center gap-8 text-caption text-text-secondary">
              <span
                className="size-16 rounded-sm"
                style={{ backgroundColor: CHART_ACCENTS.expense }}
              />
              Expense
            </span>
          </div>
          <BarChart
            groups={cashFlowGroups}
            ariaLabel="Monthly income and expense for the last six months"
          />
        </Card>

        <Card title="Net trend · last 6 months">
          <AreaChart
            points={cashFlow.map((m) => ({ label: m.label, value: m.net }))}
            color={CHART_ACCENTS.income}
            ariaLabel="Monthly net savings trend for the last six months"
          />
        </Card>
      </div>

      <div className="grid gap-16 lg:grid-cols-2">
        <Card title="Savings · last 6 months">
          {cashFlow.every((m) => m.income === 0 && m.expense === 0) ? (
            <p className="text-body-sm text-text-tertiary">No income or expenses recorded yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {[...cashFlow].reverse().map((m) => (
                <div key={m.key} className="flex items-center justify-between gap-8 py-8">
                  <span className="text-body-sm text-text-secondary">
                    {m.label} {m.year}
                  </span>
                  <span className="text-body-sm font-medium tabular-nums text-text-primary">
                    {fmt(m.net)}
                  </span>
                  <span
                    className={cn(
                      'w-48 text-right text-caption font-medium tabular-nums',
                      m.savingsRate === null
                        ? 'text-text-tertiary'
                        : m.savingsRate >= 0
                          ? 'text-income'
                          : 'text-expense'
                    )}
                  >
                    {m.savingsRate === null ? '—' : `${Math.round(m.savingsRate)}%`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Spending by category · this month">
          {categoryBreakdown.length === 0 ? (
            <p className="text-body-sm text-text-tertiary">No expenses this month yet.</p>
          ) : (
            <div className="flex flex-col items-center gap-16 sm:flex-row sm:items-start">
              <DonutChart
                segments={categoryBreakdown.map((c) => ({
                  label: c.name,
                  value: c.amount,
                  color: c.color,
                }))}
                centerLabel="Total"
                centerValue={fmt(categoryBreakdown.reduce((s, c) => s + c.amount, 0))}
                ariaLabel="Share of this month's expenses by category"
                className="shrink-0"
              />
              <ul className="flex min-w-0 flex-1 flex-col divide-y divide-border-subtle">
                {categoryBreakdown.map((c) => (
                  <li key={c.categoryId} className="flex items-center justify-between gap-8 py-8">
                    <span className="flex min-w-0 items-center gap-8">
                      <span
                        className="size-16 shrink-0 rounded-sm"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate text-body-sm text-text-secondary">{c.name}</span>
                    </span>
                    <span className="shrink-0 text-body-sm font-medium tabular-nums text-text-primary">
                      {fmt(c.amount)}
                    </span>
                    <span className="w-40 shrink-0 text-right text-caption tabular-nums text-text-tertiary">
                      {c.percent.toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-16 lg:grid-cols-2">
        <Card title="Budget health">
          {budgetAnalysis.length === 0 ? (
            <p className="text-body-sm text-text-tertiary">
              No active budgets yet. Set one up on the Budgets screen.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {budgetAnalysis.map((b) => {
                const barPercent = Math.min(100, b.percentUsed)
                return (
                  <div key={b.budgetId} className="flex flex-col gap-8 py-8">
                    <div className="flex items-center justify-between gap-8">
                      <span className="truncate text-body-sm font-medium text-text-primary">
                        {b.categoryName}
                      </span>
                      <SeverityPill severity={b.severity} />
                    </div>
                    <div className="flex items-center justify-between gap-8 text-caption tabular-nums text-text-secondary">
                      <span>
                        {fmt(b.spent)} of {fmt(b.allocated)}
                      </span>
                      <span>forecast {fmt(b.forecastEndOfPeriod)}</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          b.severity === 'over'
                            ? 'bg-expense'
                            : b.severity === 'warning'
                              ? 'bg-gold-500'
                              : 'bg-brand-teal400'
                        )}
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Loans">
          {loanAnalysis.loans.length === 0 ? (
            <p className="text-body-sm text-text-tertiary">
              No loans yet. Add one on the Loans screen.
            </p>
          ) : (
            <div className="flex flex-col gap-16">
              <div className="grid grid-cols-3 gap-8">
                <Stat
                  icon={Landmark}
                  label="Outstanding"
                  value={fmt(loanAnalysis.totalOutstanding)}
                />
                <Stat
                  icon={CalendarClock}
                  label="Monthly EMI"
                  value={fmt(loanAnalysis.totalMonthlyEMI)}
                />
                <Stat
                  icon={TrendingUp}
                  label="Active loans"
                  value={String(loanAnalysis.activeCount)}
                />
              </div>
              <div className="flex flex-col divide-y divide-border-subtle">
                {loanAnalysis.loans.map((l) => (
                  <div key={l.id} className="flex flex-col gap-8 py-8">
                    <div className="flex items-center justify-between gap-8">
                      <span className="truncate text-body-sm font-medium text-text-primary">
                        {l.name}
                      </span>
                      <span className="text-body-sm tabular-nums text-text-secondary">
                        {fmt(l.outstanding)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-8 text-caption text-text-tertiary">
                      <span>
                        {l.status === 'completed' ? 'Completed' : `${l.remainingEmis} EMIs left`}
                      </span>
                      <span>{l.progressPercent.toFixed(0)}% repaid</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-brand-teal700"
                        style={{ width: `${Math.min(100, l.progressPercent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Spending heatmap · last 16 weeks">
        <HeatMap weeks={heatmap.weeks} color={CHART_ACCENTS.expense} />
      </Card>

      <Card title="Year-over-year comparison">
        {!yoy.hasData ? (
          <p className="text-body-sm text-text-tertiary">
            Not enough history for a year-over-year comparison.
          </p>
        ) : (
          <div className="flex flex-col gap-16 lg:flex-row">
            <div className="min-w-0 flex-1">
              <h3 className="mb-8 text-body-sm font-medium text-text-secondary">Income</h3>
              <BarChart
                groups={yoyGroups('income', CHART_ACCENTS.income)}
                ariaLabel={`Monthly income ${yoy.lastYear} versus ${yoy.thisYear}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-8 text-body-sm font-medium text-text-secondary">Expense</h3>
              <BarChart
                groups={yoyGroups('expense', CHART_ACCENTS.expense)}
                ariaLabel={`Monthly expense ${yoy.lastYear} versus ${yoy.thisYear}`}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
