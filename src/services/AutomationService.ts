import { startOfStoredDate, inRange, localDateKey } from '@/utils/dates'
import { getCashFlowSeries } from '@/services/AnalyticsService'
import { getCategoryBreakdown } from '@/services/AnalyticsService'
import type {
  Transaction,
  RecurringRule,
  Loan,
  LoanPayment,
  Account,
  Category,
} from '@/types/entities'

export interface AutoDetection {
  type:
    | 'duplicate_subscription'
    | 'emi_increase'
    | 'salary_credited'
    | 'bill_due'
    | 'unusual_spending'
    | 'savings_opportunity'
  title: string
  description: string
  severity: 'info' | 'warning' | 'alert'
  action?: { label: string; path: string }
}

const DAY_MS = 24 * 60 * 60 * 1000

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function detectDuplicateSubscriptions(rules: RecurringRule[]): AutoDetection[] {
  const results: AutoDetection[] = []
  const expenseRules = rules.filter((r) => r.active && r.type === 'expense')

  for (let i = 0; i < expenseRules.length; i++) {
    for (let j = i + 1; j < expenseRules.length; j++) {
      const a = expenseRules[i]
      const b = expenseRules[j]
      if (a.categoryId !== b.categoryId) continue
      const diff = Math.abs(a.amount - b.amount)
      const avg = (a.amount + b.amount) / 2
      if (avg > 0 && diff / avg <= 0.1) {
        results.push({
          type: 'duplicate_subscription',
          title: 'Possible duplicate subscription',
          description: `"${a.title}" and "${b.title}" are both ${fmt(avg)}/mo in the same category. Check if one can be cancelled.`,
          severity: 'warning',
          action: { label: 'Review subscriptions', path: '/recurring' },
        })
      }
    }
  }
  return results.slice(0, 2)
}

function detectUnusualSpending(
  transactions: Transaction[],
  reference = new Date()
): AutoDetection[] {
  const now = startOfStoredDate(localDateKey(reference))
  const weekStart = new Date(now.getTime() - 7 * DAY_MS)

  const currentWeekExpense = transactions
    .filter(
      (t) =>
        !t.isDeleted &&
        t.type === 'expense' &&
        inRange(t.transactionDate, weekStart, now)
    )
    .reduce((s, t) => s + t.amount, 0)

  const fourWeekStart = new Date(now.getTime() - 28 * DAY_MS)
  const fourWeekExpenses = transactions
    .filter(
      (t) =>
        !t.isDeleted &&
        t.type === 'expense' &&
        inRange(t.transactionDate, fourWeekStart, weekStart)
    )
    .reduce((s, t) => s + t.amount, 0)

  const avgWeeklyExpense = fourWeekExpenses / 3
  if (avgWeeklyExpense <= 0) return []

  const increase = ((currentWeekExpense - avgWeeklyExpense) / avgWeeklyExpense) * 100
  if (increase > 50) {
    return [
      {
        type: 'unusual_spending',
        title: 'Unusual spending detected',
        description: `You spent ${fmt(currentWeekExpense)} this week vs ${fmt(avgWeeklyExpense)} weekly average — a ${Math.round(increase)}% increase.`,
        severity: 'warning',
        action: { label: 'View spending', path: '/transactions' },
      },
    ]
  }
  return []
}

function detectBillDueSoon(rules: RecurringRule[], reference = new Date()): AutoDetection[] {
  const now = startOfStoredDate(localDateKey(reference))
  const threeDaysFromNow = new Date(now.getTime() + 3 * DAY_MS)

  return rules
    .filter((r) => {
      if (!r.active) return false
      const next = new Date(r.nextExecution)
      return next.getTime() >= now.getTime() && next.getTime() <= threeDaysFromNow.getTime()
    })
    .slice(0, 2)
    .map((r) => ({
      type: 'bill_due' as const,
      title: 'Bill due soon',
      description: `"${r.title}" (${fmt(r.amount)}) is due on ${new Date(r.nextExecution).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`,
      severity: 'info' as const,
      action: { label: 'View recurring', path: '/recurring' },
    }))
}

function detectSavingsOpportunity(
  transactions: Transaction[],
  categories: Category[],
  reference = new Date()
): AutoDetection[] {
  const series = getCashFlowSeries(transactions, 3, reference)
  const current = series[series.length - 1]
  if (!current || current.income <= 0) return []

  const savingsRate =
    current.savingsRate !== null ? current.savingsRate : 0
  if (savingsRate >= 20) return []

  const breakdown = getCategoryBreakdown(transactions, categories, reference, 5)
  const topExpense = breakdown[0]
  if (!topExpense) return []

  const savingsGap = Math.round(current.income * 0.2 - (current.income - current.expense))
  const suggestion =
    savingsGap > 0
      ? `Your savings rate is ${savingsRate.toFixed(0)}% — below the recommended 20%. Cutting ${topExpense.name} by 15% (~${fmt(topExpense.amount * 0.15)}) could close the gap of ${fmt(savingsGap)}.`
      : `Your savings rate is ${savingsRate.toFixed(0)}%. Your top spend category is ${topExpense.name} at ${fmt(topExpense.amount)}.`

  return [
    {
      type: 'savings_opportunity',
      title: 'Savings opportunity',
      description: suggestion,
      severity: 'info',
      action: { label: 'View budgets', path: '/budgets' },
    },
  ]
}

function detectEmiIncrease(
  loans: Loan[],
  payments: LoanPayment[],
): AutoDetection[] {
  const results: AutoDetection[] = []

  for (const loan of loans) {
    if (loan.status !== 'active' || loan.currentBalance <= 0) continue
    const loanPayments = payments
      .filter((p) => p.loanId === loan.id && p.amountPaid > 0)
      .sort(
        (a, b) =>
          new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
      )

    if (loanPayments.length < 2) continue

    const lastPayment = loanPayments[loanPayments.length - 1]
    const historical = loanPayments.slice(0, -1)
    const avgHistorical =
      historical.reduce((s, p) => s + p.amountPaid, 0) / historical.length
    const pctIncrease =
      avgHistorical > 0
        ? ((lastPayment.amountPaid - avgHistorical) / avgHistorical) * 100
        : 0

    if (pctIncrease > 20) {
      results.push({
        type: 'emi_increase',
        title: `EMI increase for ${loan.loanName}`,
        description: `Last payment was ${fmt(lastPayment.amountPaid)} vs ${fmt(avgHistorical)} average — a ${Math.round(pctIncrease)}% increase. Check if interest rate changed.`,
        severity: 'warning',
        action: { label: 'View loans', path: '/loans' },
      })
    }
  }
  return results.slice(0, 1)
}

function detectSalaryCredited(
  transactions: Transaction[],
  reference = new Date()
): AutoDetection[] {
  const now = startOfStoredDate(localDateKey(reference))
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const recentIncome = transactions.filter(
    (t) =>
      !t.isDeleted &&
      t.type === 'income' &&
      t.amount > 5000 &&
      inRange(t.transactionDate, oneDayAgo, now)
  )

  if (recentIncome.length === 0) return []

  const total = recentIncome.reduce((s, t) => s + t.amount, 0)
  return [
    {
      type: 'salary_credited' as const,
      title: 'Salary credited',
      description: `${fmt(total)} in income was logged in the last 24 hours. Your financial snapshot is up to date.`,
      severity: 'info' as const,
    },
  ].slice(0, 1)
}

export function detectAll(params: {
  transactions: Transaction[]
  accounts: Account[]
  rules: RecurringRule[]
  loans: Loan[]
  payments: LoanPayment[]
  categories: Category[]
  reference?: Date
}): AutoDetection[] {
  const {
    transactions,
    rules,
    loans,
    payments,
    categories,
    reference = new Date(),
  } = params

  const results: AutoDetection[] = [
    ...detectSalaryCredited(transactions, reference),
    ...detectBillDueSoon(rules, reference),
    ...detectDuplicateSubscriptions(rules),
    ...detectUnusualSpending(transactions, reference),
    ...detectEmiIncrease(loans, payments),
    ...detectSavingsOpportunity(transactions, categories, reference),
  ]

  return results
}

export const AutomationService = {
  detectAll,
}
