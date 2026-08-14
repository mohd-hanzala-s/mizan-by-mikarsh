import { db } from '@/database/db'
import type { Investment } from '@/types/entities'

export const InvestmentRepository = {
  /** Active holdings only — what most screens (Dashboard, Investments
   * list) care about. */
  async getAll(): Promise<Investment[]> {
    const all = await db.investments.toArray()
    return all.filter((i) => i.status === 'active')
  },

  /** Includes sold holdings — for a full history view. Newest first. */
  async getAllIncludingSold(): Promise<Investment[]> {
    const all = await db.investments.toArray()
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async getById(id: string): Promise<Investment | undefined> {
    return db.investments.get(id)
  },

  async add(investment: Investment): Promise<void> {
    await db.investments.add(investment)
  },

  async update(id: string, patch: Partial<Investment>): Promise<void> {
    await db.investments.update(id, { ...patch, updatedAt: new Date().toISOString() })
  },

  async delete(id: string): Promise<void> {
    await db.investments.delete(id)
  },
}
