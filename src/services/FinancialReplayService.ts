import { startOfStoredDate, localDateKey } from '@/utils/dates'
import type { Transaction, Account, Goal, GoalContribution } from '@/types/entities'

export interface MonthlyReplay {
  /** Year-month key, e.g. "2026-08" */
  period: string
  /** Human-readable label, e.g. "August 2026" */
  label: string

  /** Top-line metrics */
  income: number
  expense: number
  netCashFlow: number
  transactionCount: number
  savingsRate: number

  /** Wins — positive events from the month */
  wins: ReplayWin[]

  /** Risks — concerns or alerts */
  risks: ReplayRisk[]

  /** Milestones — goals reached, budget targets hit */
  milestones: ReplayMilestone[]

  /** Suggestions — actionable advice based on data */
  suggestions: string[]

  /** Month-over-month changes */
  incomeChange: number | null
  expenseChange: number | null
}

export interface ReplayWin {
  title: string
  detail: string
}

export interface ReplayRisk {
  title: string
  detail: string
  severity: 'low' | 'medium' | 'high'
}

export interface ReplayMilestone {
  title: string
  detail: string
}

function monthlyTransactions(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  const ref = new Date(year, month, 1)
  const next = new Date(year, month + 1, 1)
  return transactions.filter((t) => {
    if (t.isDeleted) return false
    const d = startOfStoredDate(t.transactionDate)
    return d >= ref && d < next
  })
}

export const FinancialReplayService = {
  /** Generate a monthly financial recap for the given year and month (1-indexed). */
  generate(
    year: number,
    month: number,
    transactions: Transaction[],
    accounts: Account[],
    goals: Goal[],
    contributions: Record<string, GoalContribution[]>,
    prevTransactions: Transaction[]
  ): MonthlyReplay {
    const pad = (n: number) => String(n).padStart(2, '0')
    const period = `${year}-${pad(month)}`
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    const label = `${monthNames[month - 1]} ${year}`

    const txns = monthlyTransactions(transactions, year, month - 1)
    const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const netCashFlow = income - expense
    const transactionCount = txns.length
    const savingsRate = income > 0 ? Math.round((netCashFlow / income) * 100) : 0

    const prevTxns = monthlyTransactions(prevTransactions, year, month - 2)
    const prevIncome = prevTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const prevExpense = prevTxns
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)

    const incomeChange =
      prevIncome > 0 ? Math.round(((income - prevIncome) / prevIncome) * 100) : null
    const expenseChange =
      prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : null

    // Wins
    const wins: ReplayWin[] = []
    if (netCashFlow > 0) {
      wins.push({
        title: 'Positive cash flow',
        detail: 'You earned more than you spent this month.',
      })
    }
    if (savingsRate >= 20 && income > 0) {
      wins.push({
        title: 'Strong savings rate',
        detail: `Saved ${savingsRate}% of your income — excellent discipline.`,
      })
    }
    if (expense < prevExpense && prevExpense > 0) {
      const pct = Math.round(((prevExpense - expense) / prevExpense) * 100)
      wins.push({
        title: 'Reduced spending',
        detail: `Spent ${pct}% less than the previous month.`,
      })
    }
    if (transactionCount >= 10) {
      wins.push({
        title: 'Active tracking',
        detail: `Logged ${transactionCount} transactions — diligent record-keeping.`,
      })
    }

    // Risks
    const risks: ReplayRisk[] = []
    if (netCashFlow < 0 && expense > 0) {
      risks.push({
        title: 'Negative cash flow',
        detail: 'Spending exceeded income this month.',
        severity: 'high',
      })
    }
    if (expense > prevExpense * 1.5 && prevExpense > 0) {
      risks.push({
        title: 'Spending spike',
        detail: 'Expenses jumped significantly compared to last month.',
        severity: 'medium',
      })
    }
    if (income > 0 && expense / income > 0.9) {
      risks.push({
        title: 'Low savings margin',
        detail: 'Over 90% of income was spent — leave room for emergencies.',
        severity: 'medium',
      })
    }
    if (transactionCount < 3 && (income > 0 || expense > 0)) {
      risks.push({
        title: 'Light tracking',
        detail: 'Only a few entries logged — make sure nothing is missed.',
        severity: 'low',
      })
    }

    // Milestones
    const milestones: ReplayMilestone[] = []
    const startOfMonth = new Date(year, month - 1, 1)
    for (const g of goals.filter((g) => g.status === 'active')) {
      const contribs = contributions[g.id] ?? []
      const thisMonth = contribs.filter((c) => {
        const d = new Date(c.createdAt)
        return d >= startOfMonth && d < new Date(year, month, 1)
      })
      const totalThisMonth = thisMonth.reduce((s, c) => s + c.amount, 0)
      if (totalThisMonth > 0) {
        const pct = Math.round((g.currentAmount / g.targetAmount) * 100)
        if (pct >= 90) {
          milestones.push({
            title: `Almost there: ${g.name}`,
            detail: `${pct}% complete — ₹${Math.round(g.targetAmount - g.currentAmount).toLocaleString('en-IN')} to go.`,
          })
        }
      }
    }
    const netWorth = accounts
      .filter((a) => !a.isArchived)
      .reduce((s, a) => s + Math.max(0, a.currentBalance), 0)
    if (netWorth > 0) {
      milestones.push({
        title: 'Overall net worth',
        detail: `₹${Math.round(netWorth).toLocaleString('en-IN')} across ${accounts.filter((a) => !a.isArchived).length} accounts.`,
      })
    }

    // Suggestions
    const suggestions: string[] = []
    if (netCashFlow > 0) {
      suggestions.push('Allocate surplus to your highest-priority goal.')
    }
    if (expense / Math.max(1, income) > 0.8) {
      suggestions.push('Review discretionary spending for savings opportunities.')
    }
    if (goals.filter((g) => g.status === 'active').length > 0) {
      const active = goals.filter((g) => g.status === 'active')
      const lowest = active.reduce(
        (best, g) =>
          g.currentAmount / g.targetAmount < best.currentAmount / best.targetAmount ? g : best,
        active[0]
      )
      suggestions.push(`Boost contributions to "${lowest.name}" — it needs the most progress.`)
    }
    if (transactionCount < 5) {
      suggestions.push('Log more transactions this month for better insights.')
    }

    return {
      period,
      label,
      income,
      expense,
      netCashFlow,
      transactionCount,
      savingsRate,
      wins,
      risks,
      milestones,
      suggestions,
      incomeChange,
      expenseChange,
    }
  },

  /** List available months that have transaction data. */
  availableMonths(transactions: Transaction[]): { year: number; month: number; label: string }[] {
    const months = new Set<string>()
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    for (const t of transactions) {
      if (t.isDeleted) continue
      const d = startOfStoredDate(t.transactionDate)
      months.add(localDateKey(d).slice(0, 7))
    }
    return [...months]
      .sort()
      .reverse()
      .map((m) => {
        const [y, mo] = m.split('-').map(Number)
        return { year: y, month: mo, label: `${monthNames[mo - 1]} ${y}` }
      })
  },
}
