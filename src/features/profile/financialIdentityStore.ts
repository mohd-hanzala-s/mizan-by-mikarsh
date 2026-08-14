import { create } from 'zustand'
import type { FinancialIdentity } from '@/types/entities'

const STORAGE_KEY = 'mizan-financial-identity'
const LEGACY_PROFILE_KEY = 'mizan-profile'

const DEFAULT_AI_FEATURES = {
  forecasting: true,
  recommendations: true,
  autoCategorize: true,
  budgetSuggestions: true,
  goalPrediction: true,
} as const

function defaults(): FinancialIdentity {
  let legacyName = ''
  try {
    const raw = localStorage.getItem(LEGACY_PROFILE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.displayName) legacyName = parsed.displayName
    }
  } catch {
    // ignore
  }

  return {
    id: 'active',
    displayName: legacyName,
    profileType: 'employee',
    monthlyIncome: 0,
    incomeFrequency: 'monthly',
    salaryDay: 1,
    employmentType: '',
    employerName: '',
    dependents: 0,
    taxBracket: '',
    country: 'IN',
    language: 'en',
    weekStartsOn: 1,
    riskAppetite: 'balanced',
    aiFeatures: { ...DEFAULT_AI_FEATURES },
  }
}

function readStored(): FinancialIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FinancialIdentity
  } catch {
    return null
  }
}

function writeStored(identity: FinancialIdentity) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
  } catch {
    // localStorage not available
  }
}

interface FinancialIdentityState {
  identity: FinancialIdentity | null
  load: () => void
  save: (patch: Partial<FinancialIdentity>) => void
  reset: () => void
}

export const useFinancialIdentityStore = create<FinancialIdentityState>((set, get) => ({
  identity: null,

  load: () => {
    const stored = readStored()
    const identity = stored ?? defaults()
    if (!stored) writeStored(identity)
    set({ identity })
  },

  save: (patch) => {
    const current = get().identity ?? defaults()
    const updated: FinancialIdentity = { ...current, ...patch }
    writeStored(updated)
    set({ identity: updated })
  },

  reset: () => {
    const identity = defaults()
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    set({ identity })
  },
}))
