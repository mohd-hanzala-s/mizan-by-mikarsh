import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/database/db'
import { BillSplitService, splitEqually, computeSummary } from '@/services/BillSplitService'
import type { BillSplit } from '@/types/entities'

describe('splitEqually', () => {
  it('splits evenly when the total divides cleanly', () => {
    // ₹100 across payer + 3 friends = 4-way, ₹25 each
    const shares = splitEqually(100, ['Alice', 'Bob', 'Carol'])
    expect(shares).toEqual([
      { name: 'Alice', shareAmount: 25 },
      { name: 'Bob', shareAmount: 25 },
      { name: 'Carol', shareAmount: 25 },
    ])
  })

  it('hands the leftover rupee(s) to the first participants, not the payer', () => {
    // ₹100 across payer + 2 friends = 3-way: 33, 33, 33 with 1 left over.
    const shares = splitEqually(100, ['Alice', 'Bob'])
    expect(shares[0].shareAmount).toBe(34) // gets the leftover rupee
    expect(shares[1].shareAmount).toBe(33)
    const totalParticipantShare = shares.reduce((s, p) => s + p.shareAmount, 0)
    // Payer's implicit share: 100 - 67 = 33 — never more than a fair share.
    expect(totalParticipantShare).toBe(67)
  })

  it('gives the sole participant exactly half of an even total', () => {
    const shares = splitEqually(100, ['Alice'])
    expect(shares).toEqual([{ name: 'Alice', shareAmount: 50 }])
  })
})

describe('computeSummary', () => {
  function makeSplit(overrides: Partial<BillSplit> = {}): BillSplit {
    const now = new Date().toISOString()
    return {
      id: 'split-1',
      description: 'Dinner',
      totalAmount: 100,
      transactionId: null,
      participants: [
        { id: 'p1', name: 'Alice', shareAmount: 34, isSettled: true, settledAt: now },
        { id: 'p2', name: 'Bob', shareAmount: 33, isSettled: false, settledAt: null },
      ],
      date: now.slice(0, 10),
      notes: '',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }
  }

  it('sums owed, settled, and outstanding correctly', () => {
    const summary = computeSummary(makeSplit())
    expect(summary.totalOwed).toBe(67)
    expect(summary.totalSettled).toBe(34)
    expect(summary.totalOutstanding).toBe(33)
  })

  it('reports zero outstanding when everyone has settled', () => {
    const split = makeSplit({
      participants: [
        { id: 'p1', name: 'Alice', shareAmount: 34, isSettled: true, settledAt: '2026-01-01' },
        { id: 'p2', name: 'Bob', shareAmount: 33, isSettled: true, settledAt: '2026-01-01' },
      ],
    })
    expect(computeSummary(split).totalOutstanding).toBe(0)
  })
})

describe('BillSplitService CRUD', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('rejects a split with no participants', async () => {
    await expect(
      BillSplitService.create({
        description: 'Solo dinner',
        totalAmount: 100,
        participantNames: [],
      })
    ).rejects.toThrow()
  })

  it('rejects a zero or negative total', async () => {
    await expect(
      BillSplitService.create({
        description: 'Dinner',
        totalAmount: 0,
        participantNames: ['Alice'],
      })
    ).rejects.toThrow()
  })

  it('creates a split with unsettled participants by default', async () => {
    const split = await BillSplitService.create({
      description: 'Movie night',
      totalAmount: 60,
      participantNames: ['Alice', 'Bob'],
    })
    expect(split.participants).toHaveLength(2)
    expect(split.participants.every((p) => !p.isSettled)).toBe(true)
  })

  it('toggleSettled flips one participant without affecting the other', async () => {
    const split = await BillSplitService.create({
      description: 'Groceries',
      totalAmount: 90,
      participantNames: ['Alice', 'Bob'],
    })
    const [alice, bob] = split.participants

    await BillSplitService.toggleSettled(split.id, alice.id)

    const { BillSplitRepository } = await import('@/repositories/BillSplitRepository')
    const updated = await BillSplitRepository.getById(split.id)
    const updatedAlice = updated!.participants.find((p) => p.id === alice.id)!
    const updatedBob = updated!.participants.find((p) => p.id === bob.id)!
    expect(updatedAlice.isSettled).toBe(true)
    expect(updatedAlice.settledAt).not.toBeNull()
    expect(updatedBob.isSettled).toBe(false)
  })
})
