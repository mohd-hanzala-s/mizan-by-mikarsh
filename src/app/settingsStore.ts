import { create } from 'zustand'
import { SettingsRepository } from '@/repositories/SettingsRepository'
import type { Settings } from '@/types/entities'

interface SettingsState {
  settings: Settings | null
  isLoading: boolean
  isError: boolean
  error: string | null
  load: () => Promise<void>
  update: (patch: Partial<Omit<Settings, 'id'>>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: true,
  isError: false,
  error: null,

  load: async () => {
    set({ isLoading: true, isError: false, error: null })
    try {
      const settings = await SettingsRepository.get()
      set({ settings, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        isError: true,
        error: err instanceof Error ? err.message : 'Failed to load settings',
      })
    }
  },

  update: async (patch) => {
    try {
      const settings = await SettingsRepository.update(patch)
      set({ settings, isError: false, error: null })
    } catch (err) {
      set({
        isError: true,
        error: err instanceof Error ? err.message : 'Failed to save settings',
      })
    }
  },
}))
