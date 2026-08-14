import { describe, it, expect } from 'vitest'
import { getCashFlowSeries, getSpendingHeatmap } from '@/services/AnalyticsService'
import { computeMetrics } from '@/services/DashboardService'
import { getMonthEvents } from '@/services/CalendarService'
import { getMonthlyProfile, getAnomalies } from '@/services/InsightService'
import { getPeriodReport, listReportPeriods, type ReportPeriodType } from '@/services/ReportService'
import type { Transaction } from '@/types/entities'

/**
 * Regression suite for the Phase 11 date-normalization fix. Production write
 * paths store `new Date().toISOString()` (full `yyyy-mm-ddTHH:mm:ss.sssZ`)
 * timestamps, but the services used to parse with
 * `${transactionDate}T00:00:00` — which produces `NaN` for full ISO
 * timestamps and silently excluded real transactions from Analytics,
 * Insights, Reports, and the Calendar. Every service must now treat the
 * stored date identically whether it is a `yyyy-mm-dd` key or a full ISO
 * timestamp.
 */

const now = () => new Date().toISOString()

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: crypto.randomUUID(),
    createdAt: now(),
    updatedAt: now(),
    transactionDate: '2026-06-05',
    type: 'expense',
    amount: 500,
    currency: 'INR',
    description: 'Groceries',
    categoryId: 'cat-food',
    accountId: 'acc-cash',
    recurringRuleId: null,
    loanId: null,
    budgetId: null,
    tags: [],
    notes: '',
    status: 'paid',
    source: 'manual',
    version: 1,
    isFavorite: false,
    isDeleted: false,
    linkedTransactionId: null,
    transferDirection: undefined,
    ...overrides,
  }
}

/** A full ISO timestamp on the given local date (as write paths produce). */
function isoOn(year: number, month: number, day: number): string {
  const d = new Date(year, month - 1, day, 12, 0, 0, 0)
  return d.toISOString()
}

const REF = new Date(2026, 5, 15) // 2026-06-15 local

describe('date normalization — full ISO timestamps are equivalent to date keys', () => {
  it('AnalyticsService.getCashFlowSeries buckets ISO timestamps into the right month', () => {
    const txs = [
      makeTransaction({ transactionDate: isoOn(2026, 6, 10), type: 'expense', amount: 300 }),
      makeTransaction({ transactionDate: isoOn(2026, 6, 1), type: 'income', amount: 1000 }),
      makeTransaction({ transactionDate: '2026-06-04', type: 'expense', amount: 500 }),
    ]
    const series = getCashFlowSeries(txs, 6, REF)
    expect(series[5].key).toBe('2026-06')
    expect(series[5].income).toBe(1000)
    expect(series[5].expense).toBe(800)
  })

  it('AnalyticsService.getSpendingHeatmap buckets ISO timestamps by day', () => {
    // REF is a Monday — a 1-week window is exactly that Monday.
    const txs = [makeTransaction({ transactionDate: isoOn(2026, 6, 15), amount: 250 })]
    const heatmap = getSpendingHeatmap(txs, REF, 1)
    // The only expense day in the window must carry the amount.
    const dayCells = heatmap.weeks.flatMap((w) => w.days)
    const active = dayCells.filter((c) => c.total > 0)
    expect(active).toHaveLength(1)
    expect(active[0].total).toBe(250)
  })

  it('DashboardService.computeMetrics counts ISO timestamps inside the period', () => {
    const txs = [
      makeTransaction({ transactionDate: isoOn(2026, 6, 20), type: 'expense', amount: 400 }),
      makeTransaction({ transactionDate: isoOn(2026, 5, 20), type: 'expense', amount: 900 }), // previous period
    ]
    const metrics = computeMetrics(txs, [], 1, REF)
    expect(metrics.monthExpense).toBe(400)
    expect(metrics.monthExpenseTrend).toBeCloseTo(-55.55, 1)
  })

  it('CalendarService.getMonthEvents places ISO-timestamped transactions on the right day', () => {
    const txs = [makeTransaction({ transactionDate: isoOn(2026, 6, 12), amount: 750 })]
    const events = getMonthEvents(2026, 5, txs, [], [], [], REF)
    const txEvents = events.filter((e) => e.kind === 'transaction')
    expect(txEvents).toHaveLength(1)
    expect(txEvents[0].date.getDate()).toBe(12)
  })

  it('InsightService.getMonthlyProfile and getAnomalies read ISO-timestamped day-of-month', () => {
    const txs = [
      makeTransaction({ transactionDate: isoOn(2026, 6, 5), type: 'expense', amount: 1200 }),
      makeTransaction({ transactionDate: isoOn(2026, 6, 5), type: 'expense', amount: 800 }),
    ]
    const profile = getMonthlyProfile(txs, [], REF)
    expect(profile.mostActiveDay).toBe(5)
    expect(profile.largestTransaction?.amount).toBe(1200)

    const anomalies = getAnomalies(txs, [], REF)
    expect(anomalies.some((a) => a.type === 'largest-purchase')).toBe(true)
  })

  it('ReportService.getPeriodReport counts ISO timestamps in the right period', () => {
    const txs = [
      makeTransaction({ transactionDate: isoOn(2026, 6, 20), type: 'expense', amount: 600 }),
      makeTransaction({ transactionDate: '2026-06-02', type: 'income', amount: 5000 }),
    ]
    const report = getPeriodReport(txs, [], [], [], 'monthly', REF)
    expect(report.summary.transactionCount).toBe(2)
    expect(report.summary.expense).toBe(600)
    expect(report.summary.income).toBe(5000)
  })

  it('ReportService.listReportPeriods spans the real ISO timestamps, not NaN', () => {
    const txs = [
      makeTransaction({ transactionDate: isoOn(2026, 2, 10), amount: 100 }),
      makeTransaction({ transactionDate: isoOn(2026, 6, 10), amount: 200 }),
    ]
    const periods = listReportPeriods('monthly' as ReportPeriodType, txs, REF)
    expect(periods).toHaveLength(5) // Feb, Mar, Apr, May, Jun
    expect(periods[0].key).toBe('2026-02')
    expect(periods[4].key).toBe('2026-06')
  })
})
