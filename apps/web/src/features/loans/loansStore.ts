import { create } from 'zustand'
import { LoanRepository } from '@/repositories/LoanRepository'
import type { Loan, LoanPayment } from '@/types/entities'

interface LoansState {
  loans: Loan[]
  payments: LoanPayment[]
  isLoading: boolean
  isError: boolean
  error: string | null
  load: () => Promise<void>
}

export const useLoansStore = create<LoansState>((set) => ({
  loans: [],
  payments: [],
  isLoading: true,
  isError: false,
  error: null,

  load: async () => {
    set({ isLoading: true, isError: false, error: null })
    try {
      const [loans, payments] = await Promise.all([
        LoanRepository.getAllIncludingCompleted(),
        LoanRepository.getAllPayments(),
      ])
      set({ loans, payments, isLoading: false })
    } catch (e) {
      set({
        isLoading: false,
        isError: true,
        error: e instanceof Error ? e.message : 'Failed to load loans',
      })
    }
  },
}))
