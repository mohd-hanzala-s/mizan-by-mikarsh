import { describe, it, expect } from 'vitest'
import {
  ReportService,
  getReportPeriod,
  shiftPeriod,
  listReportPeriods,
  getPeriodReport,
  type ReportPeriodType,
} from '@/services/ReportService'
import type { Account, Budget, Category, Transaction } from '@/types/entities'

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
    id: 'cat-food',
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

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-cash',
    name: 'Cash',
    type: 'cash',
    icon: 'banknote',
    color: '#10B981',
    openingBalance: 0,
    currentBalance: 0,
    isDefault: false,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
    currency: 'INR',
    ...overrides,
  }
}

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: crypto.randomUUID(),
    categoryId: 'cat-food',
    monthlyLimit: 2000,
    rolloverEnabled: false,
    warningThreshold: 80,
    active: true,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  }
}

describe('getReportPeriod', () => {
  it('resolves a monthly period from the reference date', () => {
    const p = getReportPeriod('monthly', new Date(2026, 5, 15))
    expect(p.key).toBe('2026-06')
    expect(p.label).toBe('June 2026')
    expect(p.start.getFullYear()).toBe(2026)
    expect(p.start.getMonth()).toBe(5)
    expect(p.end.getMonth()).toBe(6)
  })

  it('resolves a quarterly period (Q2 covers Apr–Jun)', () => {
    const p = getReportPeriod('quarterly', new Date(2026, 5, 15))
    expect(p.key).toBe('2026-Q2')
    expect(p.label).toBe('Q2 2026')
    expect(p.start.getMonth()).toBe(3)
    expect(p.end.getMonth()).toBe(6)
  })

  it('resolves a yearly period', () => {
    const p = getReportPeriod('yearly', new Date(2026, 5, 15))
    expect(p.key).toBe('2026')
    expect(p.label).toBe('2026')
    expect(p.start.getMonth()).toBe(0)
    expect(p.end.getFullYear()).toBe(2027)
  })

  it('previous period is the immediately preceding same-length period', () => {
    const p = getReportPeriod('monthly', new Date(2026, 2, 10)) // March 2026
    expect(p.previous.key).toBe('2026-02')
    const q = getReportPeriod('quarterly', new Date(2026, 2, 10)) // Q1
    expect(q.previous.key).toBe('2025-Q4')
    const y = getReportPeriod('yearly', new Date(2026, 2, 10))
    expect(y.previous.key).toBe('2025')
  })
})

describe('shiftPeriod', () => {
  it('moves monthly periods forward and backward', () => {
    expect(shiftPeriod('monthly', new Date(2026, 5, 15), -1).key).toBe('2026-05')
    expect(shiftPeriod('monthly', new Date(2026, 5, 15), 1).key).toBe('2026-07')
  })

  it('handles year boundaries', () => {
    expect(shiftPeriod('monthly', new Date(2026, 0, 15), -1).key).toBe('2025-12')
    expect(shiftPeriod('monthly', new Date(2026, 11, 15), 1).key).toBe('2027-01')
    expect(shiftPeriod('quarterly', new Date(2026, 0, 15), -1).key).toBe('2025-Q4')
    expect(shiftPeriod('yearly', new Date(2026, 5, 15), 1).key).toBe('2027')
  })
})

describe('listReportPeriods', () => {
  it('returns just the current period when there is no data', () => {
    const periods = listReportPeriods('monthly', [])
    expect(periods).toHaveLength(1)
  })

  it('spans from the oldest to the newest transaction', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-01-10' }),
      makeTransaction({ transactionDate: '2026-03-15' }),
    ]
    const periods = listReportPeriods('monthly', transactions)
    expect(periods[0].key).toBe('2026-01')
    expect(periods[periods.length - 1].key).toBe('2026-03')
    expect(periods.map((p) => p.key)).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('ignores soft-deleted transactions', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-01-10' }),
      makeTransaction({ transactionDate: '2026-05-15', isDeleted: true }),
    ]
    const periods = listReportPeriods('monthly', transactions)
    expect(periods).toHaveLength(1)
    expect(periods[0].key).toBe('2026-01')
  })
})

describe('getPeriodReport', () => {
  const REF = new Date(2026, 5, 15) // June 2026

  it('summarizes income, expense, net, and savings rate for the period', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', type: 'income', amount: 10000 }),
      makeTransaction({ transactionDate: '2026-06-06', type: 'expense', amount: 1000 }),
      makeTransaction({ transactionDate: '2026-06-07', type: 'expense', amount: 1500 }),
      makeTransaction({ transactionDate: '2026-05-20', type: 'expense', amount: 9999 }), // previous month
    ]
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [],
      'monthly',
      REF
    )
    expect(report.summary.income).toBe(10000)
    expect(report.summary.expense).toBe(2500)
    expect(report.summary.net).toBe(7500)
    expect(report.summary.savingsRate).toBe(75)
    expect(report.summary.transactionCount).toBe(3)
  })

  it('excludes soft-deleted rows and transfers', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', type: 'expense', amount: 1000 }),
      makeTransaction({
        transactionDate: '2026-06-06',
        type: 'expense',
        amount: 500,
        isDeleted: true,
      }),
      makeTransaction({ transactionDate: '2026-06-07', type: 'transfer', amount: 2000 }),
    ]
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [],
      'monthly',
      REF
    )
    expect(report.summary.expense).toBe(1000)
  })

  it('builds a category breakdown sorted by amount with percentages', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', categoryId: 'cat-food', amount: 1000 }),
      makeTransaction({ transactionDate: '2026-06-06', categoryId: 'cat-fuel', amount: 500 }),
      makeTransaction({ transactionDate: '2026-06-07', categoryId: 'cat-food', amount: 500 }),
    ]
    const categories = [
      makeCategory({ id: 'cat-food', name: 'Food' }),
      makeCategory({ id: 'cat-fuel', name: 'Fuel' }),
    ]
    const report = getPeriodReport(transactions, categories, [makeAccount()], [], 'monthly', REF)
    expect(report.categoryBreakdown).toHaveLength(2)
    expect(report.categoryBreakdown[0]).toMatchObject({ categoryId: 'cat-food', amount: 1500 })
    expect(report.categoryBreakdown[0].percent).toBe(75)
    expect(report.categoryBreakdown[1]).toMatchObject({ categoryId: 'cat-fuel', amount: 500 })
  })

  it('names uncategorized expenses "Uncategorized"', () => {
    const transactions = [makeTransaction({ transactionDate: '2026-06-05', categoryId: 'missing' })]
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [],
      'monthly',
      REF
    )
    expect(report.categoryBreakdown[0].name).toBe('Uncategorized')
  })

  it('builds income and expense rows per account', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', type: 'income', amount: 1000 }),
      makeTransaction({ transactionDate: '2026-06-06', type: 'expense', amount: 400 }),
      makeTransaction({ transactionDate: '2026-06-07', type: 'expense', amount: 100 }),
    ]
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [
        makeAccount({ id: 'acc-cash', name: 'Cash' }),
        makeAccount({ id: 'acc-bank', name: 'Bank' }),
      ],
      [],
      'monthly',
      REF
    )
    const incomeRow = report.accountBreakdown.find((a) => a.type === 'income')
    const expenseRow = report.accountBreakdown.find((a) => a.type === 'expense')
    expect(incomeRow).toMatchObject({ accountId: 'acc-cash', amount: 1000 })
    expect(expenseRow).toMatchObject({ accountId: 'acc-cash', amount: 500 })
  })

  it('computes budget vs actual from monthlyLimit × months in the period', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', categoryId: 'cat-food', amount: 300 }),
    ]
    const budget = makeBudget({ categoryId: 'cat-food', monthlyLimit: 2000 })
    const monthly = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [budget],
      'monthly',
      REF
    )
    expect(monthly.budgetRows[0].allocated).toBe(2000)
    expect(monthly.budgetRows[0].spent).toBe(300)
    expect(monthly.budgetRows[0].percentUsed).toBe(15)
    expect(monthly.budgetRows[0].severity).toBe('ok')

    const yearly = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [budget],
      'yearly',
      REF
    )
    expect(yearly.budgetRows[0].allocated).toBe(24000)
  })

  it('marks over-budget rows as over and ignores inactive budgets', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', categoryId: 'cat-food', amount: 2500 }),
    ]
    const budget = makeBudget({ categoryId: 'cat-food', monthlyLimit: 2000, active: false })
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [budget],
      'monthly',
      REF
    )
    expect(report.budgetRows).toHaveLength(0)

    const active = makeBudget({ categoryId: 'cat-food', monthlyLimit: 2000, active: true })
    const report2 = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [active],
      'monthly',
      REF
    )
    expect(report2.budgetRows[0].severity).toBe('over')
  })

  it('groups top merchants by description with counts', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', description: 'Chai point', amount: 20 }),
      makeTransaction({ transactionDate: '2026-06-06', description: 'Chai point', amount: 30 }),
      makeTransaction({ transactionDate: '2026-06-07', description: 'Big store', amount: 500 }),
    ]
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [],
      'monthly',
      REF
    )
    expect(report.topMerchants[0]).toMatchObject({
      description: 'Big store',
      amount: 500,
      count: 1,
    })
    expect(report.topMerchants[1]).toMatchObject({
      description: 'Chai point',
      amount: 50,
      count: 2,
    })
  })

  it('reports % change vs the previous same-length period', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', type: 'income', amount: 10000 }),
      makeTransaction({ transactionDate: '2026-06-06', type: 'expense', amount: 1500 }),
      makeTransaction({ transactionDate: '2026-05-05', type: 'income', amount: 8000 }),
      makeTransaction({ transactionDate: '2026-05-06', type: 'expense', amount: 1000 }),
    ]
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [],
      'monthly',
      REF
    )
    expect(report.vsPrevious.incomeChange).toBe(25) // (10000-8000)/8000
    expect(report.vsPrevious.expenseChange).toBe(50) // (1500-1000)/1000
  })

  it('returns null % change when the previous period had no data', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-06-05', type: 'expense', amount: 100 }),
    ]
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [],
      'monthly',
      REF
    )
    expect(report.vsPrevious.incomeChange).toBeNull()
    expect(report.vsPrevious.expenseChange).toBeNull()
  })

  it('handles quarterly periods', () => {
    const transactions = [
      makeTransaction({ transactionDate: '2026-04-10', type: 'income', amount: 1000 }),
      makeTransaction({ transactionDate: '2026-05-10', type: 'expense', amount: 200 }),
      makeTransaction({ transactionDate: '2026-06-10', type: 'expense', amount: 100 }),
      makeTransaction({ transactionDate: '2026-07-10', type: 'expense', amount: 9999 }), // Q3
    ]
    const report = getPeriodReport(
      transactions,
      [makeCategory()],
      [makeAccount()],
      [],
      'quarterly',
      REF
    )
    expect(report.summary.income).toBe(1000)
    expect(report.summary.expense).toBe(300)
  })
})

describe('ReportService export', () => {
  it('exposes all report functions', () => {
    expect(ReportService.getPeriodReport).toBeTypeOf('function')
    expect(ReportService.getReportPeriod).toBeTypeOf('function')
    expect(ReportService.shiftPeriod).toBeTypeOf('function')
    expect(ReportService.listReportPeriods).toBeTypeOf('function')
  })

  it('period type union is one of monthly/quarterly/yearly', () => {
    const types: ReportPeriodType[] = ['monthly', 'quarterly', 'yearly']
    expect(types).toHaveLength(3)
  })
})
