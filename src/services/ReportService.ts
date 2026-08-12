import { inRange, startOfStoredDate } from '@/utils/dates'
import { CHART_ACCENTS } from '@/theme/chartColors'
import {
  GLOBAL_BUDGET_CATEGORY_ID,
  type Account,
  type Budget,
  type Category,
  type Transaction,
} from '@/types/entities'

/**
 * §9 Phase 10 — Reports. Pure derivation of the period reports behind the
 * Reports screen: monthly, quarterly, or yearly summaries (income, expense,
 * net, savings rate), expense by category, income/expense by account,
 * budget vs actual, and top merchants. Nothing here persists or performs
 * I/O — it composes the stores' in-memory data, following the same
 * derived-on-demand pattern as Phases 4–9.
 *
 * Money rules deliberately mirror `DashboardService.sumByType` and
 * `BudgetService.sumSpent`: only `income`/`expense` count toward totals,
 * soft-deleted rows are excluded, transfers never affect spending, and net
 * = income − expense.
 *
 * Periods are calendar-based (a monthly report is a calendar month, a
 * quarterly report Q1–Q4, a yearly report a calendar year), deliberately
 * independent of `Settings.budgetMonthStart`. Budget rows therefore use
 * `monthlyLimit × months-in-period` as the allocation rather than
 * `computeBudgetStatus`'s current rolling period — so a report can be
 * produced for *any* historical period without the two concepts silently
 * disagreeing.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export type ReportPeriodType = 'monthly' | 'quarterly' | 'yearly'

export interface ReportPeriod {
  type: ReportPeriodType
  /** Stable key: `yyyy-mm`, `yyyy-Qn`, or `yyyy`. */
  key: string
  /** Human label: "January 2026", "Q1 2026", "2026". */
  label: string
  /** Calendar start of the period (inclusive). */
  start: Date
  /** Exclusive end. */
  end: Date
  /** The immediately preceding same-length period. */
  previous: ReportPeriod
}

const PERIOD_LABEL: Record<ReportPeriodType, (year: number, month: number) => string> = {
  monthly: (year, month) =>
    new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  quarterly: (year, month) => `Q${Math.floor(month / 3) + 1} ${year}`,
  yearly: (year) => String(year),
}

function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1)
}

/** Calendar period containing the reference date, with its previous
 * same-length period (used for %-change comparisons in the report). */
export function getReportPeriod(type: ReportPeriodType, reference = new Date()): ReportPeriod {
  const year = reference.getFullYear()
  const month = reference.getMonth()
  const start =
    type === 'monthly'
      ? monthStart(year, month)
      : type === 'quarterly'
        ? monthStart(year, month - (month % 3))
        : monthStart(year, 0)
  const end =
    type === 'monthly'
      ? monthStart(year, month + 1)
      : type === 'quarterly'
        ? monthStart(year, month - (month % 3) + 3)
        : monthStart(year + 1, 0)

  return {
    type,
    key: periodKey(type, year, month),
    label: PERIOD_LABEL[type](year, month),
    start,
    end,
    previous: previousPeriod(type, year, month, start),
  }
}

function periodKey(type: ReportPeriodType, year: number, month: number): string {
  if (type === 'monthly') return `${year}-${String(month + 1).padStart(2, '0')}`
  if (type === 'quarterly') return `${year}-Q${Math.floor(month / 3) + 1}`
  return String(year)
}

/** The previous same-length period, derived with calendar arithmetic (not
 * elapsed-ms subtraction, which drifts across months of differing lengths).
 * Only one level deep — callers never walk the chain. */
function previousPeriod(
  type: ReportPeriodType,
  year: number,
  month: number,
  start: Date
): ReportPeriod {
  const prevYear =
    type === 'yearly' ? year - 1 : type === 'monthly' ? (month === 0 ? year - 1 : year) : year
  const prevMonth =
    type === 'monthly'
      ? month === 0
        ? 11
        : month - 1
      : type === 'quarterly'
        ? month - (month % 3) - 3
        : 0
  const prevStart = new Date(prevYear, prevMonth, 1)
  return {
    type,
    key: periodKey(type, prevStart.getFullYear(), prevStart.getMonth()),
    label: PERIOD_LABEL[type](prevStart.getFullYear(), prevStart.getMonth()),
    start: prevStart,
    end: start,
    // Callers only ever read one level back (the %-change comparison);
    // this stub keeps the type honest without recursing.
    previous: {} as ReportPeriod,
  }
}

/** Shift a reference date by `delta` periods (e.g. −1 = previous month) so
 * callers can navigate between report periods. */
export function shiftPeriod(type: ReportPeriodType, reference: Date, delta: number): ReportPeriod {
  const year = reference.getFullYear()
  const month = reference.getMonth()
  const shifted =
    type === 'monthly'
      ? monthStart(year, month + delta)
      : type === 'quarterly'
        ? monthStart(year, month + delta * 3)
        : monthStart(year + delta, 0)
  return getReportPeriod(type, shifted)
}

/** The full set of periods that contain at least one transaction, oldest →
 * newest, derived from the data itself. Empty data yields just the current
 * period, so the page always has something to show. */
export function listReportPeriods(
  type: ReportPeriodType,
  transactions: Transaction[],
  reference = new Date()
): ReportPeriod[] {
  const dates = transactions
    .filter((t) => !t.isDeleted)
    .map((t) => startOfStoredDate(t.transactionDate))
  if (dates.length === 0) return [getReportPeriod(type, reference)]

  const min = dates.reduce((a, b) => (b.getTime() < a.getTime() ? b : a))
  const max = dates.reduce((a, b) => (b.getTime() > a.getTime() ? b : a))

  let cursor = getReportPeriod(type, min)
  const out: ReportPeriod[] = []
  let guard = 0
  while (cursor.start.getTime() <= max.getTime() && guard < 1000) {
    out.push(cursor)
    cursor = shiftPeriod(type, cursor.start, 1)
    guard++
  }
  return out
}

function periodTransactions(transactions: Transaction[], period: ReportPeriod): Transaction[] {
  return transactions.filter(
    (t) => !t.isDeleted && inRange(t.transactionDate, period.start, period.end)
  )
}

function sumIncome(txs: Transaction[]): number {
  return txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
}

function sumExpense(txs: Transaction[]): number {
  return txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
}

export interface ReportSummary {
  income: number
  expense: number
  net: number
  /** % of income kept after expenses; null when there was no income. */
  savingsRate: number | null
  transactionCount: number
}

export interface ReportCategoryRow {
  categoryId: string
  name: string
  color: string
  amount: number
  /** 0–100 share of the period's expense. */
  percent: number
}

export interface ReportAccountRow {
  accountId: string
  name: string
  type: 'income' | 'expense'
  amount: number
}

export interface ReportBudgetRow {
  budgetId: string
  categoryId: string
  categoryName: string
  allocated: number
  spent: number
  remaining: number
  percentUsed: number
  severity: 'ok' | 'warning' | 'over'
}

export interface ReportMerchant {
  description: string
  amount: number
  count: number
}

export interface PeriodReport {
  period: ReportPeriod
  summary: ReportSummary
  categoryBreakdown: ReportCategoryRow[]
  accountBreakdown: ReportAccountRow[]
  budgetRows: ReportBudgetRow[]
  topMerchants: ReportMerchant[]
  /** Income/expense % change vs the previous same-length period. */
  vsPrevious: {
    incomeChange: number | null
    expenseChange: number | null
  }
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null // undefined % change — no baseline to compare
  return ((current - previous) / previous) * 100
}

/** Expense by category for the period, sorted by amount descending. */
function categoryBreakdown(txs: Transaction[], categories: Category[]): ReportCategoryRow[] {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const byCat = new Map<string, number>()
  for (const t of txs) {
    if (t.type !== 'expense') continue
    byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount)
  }
  const rows = [...byCat.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      name: catById.get(categoryId)?.name ?? 'Uncategorized',
      color: catById.get(categoryId)?.color ?? CHART_ACCENTS.neutral,
      amount,
      percent: 0,
    }))
    .sort((a, b) => b.amount - a.amount)
  const total = rows.reduce((s, r) => s + r.amount, 0)
  if (total <= 0) return []
  return rows.map((r) => ({ ...r, percent: (r.amount / total) * 100 }))
}

/** Income and expense by account for the period, sorted by amount. */
function accountBreakdown(txs: Transaction[], accounts: Account[]): ReportAccountRow[] {
  const byId = new Map(accounts.map((a) => [a.id, a]))
  const rows: ReportAccountRow[] = []
  const push = (accountId: string, type: 'income' | 'expense', amount: number) => {
    const existing = rows.find((r) => r.accountId === accountId && r.type === type)
    if (existing) existing.amount += amount
    else rows.push({ accountId, name: byId.get(accountId)?.name ?? 'Unknown', type, amount })
  }
  for (const t of txs) {
    if (t.type === 'income') push(t.accountId, 'income', t.amount)
    else if (t.type === 'expense') push(t.accountId, 'expense', t.amount)
  }
  return rows.sort((a, b) => b.amount - a.amount)
}

/** Budget vs actual for the period: allocation is `monthlyLimit × months in
 * the period` (calendar periods are independent of budgetMonthStart), spent
 * follows `BudgetService.sumSpent`'s rules (expense adds, refund subtracts,
 * transfers never count). Only active budgets. */
function budgetRows(
  budgets: Budget[],
  txs: Transaction[],
  categories: Category[],
  period: ReportPeriod
): ReportBudgetRow[] {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const months = Math.max(
    1,
    Math.round((period.end.getTime() - period.start.getTime()) / (30 * DAY_MS))
  )
  const warningThreshold = 80

  return budgets
    .filter((b) => b.active)
    .map((b) => {
      const spent = txs
        .filter(
          (t) =>
            (b.categoryId === GLOBAL_BUDGET_CATEGORY_ID || t.categoryId === b.categoryId) &&
            (t.type === 'expense' || t.type === 'refund')
        )
        .reduce((sum, t) => (t.type === 'expense' ? sum + t.amount : sum - t.amount), 0)
      const allocated = b.monthlyLimit * months
      const remaining = allocated - spent
      const percentUsed = allocated > 0 ? (spent / allocated) * 100 : spent > 0 ? 100 : 0
      const severity: ReportBudgetRow['severity'] =
        percentUsed >= 100 ? 'over' : percentUsed >= warningThreshold ? 'warning' : 'ok'
      return {
        budgetId: b.id,
        categoryId: b.categoryId,
        categoryName:
          b.categoryId === GLOBAL_BUDGET_CATEGORY_ID
            ? 'Overall'
            : (catById.get(b.categoryId)?.name ?? 'Uncategorized'),
        allocated,
        spent,
        remaining,
        percentUsed,
        severity,
      }
    })
    .sort((a, b) => b.percentUsed - a.percentUsed)
}

/** Top merchants for the period: expenses grouped by their (trimmed)
 * description, most spent first. */
function topMerchants(txs: Transaction[], limit = 5): ReportMerchant[] {
  const byName = new Map<string, { amount: number; count: number }>()
  for (const t of txs) {
    if (t.type !== 'expense') continue
    const name = t.description.trim()
    if (!name) continue
    const entry = byName.get(name) ?? { amount: 0, count: 0 }
    entry.amount += t.amount
    entry.count++
    byName.set(name, entry)
  }
  return [...byName.entries()]
    .map(([description, { amount, count }]) => ({ description, amount, count }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

/** Full period report: summary, category/account/budget breakdowns, and top
 * merchants, with % change vs the previous same-length period. */
export function getPeriodReport(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  budgets: Budget[],
  type: ReportPeriodType,
  reference = new Date()
): PeriodReport {
  const period = getReportPeriod(type, reference)
  const txs = periodTransactions(transactions, period)
  const prevTxs = periodTransactions(transactions, period.previous)

  const income = sumIncome(txs)
  const expense = sumExpense(txs)
  const prevIncome = sumIncome(prevTxs)
  const prevExpense = sumExpense(prevTxs)

  return {
    period,
    summary: {
      income,
      expense,
      net: income - expense,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : null,
      transactionCount: txs.length,
    },
    categoryBreakdown: categoryBreakdown(txs, categories),
    accountBreakdown: accountBreakdown(txs, accounts),
    budgetRows: budgetRows(budgets, txs, categories, period),
    topMerchants: topMerchants(txs),
    vsPrevious: {
      incomeChange: percentChange(income, prevIncome),
      expenseChange: percentChange(expense, prevExpense),
    },
  }
}

export const ReportService = {
  getPeriodReport,
  getReportPeriod,
  shiftPeriod,
  listReportPeriods,
}
