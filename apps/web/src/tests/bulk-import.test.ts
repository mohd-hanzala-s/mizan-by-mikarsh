import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/database/db'
import { TransactionService } from '@/services/TransactionService'
import type { Transaction } from '@/types/entities'

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('TransactionService.bulkImport', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('imports rows and creates transactions', async () => {
    const result = await TransactionService.bulkImport([
      { date: todayIso(), type: 'expense', amount: 500, description: 'Groceries' },
      { date: todayIso(), type: 'income', amount: 50000, description: 'Salary' },
    ])

    expect(result.imported).toBe(2)
    expect(result.skipped).toBe(0)
    expect(result.errors).toHaveLength(0)

    const all = await db.transactions.toArray()
    expect(all).toHaveLength(2)
    const grocery = all.find((t) => t.description === 'Groceries')
    expect(grocery?.source).toBe('import')
    expect(grocery?.amount).toBe(500)
  })

  it('skips duplicate transactions', async () => {
    await TransactionService.bulkImport([
      { date: todayIso(), type: 'expense', amount: 500, description: 'Groceries' },
    ])

    const result = await TransactionService.bulkImport([
      { date: todayIso(), type: 'expense', amount: 500, description: 'Groceries' },
      { date: todayIso(), type: 'income', amount: 1000, description: 'Freelance' },
    ])

    expect(result.imported).toBe(1)
    expect(result.skipped).toBe(1)
    expect(result.errors).toHaveLength(0)

    const all = await db.transactions.toArray()
    expect(all).toHaveLength(2)
  })

  it('uses default account and category when not specified', async () => {
    await TransactionService.bulkImport([
      { date: todayIso(), type: 'expense', amount: 200, description: 'Misc' },
    ])

    const all = await db.transactions.toArray()
    expect(all[0].accountId).toBe('acc-cash')
    expect(all[0].categoryId).toBe('cat-other')
  })

  it('imports with tags', async () => {
    await TransactionService.bulkImport([
      {
        date: todayIso(),
        type: 'expense',
        amount: 300,
        description: 'Office supplies',
        tags: ['office', 'stationery'],
      },
    ])

    const all = await db.transactions.toArray()
    expect(all[0].tags).toContain('office')
    expect(all[0].tags).toContain('stationery')
  })

  it('returns errors for invalid rows without crashing', async () => {
    const result = await TransactionService.bulkImport([
      {
        date: todayIso(),
        type: 'invalid-type' as Transaction['type'],
        amount: -100,
        description: '',
      },
      { date: todayIso(), type: 'expense', amount: 500, description: 'Valid item' },
    ])

    expect(result.imported).toBe(1)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('applies balance effect for paid transactions', async () => {
    await TransactionService.bulkImport([
      { date: todayIso(), type: 'expense', amount: 200, description: 'Bus fare' },
    ])

    const account = await db.accounts.get('acc-cash')
    expect(account?.currentBalance).toBe(-200)
  })
})
