import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/database/db'
import { TransactionService } from '@/services/TransactionService'
import { TagRepository } from '@/repositories/TagRepository'

describe('Transaction tags', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('creates new tags on first use and stores them on the transaction', async () => {
    const tx = await TransactionService.create({
      amount: 250,
      description: 'Lunch with team',
      type: 'expense',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      transactionDate: new Date().toISOString(),
      tags: ['work', 'team-lunch'],
    })

    expect(tx.tags).toEqual(['work', 'team-lunch'])
    const allTags = await TagRepository.getAll()
    expect(allTags.map((t) => t.name).sort()).toEqual(['team-lunch', 'work'])
  })

  it('reuses an existing tag case-insensitively rather than duplicating it', async () => {
    await TransactionService.create({
      amount: 100,
      description: 'Coffee',
      type: 'expense',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      transactionDate: new Date().toISOString(),
      tags: ['Work'],
    })
    await TransactionService.create({
      amount: 50,
      description: 'Snacks',
      type: 'expense',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      transactionDate: new Date().toISOString(),
      tags: ['work'],
    })

    const allTags = await TagRepository.getAll()
    expect(allTags).toHaveLength(1)
  })

  it('updates a transaction to add and remove tags', async () => {
    const tx = await TransactionService.create({
      amount: 500,
      description: 'Groceries',
      type: 'expense',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      transactionDate: new Date().toISOString(),
      tags: ['household'],
    })

    const updated = await TransactionService.update(tx.id, {
      amount: tx.amount,
      description: tx.description,
      type: 'expense',
      categoryId: tx.categoryId,
      accountId: tx.accountId,
      transactionDate: tx.transactionDate,
      tags: ['household', 'monthly'],
    })

    expect(updated.tags.sort()).toEqual(['household', 'monthly'])
  })

  it('defaults to no tags when none are provided', async () => {
    const tx = await TransactionService.create({
      amount: 75,
      description: 'Bus fare',
      type: 'expense',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      transactionDate: new Date().toISOString(),
    })

    expect(tx.tags).toEqual([])
  })
})
