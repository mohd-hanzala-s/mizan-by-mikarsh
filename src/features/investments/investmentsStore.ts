import { create } from 'zustand'
import { InvestmentRepository } from '@/repositories/InvestmentRepository'
import type { Investment } from '@/types/entities'

interface InvestmentsState {
  investments: Investment[]
  isLoading: boolean
  isError: boolean
  error: string | null
  load: () => Promise<void>
}

export const useInvestmentsStore = create<InvestmentsState>((set) => ({
  investments: [],
  isLoading: true,
  isError: false,
  error: null,

  load: async () => {
    set({ isLoading: true, isError: false, error: null })
    try {
      const investments = await InvestmentRepository.getAllIncludingSold()
      set({ investments, isLoading: false })
    } catch (e) {
      set({
        isLoading: false,
        isError: true,
        error: e instanceof Error ? e.message : 'Failed to load investments',
      })
    }
  },
}))
