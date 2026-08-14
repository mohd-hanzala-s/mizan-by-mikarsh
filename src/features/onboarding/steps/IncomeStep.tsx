import { useState, useCallback } from 'react'
import { useFinancialIdentityStore } from '@/features/profile/financialIdentityStore'
import type { IncomeFrequency } from '@/types/entities'
import { cn } from '@/utils/cn'
import { Wallet, Calendar } from 'lucide-react'

const FREQ_OPTIONS: { value: IncomeFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function IncomeStep({
  onNext,
}: {
  onNext: (data: {
    monthlyIncome: number
    incomeFrequency: IncomeFrequency
    salaryDay: number
  }) => void
}) {
  const identity = useFinancialIdentityStore((s) => s.identity)
  const [income, setIncome] = useState(
    identity?.monthlyIncome ? String(identity.monthlyIncome) : ''
  )
  const [frequency, setFrequency] = useState<IncomeFrequency>(
    identity?.incomeFrequency ?? 'monthly'
  )
  const [salaryDay, setSalaryDay] = useState(identity?.salaryDay ?? 1)

  const displayIncome = income ? Number(income).toLocaleString('en-IN') : '0'

  const handleNext = useCallback(() => {
    const amount = income ? Number(income) : 0
    onNext({ monthlyIncome: amount, incomeFrequency: frequency, salaryDay })
  }, [income, frequency, salaryDay, onNext])

  return (
    <div className="flex flex-col items-center gap-28 text-center w-full">
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
      >
        <div className="flex size-64 items-center justify-center rounded-2xl bg-brand-teal900/10">
          <Wallet className="size-32 text-brand-teal900" aria-hidden="true" />
        </div>
        <h2 className="text-h1 font-semibold text-text-primary">Your income</h2>
        <p className="max-w-sm text-body text-text-secondary">
          This helps us personalize budgets and goals for you.
        </p>
      </div>

      <div
        className="flex flex-col items-center gap-16 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        <label className="text-overline text-text-tertiary">Monthly income</label>
        <div className="card-hero flex w-full flex-col items-center gap-8 p-24">
          <div className="flex items-baseline gap-4">
            <span className="text-h2 text-white/70 tabular-nums">Rs.</span>
            <span className="text-display font-bold text-white tabular-nums">{displayIncome}</span>
          </div>
        </div>
        <input
          type="number"
          inputMode="numeric"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="Enter your monthly income"
          className="w-full rounded-xl border border-border bg-surface-card px-16 py-12 text-body text-text-primary text-center placeholder:text-text-tertiary focus:border-brand-teal400 focus:outline-none"
        />
      </div>

      <div
        className="flex flex-col items-center gap-12 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.15s both' }}
      >
        <label className="text-overline text-text-tertiary">Income frequency</label>
        <div
          role="radiogroup"
          aria-label="Income frequency"
          className="card-input inline-flex rounded-2xl p-4"
        >
          {FREQ_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={frequency === opt.value}
              onClick={() => setFrequency(opt.value)}
              className={cn(
                'min-h-touch rounded-xl px-16 text-body-sm font-medium transition-all duration-fast',
                frequency === opt.value
                  ? 'bg-brand-teal900 text-white shadow-pressed'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-12 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.2s both' }}
      >
        <div className="flex items-center gap-8">
          <Calendar className="size-16 text-text-secondary" aria-hidden="true" />
          <label className="text-overline text-text-tertiary">When do you get paid?</label>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSalaryDay(day)}
              className={cn(
                'flex size-36 items-center justify-center rounded-lg text-body-sm font-medium transition-all duration-fast',
                salaryDay === day
                  ? 'bg-brand-teal900 text-white shadow-sm'
                  : 'bg-surface-card text-text-secondary hover:bg-brand-teal900/10'
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="inline-flex min-h-touch items-center justify-center gap-8 rounded-2xl bg-brand-teal900 px-28 py-12 text-body font-semibold text-white shadow-glass-sm transition-all duration-fast hover:shadow-glass-pressed active:scale-[0.97]"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.25s both' }}
      >
        Continue
      </button>
    </div>
  )
}
