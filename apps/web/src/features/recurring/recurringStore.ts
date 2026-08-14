import { create } from 'zustand'
import { RecurringRepository } from '@/repositories/RecurringRepository'
import { TransactionRepository } from '@/repositories/TransactionRepository'
import { RecurringService } from '@/services/RecurringService'
import type { RecurringRule, Transaction } from '@/types/entities'

interface RecurringState {
  rules: RecurringRule[]
  generated: Transaction[]
  isLoading: boolean
  isError: boolean
  error: string | null
  load: () => Promise<void>
}

export const useRecurringStore = create<RecurringState>((set) => ({
  rules: [],
  generated: [],
  isLoading: true,
  isError: false,
  error: null,

  load: async () => {
    set({ isLoading: true, isError: false, error: null })
    try {
      await RecurringService.generateDue()
      const [rules, generated] = await Promise.all([
        RecurringRepository.getAllIncludingInactive(),
        TransactionRepository.getRecurringGenerated(),
      ])
      set({ rules, generated, isLoading: false })
    } catch (e) {
      set({
        isLoading: false,
        isError: true,
        error: e instanceof Error ? e.message : 'Failed to load recurring data',
      })
    }
  },
}))
