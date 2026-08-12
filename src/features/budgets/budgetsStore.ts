import { create } from 'zustand'
import { BudgetRepository } from '@/repositories/BudgetRepository'
import type { Budget } from '@/types/entities'

interface BudgetsState {
  budgets: Budget[]
  isLoading: boolean
  isError: boolean
  error: string | null
  load: () => Promise<void>
}

export const useBudgetsStore = create<BudgetsState>((set) => ({
  budgets: [],
  isLoading: true,
  isError: false,
  error: null,

  load: async () => {
    set({ isLoading: true, isError: false, error: null })
    try {
      const budgets = await BudgetRepository.getAll()
      set({ budgets, isLoading: false })
    } catch (e) {
      set({
        isLoading: false,
        isError: true,
        error: e instanceof Error ? e.message : 'Failed to load budgets',
      })
    }
  },
}))
