import { inRange, startOfStoredDate } from '@/utils/dates'
import { addDays, startOfDay, startOfWeek } from 'date-fns'
import { computeBudgetStatus } from '@/services/BudgetService'
import { getMonthEvents } from '@/services/CalendarService'
import { CHART_ACCENTS } from '@/theme/chartColors'
import { rollupCategoryId } from '@/constants/transactionCategories'
import {
  GLOBAL_BUDGET_CATEGORY_ID,
  type Account,
  type Budget,
  type Category,
  type Loan,
  type LoanPayment,
  type RecurringRule,
  type Transaction,
} from '@/types/entities'

/**
 * §9 Phase 8 — Analytics. Pure derivation of the analysis/forecast datasets
 * behind the Analytics screen: cash flow, category breakdown, budget
 * analysis, savings, loan analysis, a spending heatmap, YoY comparison, and
 * the §6 forecast (month-end spending, expected balance, upcoming
 * obligations, expected savings). Nothing here persists or performs I/O —
 * it composes the existing stores' in-memory data, following the same
 * derived-on-demand pattern as the Phase 4–7 alert/event feeds.
 *
 * Money rules deliberately mirror `DashboardService.sumByType`: only
 * `income`/`expense` types count, soft-deleted rows and transfers are
 * excluded, and net = income − expense.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export interface MonthlyPoint {
  /** `yyyy-mm` stable key. */
  key: string
  /** `MMM` short month label for chart axes. */
  label: string
  year: number
  monthIndex: number
  income: number
  expense: number
  net: number
  /** % of income kept after expenses; null when there was no income. */
  savingsRate: number | null
}

function sumInRange(
  transactions: Transaction[],
  type: 'income' | 'expense',
  start: Date,
  end: Date
): number {
  return transactions
    .filter((t) => !t.isDeleted && t.type === type && inRange(t.transactionDate, start, end))
    .reduce((sum, t) => sum + t.amount, 0)
}

/** Monthly income/expense/net (+ savings rate) for the last `months` calendar
 * months ending at the reference month, oldest → newest. Zero-filled for
 * months with no data so chart series stay continuous. */
export function getCashFlowSeries(
  transactions: Transaction[],
  months = 6,
  reference = new Date()
): MonthlyPoint[] {
  const out: MonthlyPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(reference.getFullYear(), reference.getMonth() - i, 1)
    const end = new Date(reference.getFullYear(), reference.getMonth() - i + 1, 1)
    const income = sumInRange(transactions, 'income', start, end)
    const expense = sumInRange(transactions, 'expense', start, end)
    const net = income - expense
    out.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      label: start.toLocaleString('en-US', { month: 'short' }),
      year: start.getFullYear(),
      monthIndex: start.getMonth(),
      income,
      expense,
      net,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : null,
    })
  }
  return out
}

export interface CategorySlice {
  categoryId: string
  name: string
  /** Stored category color (data, not a design token) — used by the chart. */
  color: string
  amount: number
  /** 0–100 share of the month's expense. */
  percent: number
}

/** Expense by category for the reference month. Categories beyond `topN` are
 * rolled into a single "Other" slice. Uncategorized transactions are
 * bucketed as "Uncategorized". */
export function getCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  reference = new Date(),
  topN = 8
): CategorySlice[] {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1)
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 1)
  const catById = new Map(categories.map((c) => [c.id, c]))
  const byCat = new Map<string, number>()

  for (const t of transactions) {
    if (t.isDeleted || t.type !== 'expense' || !inRange(t.transactionDate, start, end)) continue
    const id = rollupCategoryId(t.categoryId)
    byCat.set(id, (byCat.get(id) ?? 0) + t.amount)
  }

  const rows = [...byCat.entries()]
    .map(([categoryId, amount]) => {
      const cat = catById.get(categoryId)
      return {
        categoryId,
        name: cat?.name ?? 'Uncategorized',
        color: cat?.color ?? CHART_ACCENTS.neutral,
        amount,
        percent: 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const total = rows.reduce((sum, r) => sum + r.amount, 0)
  if (total <= 0) return []

  const top = rows.slice(0, topN).map((r) => ({ ...r, percent: (r.amount / total) * 100 }))
  const rest = rows.slice(topN).reduce((sum, r) => sum + r.amount, 0)
  if (rest > 0) {
    top.push({
      categoryId: '__other__',
      name: 'Other',
      color: CHART_ACCENTS.neutral,
      amount: rest,
      percent: (rest / total) * 100,
    })
  }
  return top
}

export interface BudgetSlice {
  budgetId: string
  categoryId: string
  categoryName: string
  allocated: number
  spent: number
  remaining: number
  percentUsed: number
  forecastEndOfPeriod: number
  severity: 'ok' | 'warning' | 'over'
}

/** Per-budget analysis for active budgets, sorted by spend pressure. Reuses
 * `computeBudgetStatus` so Analytics and the Budgets page can never
 * disagree about a budget's numbers. */
export function getBudgetAnalysis(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  budgetMonthStart: number,
  reference = new Date()
): BudgetSlice[] {
  const catById = new Map(categories.map((c) => [c.id, c]))
  return budgets
    .filter((b) => b.active)
    .map((b) => {
      const s = computeBudgetStatus(b, transactions, budgetMonthStart, reference)
      const categoryName =
        b.categoryId === GLOBAL_BUDGET_CATEGORY_ID
          ? 'Overall'
          : (catById.get(b.categoryId)?.name ?? 'Uncategorized')
      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        categoryName,
        allocated: s.allocated,
        spent: s.spent,
        remaining: s.remaining,
        percentUsed: s.percentUsed,
        forecastEndOfPeriod: s.forecastEndOfPeriod,
        severity: s.severity,
      }
    })
    .sort((a, b) => b.percentUsed - a.percentUsed)
}

export interface LoanAnalysisEntry {
  id: string
  name: string
  originalAmount: number
  outstanding: number
  monthlyEMI: number
  remainingEmis: number
  progressPercent: number
  status: 'active' | 'completed'
}

export interface LoanAnalysis {
  totalOutstanding: number
  totalMonthlyEMI: number
  activeCount: number
  completedCount: number
  loans: LoanAnalysisEntry[]
}

/** Loan portfolio summary. Remaining EMIs is a simple
 * `ceil(outstanding / EMI)` projection (no amortization — same simple math
 * as `LoanService.getPayoffForecast`'s no-interest branch). */
export function getLoanAnalysis(loans: Loan[]): LoanAnalysis {
  const entries: LoanAnalysisEntry[] = loans.map((l) => ({
    id: l.id,
    name: l.loanName,
    originalAmount: l.originalAmount,
    outstanding: l.currentBalance,
    monthlyEMI: l.monthlyEMI,
    remainingEmis: l.monthlyEMI > 0 ? Math.ceil(l.currentBalance / l.monthlyEMI) : 0,
    progressPercent:
      l.originalAmount > 0 ? ((l.originalAmount - l.currentBalance) / l.originalAmount) * 100 : 0,
    status: l.status,
  }))

  const active = entries.filter((e) => e.status === 'active')
  return {
    totalOutstanding: active.reduce((sum, e) => sum + e.outstanding, 0),
    totalMonthlyEMI: active.reduce((sum, e) => sum + e.monthlyEMI, 0),
    activeCount: active.length,
    completedCount: entries.length - active.length,
    loans: entries.sort((a, b) => b.outstanding - a.outstanding),
  }
}

export interface HeatmapDay {
  date: Date
  total: number
  /** 0–4 bucket (0 = no spend); 1–4 from quartiles of the non-zero days. */
  intensity: number
}

export interface HeatmapWeek {
  weekStart: Date
  days: HeatmapDay[]
}

export interface SpendingHeatmap {
  weeks: HeatmapWeek[]
  maxDailyTotal: number
}

/** GitHub-style spending intensity grid: `weeks` columns × 7 weekday rows,
 * covering the last `weeks` calendar weeks ending at the reference week
 * (Monday-start). Intensity buckets come from quartiles of the non-zero
 * daily expense totals, so the scale adapts to the user's actual spend. */
export function getSpendingHeatmap(
  transactions: Transaction[],
  reference = new Date(),
  weeks = 16
): SpendingHeatmap {
  const end = startOfWeek(reference, { weekStartsOn: 1 })
  const weekStart = addDays(end, -(weeks - 1) * 7)
  const expenseByDay = new Map<number, number>()

  for (const t of transactions) {
    if (t.isDeleted || t.type !== 'expense') continue
    const day = startOfDay(startOfStoredDate(t.transactionDate))
    if (day.getTime() < weekStart.getTime() || day.getTime() > end.getTime()) continue
    expenseByDay.set(day.getTime(), (expenseByDay.get(day.getTime()) ?? 0) + t.amount)
  }

  const nonzero = [...expenseByDay.values()].filter((v) => v > 0).sort((a, b) => a - b)
  const thresholds: number[] = []
  for (let i = 1; i <= 4; i++) {
    const idx = Math.floor((nonzero.length * i) / 4)
    thresholds.push(nonzero[idx - 1] ?? Number.POSITIVE_INFINITY)
  }
  const bucket = (total: number): number => {
    if (total <= 0) return 0
    for (let i = 0; i < 4; i++) {
      if (total <= thresholds[i]) return i + 1
    }
    return 4
  }

  const result: HeatmapWeek[] = []
  let maxDailyTotal = 0
  for (let w = 0; w < weeks; w++) {
    const ws = addDays(weekStart, w * 7)
    const days: HeatmapDay[] = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(ws, d)
      const total = expenseByDay.get(date.getTime()) ?? 0
      maxDailyTotal = Math.max(maxDailyTotal, total)
      days.push({ date, total, intensity: bucket(total) })
    }
    result.push({ weekStart: ws, days })
  }
  return { weeks: result, maxDailyTotal }
}

export interface YoYMonth {
  monthIndex: number
  label: string
  thisYear: { income: number; expense: number }
  lastYear: { income: number; expense: number }
  hasThisYear: boolean
  hasLastYear: boolean
}

export interface YearOverYear {
  thisYear: number
  lastYear: number
  months: YoYMonth[]
  hasData: boolean
}

/** Current vs previous calendar year, compared month-by-month. Months with no
 * transactions in either year still appear (zero-filled) so the axis stays
 * full; `hasData` flags whether there is any history at all. */
export function getYearOverYear(transactions: Transaction[], reference = new Date()): YearOverYear {
  const thisYear = reference.getFullYear()
  const lastYear = thisYear - 1

  const monthSum = (year: number, monthIndex: number, type: 'income' | 'expense') =>
    sumInRange(transactions, type, new Date(year, monthIndex, 1), new Date(year, monthIndex + 1, 1))

  const months: YoYMonth[] = []
  let hasData = false
  for (let m = 0; m < 12; m++) {
    const ty = {
      income: monthSum(thisYear, m, 'income'),
      expense: monthSum(thisYear, m, 'expense'),
    }
    const ly = {
      income: monthSum(lastYear, m, 'income'),
      expense: monthSum(lastYear, m, 'expense'),
    }
    const hasThisYear = ty.income > 0 || ty.expense > 0
    const hasLastYear = ly.income > 0 || ly.expense > 0
    if (hasThisYear || hasLastYear) hasData = true
    months.push({
      monthIndex: m,
      label: new Date(thisYear, m, 1).toLocaleString('en-US', { month: 'short' }),
      thisYear: ty,
      lastYear: ly,
      hasThisYear,
      hasLastYear,
    })
  }

  return {
    thisYear,
    lastYear,
    months,
    hasData,
  }
}

export interface Forecast {
  monthLabel: string
  spentSoFar: number
  incomeSoFar: number
  expenseProjection: number
  incomeProjection: number
  upcomingObligations: number
  expectedBalance: number
  expectedSavings: number
  confidence: 'low' | 'medium' | 'high'
}

/** §6 forecast combining the current month's actuals, the trailing 90-day
 * average daily income/expense, and known future obligations (recurring
 * schedule events + next loan EMIs in the rest of the month, via
 * `CalendarService` — which itself never double counts because schedule
 * events are strictly future). Confidence is low with little current-month
 * or historical data, high once both are substantial, medium otherwise. */
export function getForecast(
  transactions: Transaction[],
  accounts: Account[],
  recurringRules: RecurringRule[],
  loans: Loan[],
  loanPayments: LoanPayment[],
  reference = new Date()
): Forecast {
  const today = startOfDay(reference)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const daysElapsed = Math.min(
    31,
    Math.floor((today.getTime() - monthStart.getTime()) / DAY_MS) + 1
  )
  const remainingDays = Math.max(0, Math.round((monthEnd.getTime() - today.getTime()) / DAY_MS) - 1)

  const spentSoFar = sumInRange(transactions, 'expense', monthStart, today)
  const incomeSoFar = sumInRange(transactions, 'income', monthStart, today)

  const historyStart = addDays(today, -90)
  const historyDays = 90
  const avgDailyExpense = sumInRange(transactions, 'expense', historyStart, today) / historyDays
  const avgDailyIncome = sumInRange(transactions, 'income', historyStart, today) / historyDays

  const expenseProjection = spentSoFar + avgDailyExpense * remainingDays
  const incomeProjection = incomeSoFar + avgDailyIncome * remainingDays

  const monthEvents = getMonthEvents(
    today.getFullYear(),
    today.getMonth(),
    transactions,
    recurringRules,
    loans,
    loanPayments,
    reference
  )
  const upcomingObligations = monthEvents
    .filter((e) => e.date.getTime() >= today.getTime() && e.amount < 0)
    .reduce((sum, e) => sum + -e.amount, 0)

  const totalBalance = accounts
    .filter((a) => !a.isArchived)
    .reduce((sum, a) => sum + a.currentBalance, 0)

  const expectedSavings = incomeProjection - expenseProjection - upcomingObligations
  const expectedBalance = totalBalance + expectedSavings

  const historyCount = transactions.filter(
    (t) => !t.isDeleted && t.type === 'expense' && inRange(t.transactionDate, historyStart, today)
  ).length

  const confidence: Forecast['confidence'] =
    daysElapsed < 7 || historyCount < 14
      ? 'low'
      : daysElapsed >= 21 && historyCount >= 30
        ? 'high'
        : 'medium'

  return {
    monthLabel: today.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    spentSoFar,
    incomeSoFar,
    expenseProjection,
    incomeProjection,
    upcomingObligations,
    expectedBalance,
    expectedSavings,
    confidence,
  }
}

export const AnalyticsService = {
  getCashFlowSeries,
  getCategoryBreakdown,
  getBudgetAnalysis,
  getLoanAnalysis,
  getSpendingHeatmap,
  getYearOverYear,
  getForecast,
}
