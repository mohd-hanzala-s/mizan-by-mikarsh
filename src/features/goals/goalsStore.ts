import { create } from 'zustand'
import { GoalRepository } from '@/repositories/GoalRepository'
import { GoalService } from '@/services/GoalService'
import type { Goal, GoalContribution, GoalType } from '@/types/entities'

interface GoalsState {
  goals: Goal[]
  contributionsByGoal: Record<string, GoalContribution[]>
  isLoading: boolean
  load: () => Promise<void>
  create: (params: {
    name: string
    type: GoalType
    targetAmount: number
    deadline: string | null
    categoryId: string | null
    notes?: string
  }) => Promise<Goal>
  update: (id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>) => Promise<void>
  contribute: (goalId: string, amount: number, date?: string, notes?: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  contributionsByGoal: {},
  isLoading: true,

  load: async () => {
    set({ isLoading: true })
    try {
      const goals = await GoalRepository.getAll()
      const contributionsByGoal: Record<string, GoalContribution[]> = {}
      for (const goal of goals) {
        contributionsByGoal[goal.id] = await GoalRepository.getContributions(goal.id)
      }
      set({ goals, contributionsByGoal, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  create: async (params) => {
    const goal = await GoalService.create(params)
    const { goals, contributionsByGoal } = get()
    set({
      goals: [...goals, goal],
      contributionsByGoal: { ...contributionsByGoal, [goal.id]: [] },
    })
    return goal
  },

  update: async (id, patch) => {
    const updated = await GoalService.update(id, patch)
    set({ goals: get().goals.map((g) => (g.id === id ? updated : g)) })
  },

  contribute: async (goalId, amount, date, notes) => {
    const updated = await GoalService.contribute(goalId, amount, date, notes)
    const contributionsByGoal = { ...get().contributionsByGoal }
    const current = contributionsByGoal[goalId] ?? []
    contributionsByGoal[goalId] = [...current]
    set({
      goals: get().goals.map((g) => (g.id === goalId ? updated : g)),
      contributionsByGoal,
    })
  },

  cancel: async (id) => {
    const updated = await GoalService.cancel(id)
    set({ goals: get().goals.map((g) => (g.id === id ? updated : g)) })
  },

  remove: async (id) => {
    await GoalService.remove(id)
    set({ goals: get().goals.filter((g) => g.id !== id) })
  },
}))
