import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Home, CreditCard, Zap, ShieldCheck, MoreHorizontal } from 'lucide-react'

const EXPENSE_CATEGORIES = [
  { key: 'rent', label: 'Rent / Mortgage', icon: Home, hint: 'e.g. 15,000' },
  { key: 'emi', label: 'EMI / Loan payments', icon: CreditCard, hint: 'e.g. 8,500' },
  { key: 'utilities', label: 'Utilities', icon: Zap, hint: 'e.g. 3,000' },
  { key: 'insurance', label: 'Insurance', icon: ShieldCheck, hint: 'e.g. 2,000' },
  { key: 'other', label: 'Other', icon: MoreHorizontal, hint: 'e.g. 5,000' },
]

export interface ExpensesData {
  rent: number
  emi: number
  utilities: number
  insurance: number
  other: number
}

export function ExpensesStep({ onNext }: { onNext: (data: ExpensesData) => void }) {
  const [values, setValues] = useState<Record<string, string>>({})

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  function handleSubmit() {
    const data: ExpensesData = {
      rent: Number(values.rent) || 0,
      emi: Number(values.emi) || 0,
      utilities: Number(values.utilities) || 0,
      insurance: Number(values.insurance) || 0,
      other: Number(values.other) || 0,
    }
    onNext(data)
  }

  return (
    <div className="flex flex-col items-center gap-28 text-center w-full">
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
      >
        <div className="flex size-64 items-center justify-center rounded-2xl bg-expense/10">
          <CreditCard className="size-32 text-expense" aria-hidden="true" />
        </div>
        <h2 className="text-h1 font-semibold text-text-primary">Monthly expenses</h2>
        <p className="max-w-sm text-body text-text-secondary">
          Quick estimates help us suggest a realistic budget.
        </p>
      </div>

      <div
        className="flex flex-col gap-12 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        {EXPENSE_CATEGORIES.map(({ key, label, icon: Icon, hint }) => (
          <div
            key={key}
            className="flex items-center gap-12 rounded-xl border border-border bg-surface-card p-16"
          >
            <div className="flex size-36 shrink-0 items-center justify-center rounded-lg bg-surface-input">
              <Icon className="size-18 text-text-secondary" aria-hidden="true" />
            </div>
            <div className="flex flex-1 items-center gap-8">
              <label className="text-body-sm font-medium text-text-primary min-w-0 flex-1 text-left">
                {label}
              </label>
              <div className="flex items-center gap-4">
                <span className="text-body-sm text-text-tertiary tabular-nums">Rs.</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={values[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={hint}
                  className={cn(
                    'w-[120px] rounded-lg border bg-transparent px-10 py-8 text-right text-body-sm tabular-nums text-text-primary',
                    'placeholder:text-text-tertiary focus:border-brand-teal400 focus:outline-none',
                    values[key] ? 'border-brand-teal400/50' : 'border-border'
                  )}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="inline-flex min-h-touch items-center justify-center gap-8 rounded-2xl bg-brand-teal900 px-28 py-12 text-body font-semibold text-white shadow-glass-sm transition-all duration-fast hover:shadow-glass-pressed active:scale-[0.97]"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.15s both' }}
      >
        Continue
      </button>
    </div>
  )
}
