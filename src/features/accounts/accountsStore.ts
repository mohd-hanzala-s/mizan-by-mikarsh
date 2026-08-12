import { create } from 'zustand'
import { AccountRepository } from '@/repositories/AccountRepository'
import type { Account } from '@/types/entities'

interface AccountsState {
  accounts: Account[]
  archivedAccounts: Account[]
  isLoading: boolean
  isError: boolean
  error: string | null
  load: () => Promise<void>
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  archivedAccounts: [],
  isLoading: true,
  isError: false,
  error: null,

  load: async () => {
    set({ isLoading: true, isError: false, error: null })
    try {
      const all = await AccountRepository.getAllIncludingArchived()
      set({
        accounts: all.filter((a) => !a.isArchived),
        archivedAccounts: all.filter((a) => a.isArchived),
        isLoading: false,
      })
    } catch (e) {
      set({
        isLoading: false,
        isError: true,
        error: e instanceof Error ? e.message : 'Failed to load accounts',
      })
    }
  },
}))
