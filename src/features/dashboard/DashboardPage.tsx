import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { LayoutDashboard, TrendingUp, TrendingDown, Wallet, Landmark } from 'lucide-react'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { useSettingsStore } from '@/app/settingsStore'
import { db } from '@/database/db'
import {
  computeMetrics,
  getRecentTransactions,
  getSpendingTimeline,
  getAlerts,
} from '@/services/DashboardService'
import { BudgetService, computeBudgetStatus } from '@/services/BudgetService'
import { getRecurringAlerts, getUpcomingObligations } from '@/services/RecurringService'
import { LoanService } from '@/services/LoanService'
import { GoalService } from '@/services/GoalService'
import { NotificationService } from '@/services/NotificationService'
import { BackupReminderService } from '@/services/BackupReminderService'
import { computeHealthScore } from '@/services/InsightService'
import { AutomationAlerts } from '@/features/automation/AutomationAlerts'
import { formatAmount, haveSameCurrency } from '@/utils/currency'
import { DashboardCard } from '@/components/finance/DashboardCard'
import { AccountCard } from '@/components/finance/AccountCard'
import { AlertCard } from '@/components/finance/AlertCard'
import { BudgetCard } from '@/components/finance/BudgetCard'
import { TransactionCard } from '@/features/transactions/TransactionCard'
import { GoalCard } from '@/components/finance/GoalCard'
import { ProgressRing } from '@/components/charts/ProgressRing'
import { SpendingTimeline } from './SpendingTimeline'
import { QuickAdd } from './QuickAdd'
import { WidgetCustomizer } from './WidgetCustomizer'
import { FinancialReplayPage } from '@/features/replay/FinancialReplayPage'
import { loadLayout, saveLayout, getVisibleWidgets, type DashboardLayout } from './widgetConfig'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SkeletonPage } from '@/components/common/Skeleton'
import { Button } from '@/components/ui/button'
import { useGreeting } from '@/hooks/useGreeting'
import type { Category, LoanPayment } from '@/types/entities'

function scoreTone(score: number): 'poor' | 'fair' | 'good' {
  if (score >= 70) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}

const TONE_RING_COLOR: Record<'poor' | 'fair' | 'good', string> = {
  poor: '#D9534F',
  fair: '#D9A441',
  good: '#62C3A7',
}

const TONE_RING_TRACK: Record<'poor' | 'fair' | 'good', string> = {
  poor: 'rgba(217, 83, 79, 0.15)',
  fair: 'rgba(217, 164, 65, 0.15)',
  good: 'rgba(98, 195, 167, 0.15)',
}

const TONE_LABEL: Record<'poor' | 'fair' | 'good', string> = {
  poor: 'Needs attention',
  fair: 'On the way',
  good: 'Healthy',
}

export function DashboardPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const txIsLoading = useTransactionsStore((s) => s.isLoading)
  const load = useTransactionsStore((s) => s.load)
  const openAddSheet = useTransactionsStore((s) => s.openAddSheet)
  const openEditSheet = useTransactionsStore((s) => s.openEditSheet)
  const deleteTransaction = useTransactionsStore((s) => s.deleteTransaction)
  const duplicateTransaction = useTransactionsStore((s) => s.duplicateTransaction)
  const settings = useSettingsStore((s) => s.settings)
  const settingsError = useSettingsStore((s) => s.isError)
  const accounts = useAccountsStore((s) => s.accounts)
  const acctIsLoading = useAccountsStore((s) => s.isLoading)
  const loadAccounts = useAccountsStore((s) => s.load)
  const budgets = useBudgetsStore((s) => s.budgets)
  const loadBudgets = useBudgetsStore((s) => s.load)
  const recurringRules = useRecurringStore((s) => s.rules)
  const loadRecurring = useRecurringStore((s) => s.load)
  const loans = useLoansStore((s) => s.loans)
  const loanPayments = useLoansStore((s) => s.payments)
  const loadLoans = useLoansStore((s) => s.load)
  const goals = useGoalsStore((s) => s.goals)
  const loadGoals = useGoalsStore((s) => s.load)
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [layout, setLayout] = useState<DashboardLayout>(loadLayout)
  const greeting = useGreeting()
  const alertsGenerated = useRef(false)

  function handleLayoutChange(next: DashboardLayout) {
    setLayout(next)
    saveLayout(next)
  }

  const visibleWidgets = getVisibleWidgets(layout)

  useEffect(() => {
    load()
    loadAccounts()
    loadBudgets()
    loadRecurring()
    loadLoans()
    loadGoals()
    db.categories.toArray().then(setCategories)
  }, [load, loadAccounts, loadBudgets, loadRecurring, loadLoans, loadGoals])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const budgetMonthStart = settings?.budgetMonthStart ?? 1

  useEffect(() => {
    if (alertsGenerated.current) return
    if (txIsLoading || acctIsLoading || !settings) return
    if (transactions.length === 0) return

    alertsGenerated.current = true
    NotificationService.generateAlerts(
      transactions,
      budgets,
      recurringRules,
      loans,
      loanPayments,
      categories,
      budgetMonthStart
    )
  }, [
    txIsLoading,
    acctIsLoading,
    settings,
    transactions,
    budgets,
    recurringRules,
    loans,
    loanPayments,
    categories,
    budgetMonthStart,
  ])

  const metrics = useMemo(
    () => computeMetrics(transactions, accounts, budgetMonthStart),
    [transactions, accounts, budgetMonthStart]
  )
  const recent = useMemo(() => getRecentTransactions(transactions, 5), [transactions])
  const timeline = useMemo(() => getSpendingTimeline(transactions, 7), [transactions])
  const budgetStatuses = useMemo(
    () => budgets.map((b) => computeBudgetStatus(b, transactions, budgetMonthStart)),
    [budgets, transactions, budgetMonthStart]
  )
  const obligations = useMemo(() => getUpcomingObligations(recurringRules), [recurringRules])
  const recurringAlerts = useMemo(
    () => getRecurringAlerts(recurringRules, transactions),
    [recurringRules, transactions]
  )
  const loanPaymentsByLoan = useMemo(() => {
    const map: Record<string, LoanPayment[]> = {}
    for (const p of loanPayments) {
      const list = map[p.loanId] ?? []
      list.push(p)
      map[p.loanId] = list
    }
    return map
  }, [loanPayments])
  const loanAlerts = useMemo(
    () => LoanService.getAlerts(loans, loanPaymentsByLoan),
    [loans, loanPaymentsByLoan]
  )
  const alerts = useMemo(
    () => [
      ...getAlerts(accounts),
      ...BudgetService.getAlerts(budgetStatuses, categories),
      ...recurringAlerts,
      ...loanAlerts,
      ...(settings ? BackupReminderService.getBackupAlert(settings) : []),
    ],
    [accounts, budgetStatuses, categories, recurringAlerts, loanAlerts, settings]
  )

  const healthScore = useMemo(
    () =>
      computeHealthScore(
        transactions,
        accounts,
        budgets,
        loans,
        loanPayments,
        recurringRules,
        budgetMonthStart
      ),
    [transactions, accounts, budgets, loans, loanPayments, recurringRules, budgetMonthStart]
  )

  const heroData = useMemo(() => {
    const activeAccounts = accounts.filter((a) => !a.isArchived)
    const assetTotal = activeAccounts.reduce((s, a) => s + Math.max(0, a.currentBalance), 0)
    const loanTotal = loans
      .filter((l) => l.status === 'active')
      .reduce((s, l) => s + l.currentBalance, 0)
    const netWorth = assetTotal - loanTotal
    const netWorthCurrency = activeAccounts[0]?.currency ?? 'INR'
    const savingsRate =
      metrics.monthIncome > 0
        ? ((metrics.monthIncome - metrics.monthExpense) / metrics.monthIncome) * 100
        : 0
    return { netWorth, netWorthCurrency, savingsRate, assetTotal, loanTotal }
  }, [accounts, loans, metrics.monthIncome, metrics.monthExpense])

  const incomeExpenseData = useMemo(() => {
    const incomeMax = Math.max(metrics.monthIncome, 1)
    const expenseMax = Math.max(metrics.monthExpense, 1)
    const scale = Math.max(incomeMax, expenseMax)
    return {
      scale,
      incomePct: Math.round((metrics.monthIncome / scale) * 100),
      expensePct: Math.round((metrics.monthExpense / scale) * 100),
    }
  }, [metrics.monthIncome, metrics.monthExpense])

  const healthTone = scoreTone(healthScore.score)

  if (settingsError) {
    return (
      <ErrorState
        message="Unable to load your settings. Please check that your browser supports IndexedDB and try again."
        onRetry={() => {
          const loadSettings = useSettingsStore.getState().load
          void loadSettings()
        }}
      />
    )
  }

  if (txIsLoading || acctIsLoading || !settings) {
    return <SkeletonPage sections={3} />
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="No activity yet"
        description="Your dashboard will come alive with balances, budgets, and insights as you start logging transactions."
        actionLabel="Add your first transaction"
        onAction={openAddSheet}
      />
    )
  }

  return (
    <div className="flex flex-col gap-24 p-16 md:p-24">
      <div className="flex items-center justify-between gap-16">
        <div>
          <p className="text-caption font-medium text-text-tertiary uppercase tracking-wider">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="font-heading text-h1 font-bold text-text-primary tracking-tight mt-2">
            {greeting}
          </h1>
          <p className="text-body-sm text-text-secondary mt-4">Here is your financial summary.</p>
        </div>
        <WidgetCustomizer layout={layout} onLayoutChange={handleLayoutChange} />
      </div>

      {visibleWidgets.has('alerts') && alerts.length > 0 && (
        <div className="flex flex-col gap-6">
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      )}

      <AutomationAlerts limit={3} />

      <section className="card-hero p-20 md:p-28">
        <div className="flex flex-col gap-20 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-8">
            <p className="text-caption font-medium text-brand-teal200 uppercase tracking-wider">
              Total Net Worth
            </p>
            <p className="text-display font-bold text-white tabular-nums tracking-tight">
              {heroData.netWorth < 0 ? '\u2212' : ''}
              {formatAmount(Math.abs(heroData.netWorth), heroData.netWorthCurrency)}
            </p>
            <div className="flex items-center gap-8 mt-4">
              <span className="inline-flex items-center gap-4 rounded-full bg-brand-teal400/20 px-10 py-4 text-caption font-semibold text-brand-teal400">
                <TrendingUp className="size-12" aria-hidden="true" />
                {heroData.savingsRate >= 0 ? '+' : ''}
                {heroData.savingsRate.toFixed(1)}% saved this month
              </span>
            </div>
          </div>

          <div className="flex items-center gap-32">
            <ProgressRing
              value={healthScore.score}
              size={120}
              strokeWidth={10}
              color={TONE_RING_COLOR[healthTone]}
              trackColor={TONE_RING_TRACK[healthTone]}
              label={String(healthScore.score)}
              sublabel="Health"
            />
            <div className="flex flex-col gap-4">
              <span className="text-caption font-medium text-brand-teal200 uppercase tracking-wider">
                {TONE_LABEL[healthTone]}
              </span>
              <p className="text-body-sm text-brand-teal100 max-w-[200px]">
                {healthScore.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      </section>

      {visibleWidgets.has('quick-add') && <QuickAdd />}

      {visibleWidgets.has('metrics') && (
        <DashboardCard title="Income vs Expense">
          <div className="flex flex-col gap-16">
            <div className="flex items-center gap-12">
              <span className="flex items-center gap-8 w-[120px] shrink-0">
                <span className="flex size-24 items-center justify-center rounded-lg bg-income-subtle text-income">
                  <TrendingUp className="size-14" aria-hidden="true" />
                </span>
                <span className="text-body-sm font-medium text-text-secondary">Income</span>
              </span>
              <div className="flex-1 h-24 overflow-hidden rounded-full bg-border-subtle dark:bg-surface-raised">
                <div
                  className="h-full rounded-full bg-income transition-all duration-slow"
                  style={{ width: `${Math.max(incomeExpenseData.incomePct, 4)}%` }}
                />
              </div>
              <span className="w-[100px] shrink-0 text-right tabular-nums text-body font-semibold text-income">
                {formatAmount(metrics.monthIncome, 'INR')}
              </span>
            </div>

            <div className="flex items-center gap-12">
              <span className="flex items-center gap-8 w-[120px] shrink-0">
                <span className="flex size-24 items-center justify-center rounded-lg bg-expense-subtle text-expense">
                  <TrendingDown className="size-14" aria-hidden="true" />
                </span>
                <span className="text-body-sm font-medium text-text-secondary">Expense</span>
              </span>
              <div className="flex-1 h-24 overflow-hidden rounded-full bg-border-subtle dark:bg-surface-raised">
                <div
                  className="h-full rounded-full bg-expense transition-all duration-slow"
                  style={{ width: `${Math.max(incomeExpenseData.expensePct, 4)}%` }}
                />
              </div>
              <span className="w-[100px] shrink-0 text-right tabular-nums text-body font-semibold text-expense">
                {metrics.monthExpense > 0 ? '\u2212' : ''}
                {formatAmount(metrics.monthExpense, 'INR')}
              </span>
            </div>

            <div className="flex items-center justify-between mt-8 border-t border-border pt-12">
              <div className="flex items-center gap-4">
                <Wallet className="size-14 text-text-tertiary" aria-hidden="true" />
                <span className="text-body-sm text-text-secondary">Balance</span>
              </div>
              <div className="flex items-center gap-12">
                <span className="tabular-nums text-body font-semibold text-text-primary">
                  {formatAmount(metrics.totalBalance, 'INR')}
                </span>
                <span
                  className={`tabular-nums text-body font-bold ${metrics.netSavings >= 0 ? 'text-income' : 'text-expense'}`}
                >
                  {metrics.netSavings >= 0 ? '+' : '\u2212'}
                  {formatAmount(Math.abs(metrics.netSavings), 'INR')}
                </span>
              </div>
            </div>
          </div>
        </DashboardCard>
      )}

      {visibleWidgets.has('spending-timeline') && (
        <DashboardCard title="Last 7 Days">
          <SpendingTimeline days={timeline} />
        </DashboardCard>
      )}

      {visibleWidgets.has('upcoming-payments') && (
        <DashboardCard
          title="Upcoming Payments"
          action={
            recurringRules.length > 0 && (
              <Button variant="tertiary" size="sm" onClick={() => navigate('/recurring')}>
                See all
              </Button>
            )
          }
        >
          {obligations.length === 0 ? (
            <p className="text-body-sm text-text-secondary py-8">
              No recurring payments due in the next month.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
              {obligations.slice(0, 5).map((o) => (
                <div key={o.ruleId} className="flex items-center justify-between gap-8 px-16 py-14">
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-text-primary">{o.title}</p>
                    <p className="text-caption text-text-tertiary mt-1">
                      {format(o.date, 'd MMM yyyy')}
                    </p>
                  </div>
                  <span
                    className={
                      o.type === 'income'
                        ? 'shrink-0 tabular-nums text-body font-bold text-income'
                        : 'shrink-0 tabular-nums text-body font-bold text-expense'
                    }
                  >
                    {o.type === 'income' ? '+' : '\u2212'}\u20B9
                    {o.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      )}

      {visibleWidgets.has('budgets') && (
        <DashboardCard
          title="Budgets"
          action={
            budgetStatuses.length > 0 && (
              <Button variant="tertiary" size="sm" onClick={() => navigate('/budgets')}>
                See all
              </Button>
            )
          }
        >
          {budgetStatuses.length === 0 ? (
            <p className="text-body-sm text-text-secondary py-8">
              Set up a budget to see how you&rsquo;re tracking here.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {budgetStatuses.slice(0, 3).map((status) => (
                <BudgetCard
                  key={status.budget.id}
                  status={status}
                  category={categoryById.get(status.budget.categoryId)}
                />
              ))}
            </div>
          )}
        </DashboardCard>
      )}

      {visibleWidgets.has('goals') && (
        <DashboardCard
          title="Goals"
          action={
            goals.length > 0 && (
              <Button variant="tertiary" size="sm" onClick={() => navigate('/goals')}>
                See all
              </Button>
            )
          }
        >
          {goals.filter((g) => g.status === 'active').length === 0 ? (
            <p className="text-body-sm text-text-secondary py-8">
              Set a savings or purchase goal to track your progress.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {goals
                .filter((g) => g.status === 'active')
                .slice(0, 3)
                .map((goal) => (
                  <GoalCard
                    key={goal.id}
                    progress={GoalService.computeProgress(goal)}
                    compact
                    onClick={() => navigate(`/goals/${goal.id}`)}
                  />
                ))}
            </div>
          )}
        </DashboardCard>
      )}

      {visibleWidgets.has('recent-activity') && (
        <DashboardCard title="Recent Activity">
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
            {recent.map((t) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                category={categoryById.get(t.categoryId)}
                onDelete={() => deleteTransaction(t)}
                onEdit={() => openEditSheet(t)}
                onDuplicate={() => duplicateTransaction(t)}
              />
            ))}
          </div>
        </DashboardCard>
      )}

      {visibleWidgets.has('accounts') && (
        <DashboardCard title="Account Balances">
          <div className="flex flex-col gap-6">
            {accounts.map((a) => (
              <AccountCard key={a.id} account={a} onClick={() => navigate(`/accounts/${a.id}`)} />
            ))}
          </div>
        </DashboardCard>
      )}

      {visibleWidgets.has('loans') && (
        <DashboardCard
          title="Loans"
          action={
            loans.length > 0 && (
              <Button variant="tertiary" size="sm" onClick={() => navigate('/loans')}>
                See all
              </Button>
            )
          }
        >
          {loans.length === 0 ? (
            <p className="flex items-center gap-8 text-body-sm text-text-secondary py-8">
              <Landmark className="size-16 shrink-0" aria-hidden="true" />
              Track home, car, and personal loans &mdash; add one to start tracking.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
              {loans.slice(0, 5).map((loan) => (
                <button
                  key={loan.id}
                  onClick={() => navigate('/loans')}
                  className="flex items-center justify-between gap-8 px-16 py-14 text-left hover:bg-surface transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-text-primary">
                      {loan.loanName}
                    </p>
                    <p className="text-caption text-text-tertiary mt-1">
                      {loan.status === 'completed'
                        ? 'Paid off'
                        : `${loan.monthlyEMI.toLocaleString('en-IN')} EMI/mo`}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums text-body font-bold text-liability">
                    \u20B9{loan.currentBalance.toLocaleString('en-IN')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DashboardCard>
      )}

      {visibleWidgets.has('net-worth') && (
        <DashboardCard title="Asset Breakdown">
          <div className="flex flex-col gap-8">
            {(() => {
              const activeAccounts = accounts.filter((a) => !a.isArchived)
              const currencies = activeAccounts.map((a) => a.currency)
              const mixedCurrencies = !haveSameCurrency(currencies)

              if (mixedCurrencies) {
                const totalsByCurrency = new Map<string, number>()
                for (const a of activeAccounts) {
                  totalsByCurrency.set(
                    a.currency,
                    (totalsByCurrency.get(a.currency) ?? 0) + Math.max(0, a.currentBalance)
                  )
                }
                return (
                  <>
                    <p className="text-body-sm text-text-secondary">
                      Your accounts use different currencies, so a single net worth number
                      wouldn&rsquo;t be meaningful &mdash; shown separately instead.
                    </p>
                    {[...totalsByCurrency.entries()].map(([currency, total]) => (
                      <div key={currency} className="flex items-center justify-between">
                        <span className="text-body-sm text-text-secondary">{currency}</span>
                        <span className="tabular-nums text-body font-semibold text-text-primary">
                          {formatAmount(total, currency)}
                        </span>
                      </div>
                    ))}
                  </>
                )
              }

              const netWorthCurrency = currencies[0] ?? 'INR'
              const assetTotal = activeAccounts.reduce(
                (s, a) => s + Math.max(0, a.currentBalance),
                0
              )
              const loanTotal = loans
                .filter((l) => l.status === 'active')
                .reduce((s, l) => s + l.currentBalance, 0)
              const netWorth = assetTotal - loanTotal
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-text-secondary">Total Assets</span>
                    <span className="tabular-nums text-body font-semibold text-income">
                      {formatAmount(assetTotal, netWorthCurrency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-text-secondary">Total Liabilities</span>
                    <span className="tabular-nums text-body font-semibold text-expense">
                      {formatAmount(loanTotal, netWorthCurrency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-8 mt-8">
                    <span className="text-body font-semibold text-text-primary">Net Worth</span>
                    <span
                      className={`tabular-nums text-body-lg font-bold ${netWorth >= 0 ? 'text-income' : 'text-expense'}`}
                    >
                      {formatAmount(netWorth, netWorthCurrency)}
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
        </DashboardCard>
      )}

      {visibleWidgets.has('replay') && (
        <DashboardCard title="Monthly Recap">
          <FinancialReplayPage embedded />
        </DashboardCard>
      )}
    </div>
  )
}
