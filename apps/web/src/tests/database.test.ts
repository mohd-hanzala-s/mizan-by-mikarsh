import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Dexie from 'dexie'
import { db } from '@/database/db'

describe('database seeding', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('seeds the five default accounts (§6)', async () => {
    const accounts = await db.accounts.toArray()
    expect(accounts).toHaveLength(5)
    expect(accounts.map((a) => a.name).sort()).toEqual(
      ['Bank Account', 'Cash', 'Credit Card', 'Emergency Fund', 'UPI Wallet'].sort()
    )
    accounts.forEach((a) => expect(a.currentBalance).toBe(0))
  })

  it('seeds default categories', async () => {
    const categories = await db.categories.toArray()
    expect(categories.length).toBeGreaterThan(0)
    expect(categories.every((c) => c.isDefault)).toBe(true)
  })

  it('seeds one settings row with budgetMonthStart on the 1st', async () => {
    const settings = await db.settings.get('active')
    expect(settings).toBeDefined()
    expect(settings?.budgetMonthStart).toBe(1)
    expect(settings?.onboardingCompleted).toBe(false)
    expect(settings?.currency).toBe('INR')
  })
})

describe('legacy database migration', () => {
  /** Rebuild the legacy `nexus-finance` database with the same v6 schema,
   * seed a couple of rows into it, then recreate the `mizan` database and
   * assert the legacy rows were copied across by the rename migration. */
  async function seedLegacyDb() {
    const legacy = new Dexie('nexus-finance')
    legacy.version(6).stores({
      accounts: 'id, type',
      categories: 'id, name, parentCategory',
      settings: 'id',
      transactions:
        'id, transactionDate, categoryId, accountId, amount, type, status, recurringRuleId, loanId',
      favorites: 'id, categoryId, usageCount, lastUsed',
      tags: 'id, &name',
      budgets: 'id, categoryId',
      recurring_rules: 'id, nextExecution',
      loans: 'id, dueDay, status',
      loan_payments: 'id, loanId, paymentDate',
    })
    await legacy.open()
    const now = new Date().toISOString()
    await legacy.table('accounts').add({
      id: 'acc-legacy',
      name: 'Legacy Cash',
      type: 'cash',
      icon: 'Banknote',
      color: '#16A34A',
      openingBalance: 1000,
      currentBalance: 1000,
      isDefault: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    })
    await legacy.table('transactions').add({
      id: 'txn-legacy',
      createdAt: now,
      updatedAt: now,
      transactionDate: '2026-01-05',
      type: 'expense',
      amount: 250,
      currency: 'INR',
      description: 'Legacy tea',
      categoryId: 'cat-food',
      accountId: 'acc-legacy',
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
    })
    legacy.close()
  }

  beforeEach(async () => {
    await db.delete()
  })

  afterEach(async () => {
    await Dexie.delete('nexus-finance')
  })

  it('copies legacy accounts and transactions into the renamed database', async () => {
    await seedLegacyDb()
    await db.migrateLegacyIfNeeded()
    await db.open()

    const accounts = await db.accounts.toArray()
    const transactions = await db.transactions.toArray()
    expect(accounts.some((a) => a.id === 'acc-legacy')).toBe(true)
    expect(transactions.some((t) => t.id === 'txn-legacy')).toBe(true)
  })

  it('still seeds defaults when no legacy database exists', async () => {
    await db.open()
    const accounts = await db.accounts.toArray()
    expect(accounts).toHaveLength(5)
  })

  it('is a no-op once the mizan database already exists', async () => {
    await db.open()
    await seedLegacyDb()
    await db.migrateLegacyIfNeeded()

    const accounts = await db.accounts.toArray()
    expect(accounts.some((a) => a.id === 'acc-legacy')).toBe(false)
    expect(accounts).toHaveLength(5)
  })
})
