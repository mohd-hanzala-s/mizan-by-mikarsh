import { db } from '@/database/db'
import type { Goal, GoalContribution } from '@/types/entities'

export const GoalRepository = {
  getAll(): Promise<Goal[]> {
    return db.goals.toArray()
  },

  getById(id: string): Promise<Goal | undefined> {
    return db.goals.get(id)
  },

  async add(goal: Goal): Promise<Goal> {
    await db.goals.add(goal)
    return goal
  },

  async update(id: string, patch: Partial<Goal>): Promise<Goal> {
    const updated = await db.goals.update(id, { ...patch, updatedAt: new Date().toISOString() })
    if (updated === 0) throw new Error(`Goal ${id} not found`)
    const goal = await db.goals.get(id)
    if (!goal) throw new Error(`Goal ${id} not found after update`)
    return goal
  },

  async remove(id: string): Promise<void> {
    await db.goal_contributions.where('goalId').equals(id).delete()
    await db.goals.delete(id)
  },

  getContributions(goalId: string): Promise<GoalContribution[]> {
    return db.goal_contributions.where('goalId').equals(goalId).toArray()
  },

  async addContribution(contribution: GoalContribution): Promise<GoalContribution> {
    await db.goal_contributions.add(contribution)
    return contribution
  },

  async removeContribution(id: string): Promise<void> {
    await db.goal_contributions.delete(id)
  },
}
