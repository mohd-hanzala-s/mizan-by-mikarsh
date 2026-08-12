import { describe, it, expect } from 'vitest'
import {
  InsightService,
  computeHealthScore,
  getRecommendations,
  computeCategoryGrowth,
  getAnomalies,
  getMonthlyProfile,
  getSavingsSuggestions,
} from '@/services/InsightService'
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

/** Six months of quiet history — one small expense each month so the
 * consistency factor is 100 and the forecast stays healthy. */
function quietHistory(): Transaction[] {
  return [
    makeTransaction({ transactionDate: '2026-01-10', amount: 200 }),
    makeTransaction({ transactionDate: '2026-02-10', amount: 200 }),
    makeTransaction({ transactionDate: '2026-03-10', amount: 200 }),
    makeTransaction({ transactionDate: '2026-04-10', amount: 200 }),
    makeTransaction({ transactionDate: '2026-05-10', amount: 200 }),
    makeTransaction({ transactionDate: '2026-06-10', amount: 200 }),
  ]
}

describe('computeHealthScore', () => {
  const loans: Loan[] = []
  const payments: LoanPayment[] = []
  const rules: RecurringRule[] = []

  it('returns the weighted average of the six canonical factors', () => {
    const health = computeHealthScore(
      quietHistory(),
      [makeAccount()],
      [],
      loans,
      payments,
      rules,
      1,
      REF
    )
    const totalWeight = health.factors.reduce((s, f) => s + f.weight, 0)
    expect(totalWeight).toBe(100)
    expect(health.factors).toHaveLength(6)
    const expected = Math.round(health.factors.reduce((s, f) => s + f.contribution, 0))
    expect(health.score).toBe(expected)
    expect(health.factors.map((f) => f.key)).toEqual([
      'savings',
      'budget',
      'debt',
      'consistency',
      'forecast',
      'obligations',
    ])
  })

  it('gives a perfect savings, debt, consistency, forecast and obligations score in a healthy scenario', () => {
    const txs = [
      // Jan–Mar small expenses keep the consistency factor at 100
      makeTransaction({ transactionDate: '2026-01-10', amount: 200 }),
      makeTransaction({ transactionDate: '2026-02-10', amount: 200 }),
      makeTransaction({ transactionDate: '2026-03-10', amount: 200 }),
      makeTransaction({ transactionDate: '2026-04-05', type: 'income', amount: 50000 }),
      makeTransaction({ transactionDate: '2026-04-06', type: 'expense', amount: 10000 }),
      makeTransaction({ transactionDate: '2026-05-05', type: 'income', amount: 50000 }),
      makeTransaction({ transactionDate: '2026-05-06', type: 'expense', amount: 10000 }),
      makeTransaction({ transactionDate: '2026-06-05', type: 'income', amount: 50000 }),
      makeTransaction({ transactionDate: '2026-06-06', type: 'expense', amount: 10000 }),
    ]
    const health = computeHealthScore(
      txs,
      [makeAccount({ currentBalance: 80000 })],
      [],
      loans,
      payments,
      rules,
      1,
      REF
    )
    const byKey = new Map(health.factors.map((f) => [f.key, f.value]))
    // savings rate = 80% averaged over the three income months
    expect(byKey.get('savings')).toBeCloseTo(80, 1)
    // no budgets → neutral 50
    expect(byKey.get('budget')).toBe(50)
    // no debt → 100
    expect(byKey.get('debt')).toBe(100)
    // six active months → 100
    expect(byKey.get('consistency')).toBe(100)
    // positive expected savings → 100
    expect(byKey.get('forecast')).toBe(100)
    expect(byKey.get('obligations')).toBe(100)
  })

  it('penalises a negative savings rate', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-04-05', type: 'income', amount: 10000 }),
      makeTransaction({ transactionDate: '2026-04-06', type: 'expense', amount: 15000 }),
      makeTransaction({ transactionDate: '2026-05-05', type: 'income', amount: 10000 }),
      makeTransaction({ transactionDate: '2026-05-06', type: 'expense', amount: 15000 }),
      makeTransaction({ transactionDate: '2026-06-05', type: 'income', amount: 10000 }),
      makeTransaction({ transactionDate: '2026-06-06', type: 'expense', amount: 15000 }),
    ]
    const health = computeHealthScore(
      txs,
      [makeAccount({ currentBalance: 80000 })],
      [],
      loans,
      payments,
      rules,
      1,
      REF
    )
    const byKey = new Map(health.factors.map((f) => [f.key, f.value]))
    expect(byKey.get('savings')).toBe(0) // -50% clamped to 0
  })

  it('penalises a high debt ratio', () => {
    const withDebt = computeHealthScore(
      quietHistory(),
      [makeAccount({ currentBalance: 40000 })],
      [],
      [makeLoan({ currentBalance: 60000 })],
      payments,
      rules,
      1,
      REF
    )
    const noDebt = computeHealthScore(
      quietHistory(),
      [makeAccount({ currentBalance: 40000 })],
      [],
      loans,
      payments,
      rules,
      1,
      REF
    )
    const withKey = new Map(withDebt.factors.map((f) => [f.key, f.value]))
    const withoutKey = new Map(noDebt.factors.map((f) => [f.key, f.value]))
    expect(withKey.get('debt')!).toBeLessThan(withoutKey.get('debt')!)
    expect(withKey.get('debt')).toBeCloseTo(40, 1) // 1 - 60000/100000
  })

  it('penalises missed obligations: an overdue loan and a past-due auto entry', () => {
    const overdueLoan = makeLoan({ dueDay: 5, currentBalance: 50000 }) // due day 5 already passed in June
    const txs = [
      makeTransaction({
        transactionDate: '2026-05-20',
        type: 'expense',
        amount: 900,
        source: 'auto',
        status: 'pending',
        recurringRuleId: 'rule-x',
      }),
    ]
    const health = computeHealthScore(txs, [makeAccount()], [], [overdueLoan], [], rules, 1, REF)
    const byKey = new Map(health.factors.map((f) => [f.key, f.value]))
    // two missed items × 25 penalty
    expect(byKey.get('obligations')).toBe(50)
  })

  it('only counts non-archived accounts toward the asset base', () => {
    const txs = quietHistory()
    const health = computeHealthScore(
      txs,
      [
        makeAccount({ currentBalance: 100000 }),
        makeAccount({ isArchived: true, currentBalance: 100000 }),
      ],
      [],
      [],
      payments,
      rules,
      1,
      REF
    )
    const byKey = new Map(health.factors.map((f) => [f.key, f.value]))
    expect(byKey.get('debt')).toBe(100)
  })

  it('surfaces top strength, top concern and a recommended action', () => {
    const health = computeHealthScore(
      quietHistory(),
      [makeAccount()],
      [],
      loans,
      payments,
      rules,
      1,
      REF
    )
    expect(health.topStrength.value).toBeGreaterThanOrEqual(50)
    expect(health.topConcern.value).toBeLessThanOrEqual(50)
    expect(health.recommendedAction.length).toBeGreaterThan(0)
  })
})

describe('computeCategoryGrowth', () => {
  const categories = [
    makeCategory({ id: 'cat-food', name: 'Food' }),
    makeCategory({ id: 'cat-travel', name: 'Travel' }),
    makeCategory({ id: 'cat-new', name: 'New' }),
  ]

  it('compares current month spend to the previous three-month average', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 1200, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-05-03', amount: 400, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-04-03', amount: 400, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-03-03', amount: 400, categoryId: 'cat-food' }),
    ]
    const growth = computeCategoryGrowth(txs, categories, REF)
    const food = growth.find((g) => g.categoryId === 'cat-food')!
    expect(food.avgMonthlySpend).toBe(400)
    expect(food.currentMonthSpend).toBe(1200)
    expect(food.growthRatio).toBe(3)
  })

  it('marks categories with no prior spend as infinite growth', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 600, categoryId: 'cat-new' }),
    ]
    const growth = computeCategoryGrowth(txs, categories, REF)
    const row = growth.find((g) => g.categoryId === 'cat-new')!
    expect(row.growthRatio).toBe(Number.POSITIVE_INFINITY)
  })

  it('sorts by growth ratio descending and resolves missing names to Uncategorized', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 100, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-05-03', amount: 50, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-06-04', amount: 100, categoryId: 'cat-ghost' }),
    ]
    const growth = computeCategoryGrowth(txs, categories, REF)
    // ghost has no prior spend → Infinity, sorts above finite Food
    expect(growth[0].name).toBe('Uncategorized')
    expect(growth[1].name).toBe('Food')
    expect(growth).toHaveLength(2)
  })
})

describe('getRecommendations', () => {
  const categories = [makeCategory({ id: 'cat-food', name: 'Food' })]

  it('returns an empty list with no data', () => {
    const recs = getRecommendations([], [makeAccount()], [], categories, [], [], [], 1, REF)
    expect(recs).toEqual([])
  })

  it('flags a negative expected balance as critical', () => {
    const txs = [makeTransaction({ transactionDate: '2026-06-03', type: 'expense', amount: 90000 })]
    const recs = getRecommendations(
      txs,
      [makeAccount({ currentBalance: 1000 })],
      [],
      categories,
      [],
      [],
      [],
      1,
      REF
    )
    const negative = recs.find((r) => r.id === 'rec-negative-balance')
    expect(negative).toBeDefined()
    expect(negative!.priority).toBe('critical')
    expect(negative!.observation.length).toBeGreaterThan(0)
    expect(negative!.reason.length).toBeGreaterThan(0)
    expect(negative!.recommendation.length).toBeGreaterThan(0)
    expect(negative!.impact.length).toBeGreaterThan(0)
  })

  it('flags an overdue loan as critical', () => {
    const overdue = makeLoan({ dueDay: 5, currentBalance: 50000 })
    const recs = getRecommendations([], [makeAccount()], [], categories, [overdue], [], [], 1, REF)
    const loanRec = recs.find((r) => r.id === `rec-loan-overdue-${overdue.id}`)
    expect(loanRec).toBeDefined()
    expect(loanRec!.priority).toBe('critical')
  })

  it('flags an over-budget category as high', () => {
    const budget = makeBudget({ categoryId: 'cat-food', monthlyLimit: 1000 })
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 1500, categoryId: 'cat-food' }),
    ]
    const recs = getRecommendations(txs, [makeAccount()], [budget], categories, [], [], [], 1, REF)
    const over = recs.find((r) => r.id === `rec-budget-over-${budget.id}`)
    expect(over).toBeDefined()
    expect(over!.priority).toBe('high')
  })

  it('flags past-due auto-generated entries as high', () => {
    const txs = [
      makeTransaction({
        transactionDate: '2026-06-03',
        type: 'expense',
        amount: 900,
        source: 'auto',
        status: 'pending',
        recurringRuleId: 'rule-x',
      }),
    ]
    const recs = getRecommendations(txs, [makeAccount()], [], categories, [], [], [], 1, REF)
    const missed = recs.find((r) => r.id === 'rec-missed-recurring')
    expect(missed).toBeDefined()
    expect(missed!.priority).toBe('high')
  })

  it('flags a fast-rising month as high', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-05-03', type: 'expense', amount: 1000 }),
      makeTransaction({ transactionDate: '2026-06-03', type: 'expense', amount: 2000 }),
    ]
    const recs = getRecommendations(txs, [makeAccount()], [], categories, [], [], [], 1, REF)
    const rising = recs.find((r) => r.id === 'rec-rising-spend')
    expect(rising).toBeDefined()
    expect(rising!.priority).toBe('high')
  })

  it('flags a growing category as medium', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 1500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-05-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-04-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-03-03', amount: 500, categoryId: 'cat-food' }),
    ]
    const recs = getRecommendations(txs, [makeAccount()], [], categories, [], [], [], 1, REF)
    const growth = recs.find((r) => r.id === 'rec-growth-cat-food')
    expect(growth).toBeDefined()
    expect(growth!.priority).toBe('medium')
    expect(growth!.recommendation).toMatch(/review recent food/i)
  })

  it('orders recommendations critical → high → medium → low', () => {
    const budget = makeBudget({ categoryId: 'cat-food', monthlyLimit: 500 })
    const overdue = makeLoan({ dueDay: 5, currentBalance: 50000 })
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 1500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-06-04', type: 'income', amount: 30000 }),
      makeTransaction({ transactionDate: '2026-05-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-04-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-03-03', amount: 500, categoryId: 'cat-food' }),
    ]
    const recs = getRecommendations(
      txs,
      [makeAccount({ currentBalance: 200000 })],
      [budget],
      categories,
      [overdue],
      [],
      [],
      1,
      REF
    )
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    const priorities = recs.map((r) => order[r.priority])
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b))
    expect(recs.length).toBeGreaterThanOrEqual(4)
  })
})

describe('getAnomalies', () => {
  const categories = [makeCategory({ id: 'cat-food', name: 'Food' })]

  it('detects the largest purchase of the month', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 500 }),
      makeTransaction({ transactionDate: '2026-06-04', amount: 2000 }),
    ]
    const anomalies = getAnomalies(txs, categories, REF)
    const largest = anomalies.find((a) => a.type === 'largest-purchase')
    expect(largest).toBeDefined()
    expect(largest!.description).toContain('₹2,000')
  })

  it('detects unusual category growth', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 1500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-05-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-04-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-03-03', amount: 500, categoryId: 'cat-food' }),
    ]
    const anomalies = getAnomalies(txs, categories, REF)
    const growth = anomalies.find((a) => a.type === 'category-growth')
    expect(growth).toBeDefined()
    expect(growth!.description).toMatch(/above average/)
  })

  it('detects a spending spike on a single day', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-10', amount: 3000 }),
      // light previous months → low daily average
      makeTransaction({ transactionDate: '2026-05-01', amount: 100 }),
      makeTransaction({ transactionDate: '2026-04-01', amount: 100 }),
      makeTransaction({ transactionDate: '2026-03-01', amount: 100 }),
    ]
    const anomalies = getAnomalies(txs, categories, REF)
    const spike = anomalies.find((a) => a.type === 'spending-spike')
    expect(spike).toBeDefined()
    expect(spike!.description).toMatch(/Spending spike on day 10/)
  })

  it('returns an empty list with no expenses this month', () => {
    expect(getAnomalies([], categories, REF)).toEqual([])
  })
})

describe('getMonthlyProfile', () => {
  const categories = [makeCategory({ id: 'cat-food', name: 'Food' })]

  it('summarises the month from current-month transactions', () => {
    const txs = [
      makeTransaction({
        transactionDate: '2026-06-03',
        amount: 400,
        categoryId: 'cat-food',
        description: 'Groceries run',
      }),
      makeTransaction({
        transactionDate: '2026-06-03',
        amount: 100,
        categoryId: 'cat-food',
        description: 'Snacks',
        recurringRuleId: 'rule-x',
      }),
      makeTransaction({
        transactionDate: '2026-06-10',
        type: 'income',
        amount: 50000,
        description: 'Salary',
        categoryId: 'cat-salary',
      }),
      // outside the month — excluded
      makeTransaction({ transactionDate: '2026-05-30', amount: 900, categoryId: 'cat-food' }),
    ]
    const profile = getMonthlyProfile(txs, categories, REF)
    expect(profile.monthLabel).toBe('June 2026')
    expect(profile.highestSpendingCategory!.name).toBe('Food')
    expect(profile.highestSpendingCategory!.amount).toBe(500)
    expect(profile.largestTransaction!.description).toBe('Salary')
    expect(profile.mostActiveDay).toBe(3)
    expect(profile.mostUsedCategory!.count).toBe(2)
    expect(profile.recurringPaymentCount).toBe(1)
    expect(profile.savingsAchieved).toBe(49500)
    expect(profile.averageDailySpend).toBeGreaterThan(0)
  })

  it('returns nulls when there is no activity this month', () => {
    const profile = getMonthlyProfile([], categories, REF)
    expect(profile.highestSpendingCategory).toBeNull()
    expect(profile.mostActiveDay).toBeNull()
    expect(profile.largestTransaction).toBeNull()
    expect(profile.vsPreviousMonth).toBeNull()
  })
})

describe('getSavingsSuggestions', () => {
  const categories = [
    makeCategory({ id: 'cat-food', name: 'Food' }),
    makeCategory({ id: 'cat-travel', name: 'Travel' }),
    makeCategory({ id: 'cat-dining', name: 'Dining' }),
    makeCategory({ id: 'cat-stable', name: 'Stable' }),
  ]

  it('suggests cutting the top three growing categories by 10%', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 2000, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-05-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-06-04', amount: 1000, categoryId: 'cat-travel' }),
      makeTransaction({ transactionDate: '2026-05-04', amount: 100, categoryId: 'cat-travel' }),
      makeTransaction({ transactionDate: '2026-06-05', amount: 800, categoryId: 'cat-dining' }),
      makeTransaction({ transactionDate: '2026-05-05', amount: 200, categoryId: 'cat-dining' }),
      // stable category — no growth, skipped
      makeTransaction({ transactionDate: '2026-06-06', amount: 500, categoryId: 'cat-stable' }),
      makeTransaction({ transactionDate: '2026-05-06', amount: 500, categoryId: 'cat-stable' }),
      makeTransaction({ transactionDate: '2026-04-06', amount: 500, categoryId: 'cat-stable' }),
      makeTransaction({ transactionDate: '2026-03-06', amount: 500, categoryId: 'cat-stable' }),
    ]
    const suggestions = getSavingsSuggestions(txs, categories, REF)
    expect(suggestions).toHaveLength(3)
    // sorted by growth ratio desc: Travel (10x) then Food and Dining (4x)
    expect(suggestions.map((s) => s.categoryName)).toEqual(['Travel', 'Food', 'Dining'])
    const food = suggestions.find((s) => s.categoryName === 'Food')!
    expect(food.potential).toBe(200) // 10% of ₹2,000
    expect(food.currentMonthSpend).toBe(2000)
  })

  it('returns an empty list when nothing is growing', () => {
    const txs = [
      makeTransaction({ transactionDate: '2026-06-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-05-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-04-03', amount: 500, categoryId: 'cat-food' }),
      makeTransaction({ transactionDate: '2026-03-03', amount: 500, categoryId: 'cat-food' }),
    ]
    expect(getSavingsSuggestions(txs, categories, REF)).toEqual([])
  })
})

describe('InsightService', () => {
  it('exposes every public derivation as a service method', () => {
    expect(typeof InsightService.computeHealthScore).toBe('function')
    expect(typeof InsightService.getRecommendations).toBe('function')
    expect(typeof InsightService.getAnomalies).toBe('function')
    expect(typeof InsightService.getMonthlyProfile).toBe('function')
    expect(typeof InsightService.getSavingsSuggestions).toBe('function')
    expect(typeof InsightService.computeCategoryGrowth).toBe('function')
  })
})
