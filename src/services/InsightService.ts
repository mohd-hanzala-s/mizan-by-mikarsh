import { inRange, startOfStoredDate, toDateKey } from '@/utils/dates'
import { getCashFlowSeries, getForecast, getLoanAnalysis } from '@/services/AnalyticsService'
import { computeBudgetStatus } from '@/services/BudgetService'
import { isOverdue } from '@/services/LoanService'
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
 * §9 Phase 9 — Intelligence & Insights. Pure derivation engine behind the
 * Insights screen: the §6 Financial Health Score (canonical weights),
 * §7 recommendations with the Observation → Reason → Recommendation →
 * Expected Impact explainability format, §6 anomaly detection, the monthly
 * behaviour profile, and evidence-based savings suggestions. Like Phases
 * 4–8, everything is derived on demand from the stores' in-memory data —
 * advisory only, nothing persisted, no I/O.
 */

const DAY_MS = 24 * 60 * 60 * 1000

const WEIGHTS = {
  savings: 25,
  budget: 20,
  debt: 20,
  consistency: 15,
  forecast: 10,
  obligations: 10,
} as const

const clamp = (n: number) => Math.max(0, Math.min(100, n))
const avg = (nums: number[]) => nums.reduce((s, n) => s + n, 0) / Math.max(1, nums.length)

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function monthRange(offset: number, reference: Date): { start: Date; end: Date } {
  const start = new Date(reference.getFullYear(), reference.getMonth() - offset, 1)
  return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) }
}

function monthTransactions(
  transactions: Transaction[],
  offset: number,
  reference: Date
): Transaction[] {
  const { start, end } = monthRange(offset, reference)
  return transactions.filter((t) => !t.isDeleted && inRange(t.transactionDate, start, end))
}

function sumExpense(txs: Transaction[]): number {
  return txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
}

function sumIncome(txs: Transaction[]): number {
  return txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
}

function categorySums(txs: Transaction[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of txs) {
    if (t.type !== 'expense') continue
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  return map
}

export interface HealthFactor {
  key: keyof typeof WEIGHTS
  label: string
  weight: number
  /** 0–100 factor score. */
  value: number
  /** `value * weight / 100` — the factor's contribution to the total. */
  contribution: number
}

export interface HealthScore {
  /** 0–100. */
  score: number
  factors: HealthFactor[]
  topStrength: { key: HealthFactor['key']; label: string; value: number }
  topConcern: { key: HealthFactor['key']; label: string; value: number }
  recommendedAction: string
}

const FACTOR_LABELS: Record<HealthFactor['key'], string> = {
  savings: 'Savings rate',
  budget: 'Budget adherence',
  debt: 'Debt ratio',
  consistency: 'Consistency',
  forecast: 'Forecast',
  obligations: 'Missed obligations',
}

const FACTOR_ACTIONS: Record<HealthFactor['key'], string> = {
  savings: 'Build a regular savings habit — aim to keep at least 20% of income.',
  budget: 'Review your top budgets; several are near or over their limits.',
  debt: 'Prioritise paying down high-EMI loans to improve your debt ratio.',
  consistency: 'Log transactions consistently — a complete history powers better insights.',
  forecast: 'Your projected month-end savings are negative; trim discretionary spending.',
  obligations: 'Resolve missed payments — overdue EMIs or pending recurring entries.',
}

/** §6 Financial Health Score with the canonical weights
 * (savings 25 · budget 20 · debt 20 · consistency 15 · forecast 10 ·
 * missed obligations 10). Every factor is 0–100 and the total is the
 * weighted average. */
export function computeHealthScore(
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[],
  loans: Loan[],
  loanPayments: LoanPayment[],
  recurringRules: RecurringRule[],
  budgetMonthStart: number,
  reference = new Date()
): HealthScore {
  const today = startOfDay(reference)

  // Savings rate — average over the last 3 months with income (§6).
  const series = getCashFlowSeries(transactions, 3, reference)
  const withIncome = series.filter((m) => m.income > 0 && m.savingsRate !== null)
  const savingsValue = withIncome.length > 0 ? clamp(avg(withIncome.map((m) => m.savingsRate!))) : 0

  // Budget adherence — average `100 − percentUsed` over active budgets.
  const activeBudgets = budgets.filter((b) => b.active)
  const budgetValue =
    activeBudgets.length === 0
      ? 50 // neutral: no budgets to breach
      : clamp(
          avg(
            activeBudgets.map((b) => {
              const s = computeBudgetStatus(b, transactions, budgetMonthStart, reference)
              return s.allocated > 0 ? clamp(100 - s.percentUsed) : 50
            })
          )
        )

  // Debt ratio — outstanding ÷ (outstanding + assets); lower is better.
  const loanAnalysis = getLoanAnalysis(loans)
  const debt = loanAnalysis.totalOutstanding
  const assets = accounts
    .filter((a) => !a.isArchived)
    .reduce((s, a) => s + Math.max(0, a.currentBalance), 0)
  const debtValue = (1 - debt / Math.max(1, debt + assets)) * 100

  // Consistency — share of the last 6 months that have any activity.
  let activeMonths = 0
  for (let i = 0; i < 6; i++) {
    if (monthTransactions(transactions, i, reference).length > 0) activeMonths++
  }
  const consistencyValue = (activeMonths / 6) * 100

  // Forecast — §6 expected savings vs projected income.
  const forecast = getForecast(
    transactions,
    accounts,
    recurringRules,
    loans,
    loanPayments,
    reference
  )
  const forecastValue =
    forecast.expectedSavings >= 0
      ? 100
      : clamp(100 - (-forecast.expectedSavings / Math.max(1, forecast.incomeProjection)) * 100)

  // Missed obligations — overdue EMIs + pending auto-generated entries.
  const paymentsByLoan = new Map<string, LoanPayment[]>()
  for (const p of loanPayments) {
    const list = paymentsByLoan.get(p.loanId) ?? []
    list.push(p)
    paymentsByLoan.set(p.loanId, list)
  }
  const overdueLoans = loans.filter(
    (l) =>
      l.status === 'active' &&
      l.currentBalance > 0 &&
      isOverdue(l, paymentsByLoan.get(l.id) ?? [], reference)
  )
  const missedRecurring = transactions.filter(
    (t) =>
      !t.isDeleted &&
      t.status === 'pending' &&
      t.source === 'auto' &&
      startOfStoredDate(t.transactionDate).getTime() < today.getTime()
  )
  const obligationsValue = clamp(100 - (overdueLoans.length + missedRecurring.length) * 25)

  const raw: Array<[HealthFactor['key'], number]> = [
    ['savings', savingsValue],
    ['budget', budgetValue],
    ['debt', debtValue],
    ['consistency', consistencyValue],
    ['forecast', forecastValue],
    ['obligations', obligationsValue],
  ]

  const factors: HealthFactor[] = raw.map(([key, value]) => ({
    key,
    label: FACTOR_LABELS[key],
    weight: WEIGHTS[key],
    value: Math.round(value * 10) / 10,
    contribution: (value * WEIGHTS[key]) / 100,
  }))

  const score = Math.round(factors.reduce((s, f) => s + f.contribution, 0))

  const topStrength = factors.reduce((best, f) => (f.value > best.value ? f : best), factors[0])
  const topConcern = factors.reduce((worst, f) => (f.value < worst.value ? f : worst), factors[0])

  return {
    score,
    factors,
    topStrength: {
      key: topStrength.key,
      label: topStrength.label,
      value: topStrength.value,
    },
    topConcern: {
      key: topConcern.key,
      label: topConcern.label,
      value: topConcern.value,
    },
    recommendedAction: FACTOR_ACTIONS[topConcern.key],
  }
}

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Recommendation {
  id: string
  priority: RecommendationPriority
  title: string
  observation: string
  reason: string
  recommendation: string
  impact: string
}

export interface CategoryGrowth {
  categoryId: string
  name: string
  currentMonthSpend: number
  avgMonthlySpend: number
  growthRatio: number
}

/** Per-category current-month expense vs the average of the previous three
 * months. Categories with no prior spend get `growthRatio = Infinity`
 * (new category) but are still listed so callers can filter. */
export function computeCategoryGrowth(
  transactions: Transaction[],
  categories: Category[],
  reference = new Date()
): CategoryGrowth[] {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const current = categorySums(monthTransactions(transactions, 0, reference))
  const prev = new Map<string, number[]>()
  for (let i = 1; i <= 3; i++) {
    for (const [id, amt] of categorySums(monthTransactions(transactions, i, reference))) {
      const list = prev.get(id) ?? []
      list.push(amt)
      prev.set(id, list)
    }
  }

  const rows: CategoryGrowth[] = []
  for (const [categoryId, currentMonthSpend] of current) {
    const history = prev.get(categoryId) ?? []
    const avgMonthlySpend = history.length > 0 ? avg(history) : 0
    rows.push({
      categoryId,
      name: catById.get(categoryId)?.name ?? 'Uncategorized',
      currentMonthSpend,
      avgMonthlySpend,
      growthRatio:
        avgMonthlySpend > 0 ? currentMonthSpend / avgMonthlySpend : Number.POSITIVE_INFINITY,
    })
  }
  return rows.sort((a, b) => b.growthRatio - a.growthRatio)
}

const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

/** §7 recommendation engine. Priorities follow the spec's ordering:
 * critical (missed EMI, negative balance forecast, loan overdue) → high
 * (budget near exhausted, rapid spending rise) → medium (category trend) →
 * low (savings milestone / monthly summary). Every item carries the
 * Observation → Reason → Recommendation → Expected Impact structure. */
export function getRecommendations(
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[],
  categories: Category[],
  loans: Loan[],
  loanPayments: LoanPayment[],
  recurringRules: RecurringRule[],
  budgetMonthStart: number,
  reference = new Date()
): Recommendation[] {
  const out: Recommendation[] = []
  const today = startOfDay(reference)

  const forecast = getForecast(
    transactions,
    accounts,
    recurringRules,
    loans,
    loanPayments,
    reference
  )
  const cashFlow = getCashFlowSeries(transactions, 3, reference)
  const currentMonth = cashFlow[cashFlow.length - 1]
  const previousMonth = cashFlow[cashFlow.length - 2]

  const statuses = budgets
    .filter((b) => b.active)
    .map((b) => computeBudgetStatus(b, transactions, budgetMonthStart, reference))

  const paymentsByLoan = new Map<string, LoanPayment[]>()
  for (const p of loanPayments) {
    const list = paymentsByLoan.get(p.loanId) ?? []
    list.push(p)
    paymentsByLoan.set(p.loanId, list)
  }
  const overdueLoans = loans.filter(
    (l) =>
      l.status === 'active' &&
      l.currentBalance > 0 &&
      isOverdue(l, paymentsByLoan.get(l.id) ?? [], reference)
  )

  const missedRecurring = transactions.filter(
    (t) =>
      !t.isDeleted &&
      t.status === 'pending' &&
      t.source === 'auto' &&
      startOfStoredDate(t.transactionDate).getTime() < today.getTime()
  )

  // Critical.
  if (forecast.expectedBalance < 0) {
    out.push({
      id: 'rec-negative-balance',
      priority: 'critical',
      title: 'Negative balance forecast',
      observation: `Projected month-end balance is ${fmt(forecast.expectedBalance)}.`,
      reason: 'Spending and upcoming obligations exceed projected income for this month.',
      recommendation: 'Hold off on discretionary purchases until income lands.',
      impact: `Keeping the month's balance positive avoids overdraft and stress.`,
    })
  }
  for (const loan of overdueLoans) {
    out.push({
      id: `rec-loan-overdue-${loan.id}`,
      priority: 'critical',
      title: `Overdue EMI · ${loan.loanName}`,
      observation: `${loan.loanName} has an EMI that hasn't been covered this cycle.`,
      reason: 'A skipped EMI cycle increases interest and hurts your credit history.',
      recommendation: `Record the ${fmt(loan.monthlyEMI)} EMI payment now.`,
      impact: 'Clearing it removes the overdue flag and protects your score.',
    })
  }

  // High.
  for (const s of statuses) {
    if (s.severity !== 'over') continue
    const name = s.budget.categoryId === GLOBAL_BUDGET_CATEGORY_ID ? 'Overall' : 'this budget'
    out.push({
      id: `rec-budget-over-${s.budget.id}`,
      priority: 'high',
      title: 'Budget exceeded',
      observation: `${name} is over by ${fmt(Math.abs(s.remaining))} this period.`,
      reason: 'Spend has passed the full allocation before the period ended.',
      recommendation: 'Pause spending in this category or reallocate from a slack budget.',
      impact: 'Staying within the limit keeps future forecasts honest.',
    })
  }
  if (missedRecurring.length > 0) {
    out.push({
      id: 'rec-missed-recurring',
      priority: 'high',
      title: 'Unpaid recurring entries',
      observation: `${missedRecurring.length} pending scheduled ${missedRecurring.length === 1 ? 'payment is' : 'payments are'} past due.`,
      reason: 'Auto-generated entries stay pending until you mark them paid or skipped.',
      recommendation: 'Review the Recurring screen and settle or skip each due entry.',
      impact: 'Clearing them stops the missed-payment reminders and keeps history tidy.',
    })
  }
  if (
    previousMonth &&
    previousMonth.expense > 0 &&
    currentMonth.expense > previousMonth.expense * 1.25
  ) {
    out.push({
      id: 'rec-rising-spend',
      priority: 'high',
      title: 'Spending rising fast',
      observation: `${fmt(currentMonth.expense)} spent so far this month vs ${fmt(previousMonth.expense)} last month.`,
      reason: 'Month-to-date spend is already more than 25% above last month.',
      recommendation: 'Check the biggest categories on the Analytics screen.',
      impact: 'Early intervention keeps the month-end projection in range.',
    })
  }

  // Medium — category trend.
  const growth = computeCategoryGrowth(transactions, categories, reference)
  for (const g of growth) {
    if (g.currentMonthSpend < 500 || g.growthRatio < 1.5) continue
    out.push({
      id: `rec-growth-${g.categoryId}`,
      priority: 'medium',
      title: `Spending up in ${g.name}`,
      observation: `${g.name} is ${fmt(g.currentMonthSpend)} this month vs ${fmt(g.avgMonthlySpend)} on average.`,
      reason: `That's ${(g.growthRatio * 100).toFixed(0)}% of the previous three-month average.`,
      recommendation: `Review recent ${g.name.toLowerCase()} purchases for easy cuts.`,
      impact: `Cutting it 10% could save ~${fmt(g.currentMonthSpend * 0.1)} this month.`,
    })
  }

  // Low.
  if (currentMonth && currentMonth.net > 0) {
    out.push({
      id: 'rec-savings-milestone',
      priority: 'low',
      title: 'Savings milestone',
      observation: `You've saved ${fmt(currentMonth.net)} so far this month.`,
      reason: 'Income is outpacing expenses this month.',
      recommendation: 'Consider moving the surplus into an emergency fund.',
      impact: 'Consistent months like this compound into real security.',
    })
  }
  if (transactions.some((t) => !t.isDeleted)) {
    out.push({
      id: 'rec-monthly-review',
      priority: 'low',
      title: 'Monthly review',
      observation: 'Your spending pattern this month is ready to review.',
      reason: 'The Insights and Analytics screens summarise every rupee.',
      recommendation: 'Spend two minutes on the Analytics screen.',
      impact: 'A quick review turns habits into a plan.',
    })
  }

  const order: Record<RecommendationPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  return out.sort((a, b) => order[a.priority] - order[b.priority])
}

export interface Anomaly {
  id: string
  type: 'largest-purchase' | 'category-growth' | 'spending-spike'
  description: string
  explanation: string
}

/** §6 anomaly detection — largest purchase, unusual category growth, and a
 * sudden spending spike, each with an explanation. */
export function getAnomalies(
  transactions: Transaction[],
  categories: Category[],
  reference = new Date()
): Anomaly[] {
  const out: Anomaly[] = []
  const currentMonth = monthTransactions(transactions, 0, reference)

  const expenses = currentMonth.filter((t) => t.type === 'expense')
  if (expenses.length > 0) {
    const largest = expenses.reduce((a, b) => (b.amount > a.amount ? b : a), expenses[0])
    out.push({
      id: 'anomaly-largest-purchase',
      type: 'largest-purchase',
      description: `Largest purchase this month: ${largest.description.trim() || 'Transaction'} · ${fmt(largest.amount)}`,
      explanation: `At ${fmt(largest.amount)} it's the single biggest outflow of the month so far.`,
    })
  }

  for (const g of computeCategoryGrowth(transactions, categories, reference)) {
    if (g.currentMonthSpend < 500 || g.growthRatio < 1.5) continue
    out.push({
      id: `anomaly-growth-${g.categoryId}`,
      type: 'category-growth',
      description: `${g.name} spending is ${(g.growthRatio * 100).toFixed(0)}% above average`,
      explanation: `${fmt(g.currentMonthSpend)} this month vs ${fmt(g.avgMonthlySpend)} on average over the previous three months.`,
    })
  }

  const prevMonths = [1, 2, 3].flatMap((i) => monthTransactions(transactions, i, reference))
  const prevExpenseTotal = sumExpense(prevMonths)
  const avgDailyPrev = prevExpenseTotal / 90
  if (avgDailyPrev > 0) {
    const byDay = new Map<number, number>()
    for (const t of currentMonth) {
      if (t.type !== 'expense') continue
      const day = startOfStoredDate(t.transactionDate).getDate()
      byDay.set(day, (byDay.get(day) ?? 0) + t.amount)
    }
    const spikeDay = [...byDay.entries()].filter(
      ([, amt]) => amt >= avgDailyPrev * 2 && amt >= 1000
    )
    if (spikeDay.length > 0) {
      const [day, amount] = spikeDay.sort((a, b) => b[1] - a[1])[0]
      out.push({
        id: 'anomaly-spending-spike',
        type: 'spending-spike',
        description: `Spending spike on day ${day} of the month`,
        explanation: `${fmt(amount)} that day is at least double the previous three months' daily average of ${fmt(avgDailyPrev)}.`,
      })
    }
  }

  return out
}

export interface MonthlyProfile {
  monthLabel: string
  highestSpendingCategory: { name: string; amount: number } | null
  averageDailySpend: number
  mostActiveDay: number | null
  largestTransaction: { description: string; amount: number; date: string } | null
  mostUsedCategory: { name: string; count: number } | null
  recurringPaymentCount: number
  savingsAchieved: number
  vsPreviousMonth: number | null
}

/** §7 monthly behaviour profile — the summary of what a typical month looks
 * like for this user. */
export function getMonthlyProfile(
  transactions: Transaction[],
  categories: Category[],
  reference = new Date()
): MonthlyProfile {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const today = startOfDay(reference)
  const currentMonth = monthTransactions(transactions, 0, reference)
  const { start } = monthRange(0, reference)
  const daysElapsed = Math.max(1, Math.floor((today.getTime() - start.getTime()) / DAY_MS) + 1)

  const expenseTotal = sumExpense(currentMonth)
  const incomeTotal = sumIncome(currentMonth)

  const byCategory = new Map<string, { amount: number; count: number }>()
  const byDay = new Map<number, number>()
  let largest: Transaction | null = null
  let recurringCount = 0

  for (const t of currentMonth) {
    const bucket = byCategory.get(t.categoryId) ?? { amount: 0, count: 0 }
    bucket.count++
    if (t.type === 'expense') bucket.amount += t.amount
    byCategory.set(t.categoryId, bucket)

    const day = startOfStoredDate(t.transactionDate).getDate()
    byDay.set(day, (byDay.get(day) ?? 0) + 1)

    if (!largest || t.amount > largest.amount) largest = t
    if (t.recurringRuleId) recurringCount++
  }

  const highestCategory = [...byCategory.entries()]
    .filter(([, b]) => b.amount > 0)
    .sort((a, b) => b[1].amount - a[1].amount)[0]
  const mostUsedCategory = [...byCategory.entries()].sort((a, b) => b[1].count - a[1].count)[0]
  const mostActiveDay = [...byDay.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0]

  const previousMonth = monthTransactions(transactions, 1, reference)
  const prevExpense = sumExpense(previousMonth)
  const vsPreviousMonth =
    prevExpense > 0 ? ((expenseTotal - prevExpense) / prevExpense) * 100 : null

  return {
    monthLabel: today.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    highestSpendingCategory: highestCategory
      ? {
          name: catById.get(highestCategory[0])?.name ?? 'Uncategorized',
          amount: highestCategory[1].amount,
        }
      : null,
    averageDailySpend: expenseTotal / daysElapsed,
    mostActiveDay: mostActiveDay ?? null,
    largestTransaction: largest
      ? {
          description: largest.description.trim() || 'Transaction',
          amount: largest.amount,
          date: largest.transactionDate,
        }
      : null,
    mostUsedCategory: mostUsedCategory
      ? {
          name: catById.get(mostUsedCategory[0])?.name ?? 'Uncategorized',
          count: mostUsedCategory[1].count,
        }
      : null,
    recurringPaymentCount: recurringCount,
    savingsAchieved: incomeTotal - expenseTotal,
    vsPreviousMonth,
  }
}

export interface SavingsSuggestion {
  id: string
  categoryName: string
  currentMonthSpend: number
  avgMonthlySpend: number
  /** 10% of the current month's spend, to the nearest whole rupee. */
  potential: number
}

/** §7 savings suggestions — evidence-based, referencing the category trend
 * that prompted each one. Top three growing categories only. */
export function getSavingsSuggestions(
  transactions: Transaction[],
  categories: Category[],
  reference = new Date()
): SavingsSuggestion[] {
  return computeCategoryGrowth(transactions, categories, reference)
    .filter((g) => g.currentMonthSpend >= 500 && g.growthRatio >= 1.5)
    .slice(0, 3)
    .map((g) => ({
      id: `save-${g.categoryId}`,
      categoryName: g.name,
      currentMonthSpend: g.currentMonthSpend,
      avgMonthlySpend: g.avgMonthlySpend,
      potential: Math.round(g.currentMonthSpend * 0.1),
    }))
}

export interface ConfidenceIndex {
  score: number
  level: 'high' | 'medium' | 'low'
  factors: { label: string; score: number }[]
}

/**
 * Compute the Financial Confidence Index -- a measure of data quality and
 * reliability. This is separate from the Health Score: Confidence measures
 * how trustworthy the data and projections are based on completeness,
 * recency, volume, and account coverage.
 */
export function computeConfidenceIndex(
  transactions: Transaction[],
  accounts: Account[],
  reference = new Date()
): ConfidenceIndex {
  const activeTxns = transactions.filter((t) => !t.isDeleted)
  const now = reference.getTime()

  // Data recency: how recently was the latest transaction?
  let recency = 0
  if (activeTxns.length > 0) {
    const latest = Math.max(
      ...activeTxns.map((t) => new Date(`${toDateKey(t.transactionDate)}T00:00:00`).getTime())
    )
    const daysSince = (now - latest) / (1000 * 60 * 60 * 24)
    recency = Math.max(0, 100 - daysSince * 5) // lose 5 points per day stale
  }

  // Data volume: enough transactions for meaningful analysis
  const count = activeTxns.length
  const volume = Math.min(100, count * 2) // 50+ transactions = 100%

  // Data consistency: active months in the last 6
  let activeMonths = 0
  for (let i = 0; i < 6; i++) {
    if (monthTransactions(transactions, i, reference).length > 0) activeMonths++
  }
  const consistency = (activeMonths / 6) * 100

  // Account coverage: are accounts diverse enough
  const activeAccounts = accounts.filter((a) => !a.isArchived)
  const coverage = Math.min(100, activeAccounts.length * 25) // 4+ accounts = 100%

  const factors = [
    { label: 'Recency', score: Math.round(recency) },
    { label: 'Volume', score: Math.round(volume) },
    { label: 'Consistency', score: Math.round(consistency) },
    { label: 'Coverage', score: Math.round(coverage) },
  ]

  const score = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length)

  let level: ConfidenceIndex['level'] = 'low'
  if (score >= 70) level = 'high'
  else if (score >= 40) level = 'medium'

  return { score, level, factors }
}

export interface HealthBreakdownFactor {
  key: string
  label: string
  weight: number
  value: number
  displayValue: string
}

export function computeHealthBreakdown(params: {
  transactions: Transaction[]
  accounts: Account[]
  rules: RecurringRule[]
  loans: Loan[]
  payments: LoanPayment[]
  budgets: Budget[]
  goals: Array<{ status: string; currentAmount: number; targetAmount: number; createdAt: string; deadline: string | null }>
  investments: Array<{ status: string; units: number; currentPricePerUnit: number; avgCostPerUnit: number }>
  budgetMonthStart: number
  reference?: Date
}): HealthBreakdownFactor[] {
  const {
    transactions,
    accounts,
    loans,
    budgets,
    goals,
    investments,
    budgetMonthStart,
    reference = new Date(),
  } = params

  const series = getCashFlowSeries(transactions, 3, reference)
  const current = series[series.length - 1]

  const savingsRateValue = current?.savingsRate !== null ? clamp(current?.savingsRate ?? 0) : 0

  const monthlyIncome = (current?.income ?? 0) / Math.max(1, series.filter((s) => s.income > 0).length)
  const totalEMI = loans
    .filter((l) => l.status === 'active')
    .reduce((s, l) => s + l.monthlyEMI, 0)
  const debtToIncomeValue = monthlyIncome > 0 ? clamp(100 - (totalEMI / monthlyIncome) * 100) : 0

  const totalBalance = accounts
    .filter((a) => !a.isArchived)
    .reduce((s, a) => s + Math.max(0, a.currentBalance), 0)
  const monthlyExpense = (current?.expense ?? 0) / Math.max(1, series.length)
  const monthsCovered = monthlyExpense > 0 ? totalBalance / monthlyExpense : 0
  const liquidityValue = clamp(Math.min(100, (monthsCovered / 6) * 100))

  const investmentTotal = investments
    .filter((i) => i.status === 'active')
    .reduce((s, i) => s + i.units * i.currentPricePerUnit, 0)
  const totalAssets = totalBalance + investmentTotal
  const investmentRatioValue =
    totalAssets > 0 ? clamp((investmentTotal / totalAssets) * 100) : 0

  const emergencyFundMonths = Math.min(monthsCovered, 12)
  const emergencyFundValue = clamp((emergencyFundMonths / 6) * 100)

  const activeBudgets = budgets.filter((b) => b.active)
  const budgetCompliance =
    activeBudgets.length === 0
      ? 50
      : clamp(
          avg(
            activeBudgets.map((b) => {
              const s = computeBudgetStatus(b, transactions, budgetMonthStart, reference)
              return s.allocated > 0 ? clamp(100 - s.percentUsed) : 50
            })
          )
        )
  const budgetDisciplineValue = budgetCompliance

  const totalDebt = loans
    .filter((l) => l.status === 'active')
    .reduce((s, l) => s + l.currentBalance, 0)
  const creditHealthValue = monthlyIncome > 0 ? clamp(100 - (totalDebt / (monthlyIncome * 12)) * 100) : 0

  const activeGoals = goals.filter((g) => g.status === 'active')
  const goalProgressValue =
    activeGoals.length === 0
      ? 50
      : clamp(
          avg(
            activeGoals.map((g) =>
              g.targetAmount > 0
                ? (g.currentAmount / g.targetAmount) * 100
                : 0
            )
          )
        )

  const factors: HealthBreakdownFactor[] = [
    {
      key: 'savingsRate',
      label: 'Savings Rate',
      weight: 25,
      value: Math.round(savingsRateValue * 10) / 10,
      displayValue: `${savingsRateValue.toFixed(1)}%`,
    },
    {
      key: 'debtToIncome',
      label: 'Debt-to-Income',
      weight: 20,
      value: Math.round(debtToIncomeValue * 10) / 10,
      displayValue: monthlyIncome > 0
        ? `${((totalEMI / monthlyIncome) * 100).toFixed(1)}%`
        : '0%',
    },
    {
      key: 'liquidity',
      label: 'Liquidity',
      weight: 15,
      value: Math.round(liquidityValue * 10) / 10,
      displayValue: `${monthsCovered.toFixed(1)} mo`,
    },
    {
      key: 'investmentRatio',
      label: 'Investment Ratio',
      weight: 15,
      value: Math.round(investmentRatioValue * 10) / 10,
      displayValue: `${investmentRatioValue.toFixed(1)}%`,
    },
    {
      key: 'emergencyFund',
      label: 'Emergency Fund',
      weight: 10,
      value: Math.round(emergencyFundValue * 10) / 10,
      displayValue: `${emergencyFundMonths.toFixed(1)} mo`,
    },
    {
      key: 'budgetDiscipline',
      label: 'Budget Discipline',
      weight: 5,
      value: Math.round(budgetDisciplineValue * 10) / 10,
      displayValue: `${budgetDisciplineValue.toFixed(1)}%`,
    },
    {
      key: 'creditHealth',
      label: 'Credit Health',
      weight: 5,
      value: Math.round(creditHealthValue * 10) / 10,
      displayValue: `${totalDebt > 0 ? ((totalDebt / (monthlyIncome * 12 || 1)) * 100).toFixed(1) + '%' : '0%'} of income`,
    },
    {
      key: 'goalProgress',
      label: 'Goal Progress',
      weight: 5,
      value: Math.round(goalProgressValue * 10) / 10,
      displayValue: `${activeGoals.length} goal${activeGoals.length !== 1 ? 's' : ''}`,
    },
  ]

  return factors
}

export const InsightService = {
  computeHealthScore,
  computeHealthBreakdown,
  getRecommendations,
  getAnomalies,
  getMonthlyProfile,
  getSavingsSuggestions,
  computeCategoryGrowth,
  computeConfidenceIndex,
}
