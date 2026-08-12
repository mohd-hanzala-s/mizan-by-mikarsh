import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useBillSplitsStore } from '@/features/billsplit/billSplitsStore'
import { useSettingsStore } from '@/app/settingsStore'
import { db } from '@/database/db'
import { computeMetrics, getRecentTransactions } from '@/services/DashboardService'
import { computeBudgetStatus } from '@/services/BudgetService'
import { getUpcomingObligations } from '@/services/RecurringService'
import { formatAmount } from '@/utils/currency'
import { DashboardCard } from '@/components/finance/DashboardCard'
import { AccountCard } from '@/components/finance/AccountCard'
import { BudgetCard } from '@/components/finance/BudgetCard'
import { TransactionCard } from '@/features/transactions/TransactionCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonPage } from '@/components/common/Skeleton'
import type { Category } from '@/types/entities'

export function MoneyHubPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const txIsLoading = useTransactionsStore((s) => s.isLoading)
  const loadTx = useTransactionsStore((s) => s.load)
  const openAddSheet = useTransactionsStore((s) => s.openAddSheet)
  const openEditSheet = useTransactionsStore((s) => s.openEditSheet)
  const deleteTransaction = useTransactionsStore((s) => s.deleteTransaction)
  const duplicateTransaction = useTransactionsStore((s) => s.duplicateTransaction)
  const accounts = useAccountsStore((s) => s.accounts)
  const acctIsLoading = useAccountsStore((s) => s.isLoading)
  const loadAccts = useAccountsStore((s) => s.load)
  const budgets = useBudgetsStore((s) => s.budgets)
  const loadBudgets = useBudgetsStore((s) => s.load)
  const recurringRules = useRecurringStore((s) => s.rules)
  const loadRecurring = useRecurringStore((s) => s.load)
  const loans = useLoansStore((s) => s.loans)
  const loadLoans = useLoansStore((s) => s.load)
  const splits = useBillSplitsStore((s) => s.splits)
  const loadSplits = useBillSplitsStore((s) => s.load)
  const settings = useSettingsStore((s) => s.settings)
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    loadTx()
    loadAccts()
    loadBudgets()
    loadRecurring()
    loadLoans()
    loadSplits()
    db.categories.toArray().then(setCategories)
  }, [loadTx, loadAccts, loadBudgets, loadRecurring, loadLoans, loadSplits])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const budgetMonthStart = settings?.budgetMonthStart ?? 1

  const metrics = useMemo(
    () => computeMetrics(transactions, accounts, budgetMonthStart),
    [transactions, accounts, budgetMonthStart]
  )
  const recent = useMemo(() => getRecentTransactions(transactions, 5), [transactions])
  const budgetStatuses = useMemo(
    () => budgets.map((b) => computeBudgetStatus(b, transactions, budgetMonthStart)),
    [budgets, transactions, budgetMonthStart]
  )
  const obligations = useMemo(
    () => getUpcomingObligations(recurringRules, 30),
    [recurringRules]
  )
  const incomeExpenseScale = Math.max(metrics.monthIncome, metrics.monthExpense, 1)

  if (txIsLoading || acctIsLoading || !settings) {
    return <SkeletonPage sections={3} />
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Start logging transactions to see your money overview here."
        actionLabel="Add your first transaction"
        onAction={openAddSheet}
      />
    )
  }

  return (
    <div className="flex flex-col gap-20 p-16 md:p-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-h2 font-bold text-text-primary tracking-tight">Money</h1>
          <p className="text-body-sm text-text-tertiary mt-4">Financial operations hub</p>
        </div>
        <Button variant="accent" size="sm" onClick={openAddSheet}>
          <Plus className="size-16" aria-hidden="true" />
          Add Transaction
        </Button>
      </div>

      <section className="card flex flex-col gap-16 p-20">
        <h2 className="text-overline font-bold tracking-wider text-text-tertiary uppercase">
          Cash Flow This Month
        </h2>
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-12">
            <span className="flex size-32 items-center justify-center rounded-lg bg-income-subtle text-income">
              <TrendingUp className="size-16" aria-hidden="true" />
            </span>
            <span className="text-body-sm font-medium text-text-secondary w-[80px]">Income</span>
            <div className="flex-1 h-24 overflow-hidden rounded-full bg-border-subtle dark:bg-surface-raised">
              <div
                className="h-full rounded-full bg-income transition-all duration-slow"
                style={{ width: `${Math.max((metrics.monthIncome / incomeExpenseScale) * 100, 4)}%` }}
              />
            </div>
            <span className="w-[120px] shrink-0 text-right tabular-nums text-body font-semibold text-income">
              {formatAmount(metrics.monthIncome, 'INR')}
            </span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex size-32 items-center justify-center rounded-lg bg-expense-subtle text-expense">
              <TrendingDown className="size-16" aria-hidden="true" />
            </span>
            <span className="text-body-sm font-medium text-text-secondary w-[80px]">Expense</span>
            <div className="flex-1 h-24 overflow-hidden rounded-full bg-border-subtle dark:bg-surface-raised">
              <div
                className="h-full rounded-full bg-expense transition-all duration-slow"
                style={{ width: `${Math.max((metrics.monthExpense / incomeExpenseScale) * 100, 4)}%` }}
              />
            </div>
            <span className="w-[120px] shrink-0 text-right tabular-nums text-body font-semibold text-expense">
              {formatAmount(metrics.monthExpense, 'INR')}
            </span>
          </div>
          <div className="flex items-center justify-between mt-8 border-t border-border pt-12">
            <span className="text-body-sm font-medium text-text-secondary">Net Savings</span>
            <span className={`tabular-nums text-body font-bold ${metrics.netSavings >= 0 ? 'text-income' : 'text-expense'}`}>
              {metrics.netSavings >= 0 ? '+' : '\u2212'}
              {formatAmount(Math.abs(metrics.netSavings), 'INR')}
            </span>
          </div>
        </div>
      </section>

      <DashboardCard
        title="Recent Transactions"
        action={
          <Button variant="tertiary" size="sm" onClick={() => navigate('/transactions')}>
            View All <ArrowRight className="size-14" aria-hidden="true" />
          </Button>
        }
      >
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

      <DashboardCard
        title="Accounts"
        action={
          accounts.length > 0 && (
            <Button variant="tertiary" size="sm" onClick={() => navigate('/accounts')}>
              View All <ArrowRight className="size-14" aria-hidden="true" />
            </Button>
          )
        }
      >
        {accounts.length === 0 ? (
          <p className="text-body-sm text-text-secondary py-8">Add an account to see balances here.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {accounts.slice(0, 4).map((a) => (
              <AccountCard key={a.id} account={a} onClick={() => navigate(`/accounts/${a.id}`)} />
            ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        title="Budgets"
        action={
          budgetStatuses.length > 0 && (
            <Button variant="tertiary" size="sm" onClick={() => navigate('/budgets')}>
              View All <ArrowRight className="size-14" aria-hidden="true" />
            </Button>
          )
        }
      >
        {budgetStatuses.length === 0 ? (
          <p className="text-body-sm text-text-secondary py-8">Set up a budget to track spending limits.</p>
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

      <DashboardCard
        title="Upcoming Payments"
        action={
          recurringRules.length > 0 && (
            <Button variant="tertiary" size="sm" onClick={() => navigate('/recurring')}>
              View All <ArrowRight className="size-14" aria-hidden="true" />
            </Button>
          )
        }
      >
        {obligations.length === 0 ? (
          <p className="text-body-sm text-text-secondary py-8">No payments due in the next 30 days.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
            {obligations.slice(0, 5).map((o) => (
              <div key={o.ruleId} className="flex items-center justify-between gap-8 px-16 py-14">
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-text-primary">{o.title}</p>
                  <p className="text-caption text-text-tertiary mt-1">{o.type === 'income' ? 'Incoming' : 'Due'} {o.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className={`shrink-0 tabular-nums text-body font-bold ${o.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  {o.type === 'income' ? '+' : '\u2212'}\u20B9{o.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </DashboardCard>

      {loans.length > 0 && (
        <DashboardCard
          title="Loans"
          action={
            <Button variant="tertiary" size="sm" onClick={() => navigate('/loans')}>
              View All <ArrowRight className="size-14" aria-hidden="true" />
            </Button>
          }
        >
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
            {loans.filter((l) => l.status === 'active').slice(0, 5).map((loan) => (
              <button
                key={loan.id}
                onClick={() => navigate('/loans')}
                className="flex items-center justify-between gap-8 px-16 py-14 text-left hover:bg-surface transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-text-primary">{loan.loanName}</p>
                  <p className="text-caption text-text-tertiary mt-1">
                    {loan.status === 'completed' ? 'Paid off' : `${loan.monthlyEMI.toLocaleString('en-IN')} EMI/mo`}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-body font-bold text-liability">
                  {formatAmount(loan.currentBalance)}
                </span>
              </button>
            ))}
          </div>
        </DashboardCard>
      )}

      {splits.length > 0 && (
        <DashboardCard
          title="Bill Splits"
          action={
            <Button variant="tertiary" size="sm" onClick={() => navigate('/bill-splits')}>
              View All <ArrowRight className="size-14" aria-hidden="true" />
            </Button>
          }
        >
          <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
            {splits.slice(0, 5).map((split) => (
              <div key={split.id} className="flex items-center justify-between gap-8 px-16 py-14">
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-text-primary">{split.description}</p>
                  <p className="text-caption text-text-tertiary mt-1">{split.participants.length} participants</p>
                </div>
                <span className="shrink-0 tabular-nums text-body font-bold text-text-primary">
                  {formatAmount(split.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  )
}
