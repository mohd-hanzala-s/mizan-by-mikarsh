import { useState, useCallback, useRef } from 'react'
import { useSettingsStore } from '@/app/settingsStore'
import { useFinancialIdentityStore } from '@/features/profile/financialIdentityStore'
import { WelcomeStep } from './steps/WelcomeStep'
import { IncomeStep } from './steps/IncomeStep'
import { ExpensesStep, type ExpensesData } from './steps/ExpensesStep'
import { GoalsStep, type GoalEntry } from './steps/GoalsStep'
import { RiskStep } from './steps/RiskStep'
import { AssetsStep, type AssetEntry } from './steps/AssetsStep'
import { LiabilitiesStep, type LiabilityEntry } from './steps/LiabilitiesStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { AiFeaturesStep } from './steps/AiFeaturesStep'
import { PermissionsStep } from './steps/PermissionsStep'
import { BudgetService } from '@/services/BudgetService'
import { GoalService } from '@/services/GoalService'
import { LoanService } from '@/services/LoanService'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { GLOBAL_BUDGET_CATEGORY_ID } from '@/types/entities'
import type { ProfileType, IncomeFrequency, RiskAppetite, AiFeatures } from '@/types/entities'

const STEP_LABELS = [
  'Welcome',
  'Income',
  'Expenses',
  'Goals',
  'Risk',
  'Assets',
  'Liabilities',
  'Preferences',
  'AI Features',
  'Finish',
]

interface OnboardingData {
  profileType: ProfileType
  monthlyIncome: number
  incomeFrequency: IncomeFrequency
  salaryDay: number
  expenses: ExpensesData
  goals: GoalEntry[]
  riskAppetite: RiskAppetite
  assets: AssetEntry[]
  liabilities: LiabilityEntry[]
  country: string
  language: string
  currency: string
  aiFeatures: AiFeatures
}

const EMPTY_EXPENSES: ExpensesData = {
  rent: 0,
  emi: 0,
  utilities: 0,
  insurance: 0,
  other: 0,
}

const DEFAULT_DATA: OnboardingData = {
  profileType: 'employee',
  monthlyIncome: 0,
  incomeFrequency: 'monthly',
  salaryDay: 1,
  expenses: { ...EMPTY_EXPENSES },
  goals: [],
  riskAppetite: 'balanced',
  assets: [],
  liabilities: [],
  country: 'IN',
  language: 'en',
  currency: 'INR',
  aiFeatures: {
    forecasting: true,
    recommendations: true,
    autoCategorize: true,
    budgetSuggestions: true,
    goalPrediction: true,
  },
}

export function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const updateSettings = useSettingsStore((s) => s.update)
  const saveIdentity = useFinancialIdentityStore((s) => s.save)
  const loadSettings = useSettingsStore((s) => s.load)
  const dataRef = useRef<OnboardingData>({ ...DEFAULT_DATA })

  function updateData(patch: Partial<OnboardingData>) {
    dataRef.current = { ...dataRef.current, ...patch }
  }

  const advance = useCallback(() => {
    setStep((s) => s + 1)
  }, [])

  const goBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  async function finish() {
    const data = dataRef.current

    saveIdentity({
      profileType: data.profileType,
      monthlyIncome: data.monthlyIncome,
      incomeFrequency: data.incomeFrequency,
      salaryDay: data.salaryDay,
      riskAppetite: data.riskAppetite,
      aiFeatures: data.aiFeatures,
      country: data.country,
      language: data.language,
    })

    const totalExpenses =
      data.expenses.rent +
      data.expenses.emi +
      data.expenses.utilities +
      data.expenses.insurance +
      data.expenses.other

    const createPromises: Promise<unknown>[] = []

    if (totalExpenses > 0) {
      createPromises.push(
        BudgetService.create({
          categoryId: GLOBAL_BUDGET_CATEGORY_ID,
          monthlyLimit: totalExpenses,
          rolloverEnabled: false,
          warningThreshold: 80,
        }).catch(() => {})
      )
    }

    for (const g of data.goals) {
      if (g.targetAmount > 0) {
        createPromises.push(
          GoalService.create({
            name: g.label,
            type: g.type,
            targetAmount: g.targetAmount,
            deadline: null,
            categoryId: null,
          }).catch(() => {})
        )
      }
    }

    const today = new Date().toISOString().slice(0, 10)
    for (const l of data.liabilities) {
      if (l.balance > 0) {
        createPromises.push(
          LoanService.create({
            loanName: l.label,
            lender: '',
            originalAmount: l.balance,
            monthlyEMI: l.monthlyPayment || Math.round(l.balance / 12),
            interestRate: null,
            startDate: today,
            endDate: null,
            dueDay: 5,
            notes: '',
          }).catch(() => {})
        )
      }
    }

    await Promise.all(createPromises)
    await updateSettings({ onboardingCompleted: true })
    await loadSettings()
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <WelcomeStep
            onNext={(d) => {
              updateData({ profileType: d.profileType })
              advance()
            }}
          />
        )
      case 1:
        return (
          <IncomeStep
            onNext={(d) => {
              updateData(d)
              advance()
            }}
          />
        )
      case 2:
        return (
          <ExpensesStep
            onNext={(d) => {
              updateData({ expenses: d })
              advance()
            }}
          />
        )
      case 3:
        return (
          <GoalsStep
            onNext={(d) => {
              updateData({ goals: d.goals })
              advance()
            }}
          />
        )
      case 4:
        return (
          <RiskStep
            onNext={(d) => {
              updateData({ riskAppetite: d.riskAppetite })
              advance()
            }}
          />
        )
      case 5:
        return (
          <AssetsStep
            onNext={(d) => {
              updateData({ assets: d.assets })
              advance()
            }}
          />
        )
      case 6:
        return (
          <LiabilitiesStep
            onNext={(d) => {
              updateData({ liabilities: d.liabilities })
              advance()
            }}
          />
        )
      case 7:
        return (
          <PreferencesStep
            onNext={(d) => {
              updateData({ country: d.country, language: d.language, currency: d.currency })
              advance()
            }}
          />
        )
      case 8:
        return (
          <AiFeaturesStep
            onNext={(d) => {
              updateData({ aiFeatures: d.aiFeatures })
              advance()
            }}
          />
        )
      case 9:
        return <PermissionsStep onFinish={() => finish()} />
      default:
        return null
    }
  }

  const hasBack = step > 0
  const isLast = step === 9

  return (
    <div className="flex h-dvh w-full flex-col bg-surface">
      <div className="flex items-center gap-4 px-16 pt-12">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-4">
            <div
              className={cn(
                'h-1 w-full rounded-full transition-all duration-slow',
                i <= step ? 'bg-brand-teal400' : 'bg-border-subtle'
              )}
            />
            {i === step && (
              <span className="text-[10px] font-medium text-brand-teal400 truncate max-w-full">
                {label}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto px-16 py-24">
        {renderStep()}
      </div>

      {!isLast && (
        <div className="flex flex-col items-center gap-12 px-16 pb-32">
          <div className="flex gap-8" aria-hidden="true">
            {STEP_LABELS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full transition-all duration-standard',
                  i === step ? 'h-8 w-20 bg-brand-teal400' : 'h-8 w-8 bg-border-subtle'
                )}
              />
            ))}
          </div>

          <div className="flex w-full max-w-sm items-center justify-between gap-16">
            {hasBack ? (
              <Button variant="tertiary" size="sm" onClick={goBack}>
                <ChevronLeft className="size-16" aria-hidden="true" />
                Back
              </Button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-12">
              <Button variant="tertiary" size="sm" onClick={advance}>
                Skip
              </Button>
              <Button variant="primary" size="sm" onClick={advance}>
                Next
                <ChevronRight className="size-16" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
