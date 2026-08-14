import { db } from '@/database/db'
import type { BillSplit } from '@/types/entities'

export const BillSplitRepository = {
  /** Newest first — matches every other list-y repository's convention
   * (LoanRepository.getAllIncludingCompleted, InvestmentRepository's
   * getAllIncludingSold). */
  async getAll(): Promise<BillSplit[]> {
    const all = await db.bill_splits.toArray()
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async getById(id: string): Promise<BillSplit | undefined> {
    return db.bill_splits.get(id)
  },

  async add(split: BillSplit): Promise<void> {
    await db.bill_splits.add(split)
  },

  async update(id: string, patch: Partial<BillSplit>): Promise<void> {
    await db.bill_splits.update(id, { ...patch, updatedAt: new Date().toISOString() })
  },

  async delete(id: string): Promise<void> {
    await db.bill_splits.delete(id)
  },
}
