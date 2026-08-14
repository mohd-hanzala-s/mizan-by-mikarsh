import { create } from 'zustand'
import { BillSplitRepository } from '@/repositories/BillSplitRepository'
import type { BillSplit } from '@/types/entities'

interface BillSplitsState {
  splits: BillSplit[]
  isLoading: boolean
  isError: boolean
  error: string | null
  load: () => Promise<void>
}

export const useBillSplitsStore = create<BillSplitsState>((set) => ({
  splits: [],
  isLoading: true,
  isError: false,
  error: null,

  load: async () => {
    set({ isLoading: true, isError: false, error: null })
    try {
      const splits = await BillSplitRepository.getAll()
      set({ splits, isLoading: false })
    } catch (e) {
      set({
        isLoading: false,
        isError: true,
        error: e instanceof Error ? e.message : 'Failed to load splits',
      })
    }
  },
}))
