import { describe, it, expect } from 'vitest'
import {
  AnalyticsService,
  getCashFlowSeries,
  getCategoryBreakdown,
  getBudgetAnalysis,
  getLoanAnalysis,
  getSpendingHeatmap,
  getYearOverYear,
  getForecast,
} from '@/services/AnalyticsService'
import type {
  Account,
  Budget,
  Category,
  Loan,
  LoanPayment,
  RecurringRule,
  Transaction,
} from '@/types/entities'

const REF = new Date(2026, 5, 15) // 15 Jun 2026

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
    isFavorite: false,
    isDeleted: false,
    version: 1,
    linkedTransactionId: null,
    ...overrides,
  }
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: crypto.randomUUID(),
    name: 'Food',
    icon: 'utensils',
    color: '#10B981',
    parentCategory: null,
    displayOrder: 0,
    isDefault: false,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  }
}

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: crypto.randomUUID(),
    categoryId: 'cat-food',
    monthlyLimit: 1000,
    rolloverEnabled: false,
    warningThreshold: 80,
    active: true,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  }
}

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: crypto.randomUUID(),
    name: 'Cash',
    type: 'cash',
    currentBalance: 50000,
    openingBalance: 50000,
    color: '#10B981',
    icon: 'wallet',
    isDefault: false,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
    currency: 'INR',
    ...overrides,
  }
}

function makeRule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: crypto.randomUUID(),
    title: 'Rent',
    amount: 10000,
    type: 'expense',
    categoryId: 'cat-home',
    accountId: 'acc-bank',
    frequency: 'monthly',
    startDate: '2026-05-20',
    endDate: null,
    nextExecution: '2026-06-20',
    autoGenerate: true,
    reminderDays: 3,
    active: true,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  }
}

function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: crypto.randomUUID(),
    loanName: 'Home Loan',
    lender: 'Bank',
    originalAmount: 100000,
    currentBalance: 60000,
    monthlyEMI: 10000,
    interestRate: null,
    startDate: '2026-06-01',
    endDate: null,
    dueDay: 20,
    status: 'active',
    notes: '',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  }
}

function makePayment(loanId: string, overrides: Partial<LoanPayment> = {}): LoanPayment {
  return {
    id: crypto.randomUUID(),
    loanId,
    paymentDate: '2026-06-10',
    amountPaid: 10000,
    principalPaid: 10000,
    interestPaid: 0,
    remainingBalance: 50000,
    notes: '',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  }
}

describe('getCashFlowSeries', () => {
  it('builds the last N months, oldest first, zero-filling empty months', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-03-10', type: 'expense', amount: 300 }),
      makeTransaction({ transactionDate: '2026-06-01', type: 'income', amount: 1000 }),
      makeTransaction({ transactionDate: '2026-06-04', type: 'expense', amount: 500 }),
    ]
    const series = getCashFlowSeries(txs, 6, REF)
    expect(series).toHaveLength(6)
    expect(series[0].key).toBe('2026-01')
    expect(series[5].key).toBe('2026-06')
    expect(series[2].expense).toBe(300) // March
    expect(series[5].income).toBe(1000)
    expect(series[5].expense).toBe(500)
    expect(series[5].net).toBe(500)
    expect(series[0].income).toBe(0) // empty January
    expect(series[5].savingsRate).toBe(50)
  })

  it('excludes soft-deleted and transfer transactions', () => {
    const txs = [
      makeTransaction({
        transactionDate: '2026-06-05',
        type: 'expense',
        amount: 900,
        isDeleted: true,
      }),
      makeTransaction({
        transactionDate: '2026-06-05',
        type: 'transfer',
        amount: 900,
        transferDirection: 'debit',
      }),
      makeTransaction({ transactionDate: '2026-06-06', type: 'expense', amount: 100 }),
    ]
    const series = getCashFlowSeries(txs, 6, REF)
    const june = series[5]
    expect(june.expense).toBe(100)
    expect(june.income).toBe(0)
  })

  it('returns null savings rate when there was no income', () => {
    const series = getCashFlowSeries([makeTransaction()], 6, REF)
    expect(series[5].savingsRate).toBeNull()
  })
})

describe('getCategoryBreakdown', () => {
  const categories = [
    makeCategory({ id: 'cat-food', name: 'Food' }),
    makeCategory({ id: 'cat-transport', name: 'Transport' }),
  ]

  it('aggregates current-month expense by category, sorted descending', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-06-04', amount: 400, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-06-05', amount: 1200, categoryId: 'cat-transport' }),
      makeTransaction({ transactionDate: '2026-06-06', type: 'income', amount: 5000 }),
      makeTransaction({ transactionDate: '2026-05-30', amount: 999, categoryId: 'cat-food' }),
      makeTransaction({
        transactionDate: '2026-06-08',
        amount: 200,
        isDeleted: true,
        categoryId: 'cat-food',
      }),
    ]
    const slices = getCategoryBreakdown(txs, categories, REF)
    expect(slices.map((s) => s.name)).toEqual(['Transport', 'Food'])
    expect(slices[0].amount).toBe(1200)
    expect(slices[1].amount).toBe(900)
    expect(slices[0].percent).toBeCloseTo((1200 / 2100) * 100, 5)
    expect(slices[1].color).toBe('#10B981')
  })

  it('rolls categories beyond topN into Other and buckets missing ones as Uncategorized', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 100, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-06-04', amount: 100, categoryId: 'cat-a' }),
      makeTransaction({ transactionDate: '2026-06-05', amount: 100, categoryId: 'cat-b' }),
      makeTransaction({ transactionDate: '2026-06-06', amount: 100, categoryId: 'cat-missing' }),
    ]
    const slices = getCategoryBreakdown(txs, categories, REF, 2)
    expect(slices[0].name).toBe('Food')
    expect(slices[1].name).toBe('Uncategorized')
    expect(slices[2].name).toBe('Other')
    expect(slices[2].amount).toBe(200)
  })

  it('returns an empty array when there is no expense this month', () => {
    expect(getCategoryBreakdown([], categories, REF)).toEqual([])
  })
})

describe('getBudgetAnalysis', () => {
  it('computes per-budget status, names the global budget Overall, and sorts by pressure', () => {
    const budgets = [
      makeBudget({ id: 'b1', categoryId: 'cat-food', monthlyLimit: 1000 }),
      makeBudget({ id: 'b2', categoryId: '__global__', monthlyLimit: 5000, active: false }),
      makeBudget({ id: 'b3', categoryId: '__global__', monthlyLimit: 5000 }),
    ]
    const categories = [makeCategory({ id: 'cat-food', name: 'Food' })]
    const txs = [
      makeTransaction({ transactionDate: '2026-06-05', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-06-10', amount: 400, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-06-11', amount: 100, categoryId: 'cat-other' }),
    ]
    const rows = getBudgetAnalysis(budgets, categories, txs, 1, REF)
    expect(rows).toHaveLength(2) // inactive excluded
    expect(rows.map((r) => r.categoryName)).toEqual(['Food', 'Overall'])
    expect(rows[0].spent).toBe(900)
    expect(rows[0].remaining).toBe(100)
    expect(rows[0].percentUsed).toBe(90)
    expect(rows[0].severity).toBe('warning')
    expect(rows[1].spent).toBe(1000) // global counts every category
    expect(rows[0].forecastEndOfPeriod).toBeGreaterThan(900)
  })
})

describe('getLoanAnalysis', () => {
  it('summarises active loans and ignores completed ones in totals', () => {
    const loans = [
      makeLoan({
        id: 'l1',
        loanName: 'Home',
        originalAmount: 100000,
        currentBalance: 60000,
        monthlyEMI: 10000,
      }),
      makeLoan({
        id: 'l2',
        loanName: 'Bike',
        originalAmount: 50000,
        currentBalance: 50000,
        monthlyEMI: 5000,
      }),
      makeLoan({
        id: 'l3',
        loanName: 'Done',
        originalAmount: 20000,
        currentBalance: 0,
        monthlyEMI: 2000,
        status: 'completed',
      }),
    ]
    const analysis = getLoanAnalysis(loans)
    expect(analysis.totalOutstanding).toBe(110000)
    expect(analysis.totalMonthlyEMI).toBe(15000)
    expect(analysis.activeCount).toBe(2)
    expect(analysis.completedCount).toBe(1)
    const home = analysis.loans[0]
    expect(home.remainingEmis).toBe(6)
    expect(home.progressPercent).toBe(40)
    expect(analysis.loans[0].outstanding).toBeGreaterThan(analysis.loans[1].outstanding)
  })
})

describe('getSpendingHeatmap', () => {
  it('builds a 16-week × 7-day grid, Monday-start, excluding out-of-window spend', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-10', amount: 500 }),
      makeTransaction({ transactionDate: '2026-06-15', amount: 100 }),
      makeTransaction({ transactionDate: '2026-01-01', amount: 9999 }),
    ]
    const heatmap = getSpendingHeatmap(txs, REF)
    expect(heatmap.weeks).toHaveLength(16)
    for (const week of heatmap.weeks) expect(week.days).toHaveLength(7)
    const totals = heatmap.weeks.flatMap((w) => w.days.map((d) => d.total))
    const inWindow = totals.reduce((a, b) => a + b, 0)
    expect(inWindow).toBe(600) // 10 Jan 9999 outside the window
    expect(totals.every((t) => t >= 0)).toBe(true)
    for (const day of heatmap.weeks.flatMap((w) => w.days)) {
      expect(day.intensity).toBeGreaterThanOrEqual(0)
      expect(day.intensity).toBeLessThanOrEqual(4)
      if (day.total === 0) expect(day.intensity).toBe(0)
    }
  })
})

describe('getYearOverYear', () => {
  it('compares each month of the current year against the previous year', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-05', amount: 400 }),
      makeTransaction({ transactionDate: '2025-06-05', amount: 200 }),
      makeTransaction({ transactionDate: '2025-01-15', amount: 100 }),
    ]
    const yoy = getYearOverYear(txs, REF)
    expect(yoy.thisYear).toBe(2026)
    expect(yoy.lastYear).toBe(2025)
    expect(yoy.months).toHaveLength(12)
    expect(yoy.months[5].thisYear.expense).toBe(400)
    expect(yoy.months[5].lastYear.expense).toBe(200)
    expect(yoy.months[5].hasThisYear).toBe(true)
    expect(yoy.months[5].hasLastYear).toBe(true)
    expect(yoy.months[0].hasLastYear).toBe(true)
    expect(yoy.hasData).toBe(true)
  })

  it('flags no data when both years are empty', () => {
    expect(getYearOverYear([], REF).hasData).toBe(false)
  })
})

describe('getForecast', () => {
  it('projects month-end spending from the trailing average and adds upcoming obligations', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-05', amount: 5000 }),
      makeTransaction({ transactionDate: '2026-06-01', type: 'income', amount: 20000 }),
      makeTransaction({ transactionDate: '2026-04-10', amount: 1000 }),
      makeTransaction({ transactionDate: '2026-05-10', amount: 1500 }),
      makeTransaction({ transactionDate: '2026-02-01', amount: 800 }),
    ]
    const accounts = [makeAccount({ currentBalance: 50000 })]
    const rules = [makeRule()] // Rent due 20 Jun → 10000
    const loan = makeLoan({ id: 'l1', currentBalance: 100000, monthlyEMI: 20000 })
    const payments = [makePayment('l1', { paymentDate: '2026-06-10', amountPaid: 20000 })]

    const f = getForecast(txs, accounts, rules, [loan], payments, REF)
    expect(f.spentSoFar).toBe(5000)
    expect(f.incomeSoFar).toBe(20000)
    expect(f.upcomingObligations).toBe(30000) // rent 10000 + EMI due 20000
    // avg daily expense (7500/90) × 15 remaining days + 5000 so far
    expect(f.expenseProjection).toBeCloseTo(6250, 0)
    expect(f.incomeProjection).toBeCloseTo(23333.33, 0)
    // expectedBalance = balance + income − expense − obligations
    expect(f.expectedSavings).toBeCloseTo(f.incomeProjection - f.expenseProjection - 30000, 0)
    expect(f.expectedBalance).toBeCloseTo(50000 + f.expectedSavings, 0)
    expect(f.confidence).toBe('low')
  })

  it('raises confidence with a full month and rich history', () => {
    const txs = [makeTransaction({ transactionDate: '2026-06-01', type: 'income', amount: 50000 })]
    for (let i = 0; i < 40; i++) {
      txs.push(makeTransaction({ transactionDate: '2026-06-02', amount: 100 }))
    }
    const f = getForecast(txs, [makeAccount()], [], [], [], new Date(2026, 5, 25))
    expect(f.confidence).toBe('high')
  })

  it('handles empty data without crashing', () => {
    const f = getForecast([], [makeAccount()], [], [], [], REF)
    expect(f.upcomingObligations).toBe(0)
    expect(f.expenseProjection).toBe(0)
    expect(f.incomeProjection).toBe(0)
    expect(f.expectedSavings).toBe(0)
    expect(f.expectedBalance).toBe(50000)
    expect(f.confidence).toBe('low')
  })
})

describe('AnalyticsService namespace', () => {
  it('exposes every analytics function', () => {
    expect(AnalyticsService.getCashFlowSeries).toBe(getCashFlowSeries)
    expect(AnalyticsService.getCategoryBreakdown).toBe(getCategoryBreakdown)
    expect(AnalyticsService.getBudgetAnalysis).toBe(getBudgetAnalysis)
    expect(AnalyticsService.getLoanAnalysis).toBe(getLoanAnalysis)
    expect(AnalyticsService.getSpendingHeatmap).toBe(getSpendingHeatmap)
    expect(AnalyticsService.getYearOverYear).toBe(getYearOverYear)
    expect(AnalyticsService.getForecast).toBe(getForecast)
  })
})
