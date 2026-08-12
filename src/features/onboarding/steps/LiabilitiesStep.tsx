import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Home, Car, GraduationCap, CreditCard, Users, MoreHorizontal } from 'lucide-react'

const LIABILITY_OPTIONS = [
  { key: 'home', label: 'Home Loan', icon: Home },
  { key: 'car', label: 'Car Loan', icon: Car },
  { key: 'student', label: 'Student Loan', icon: GraduationCap },
  { key: 'credit_card', label: 'Credit Card Debt', icon: CreditCard },
  { key: 'personal', label: 'Personal Loan', icon: Users },
  { key: 'other', label: 'Other', icon: MoreHorizontal },
]

export interface LiabilityEntry {
  label: string
  balance: number
  monthlyPayment: number
}

export function LiabilitiesStep({
  onNext,
}: {
  onNext: (data: { liabilities: LiabilityEntry[] }) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [payments, setPayments] = useState<Record<string, string>>({})

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function handleSubmit() {
    const liabilities: LiabilityEntry[] = []
    for (const opt of LIABILITY_OPTIONS) {
      if (selected.has(opt.key)) {
        liabilities.push({
          label: opt.label,
          balance: Number(balances[opt.key]) || 0,
          monthlyPayment: Number(payments[opt.key]) || 0,
        })
      }
    }
    onNext({ liabilities })
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
        <h2 className="text-h1 font-semibold text-text-primary">Your liabilities</h2>
        <p className="max-w-sm text-body text-text-secondary">
          What debts do you currently have?
        </p>
      </div>

      <div
        className="flex flex-col gap-12 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        {LIABILITY_OPTIONS.map(({ key, label, icon: Icon }) => {
          const isSelected = selected.has(key)
          return (
            <div key={key} className="flex flex-col gap-8">
              <button
                type="button"
                onClick={() => toggle(key)}
                className={cn(
                  'flex items-center gap-12 rounded-xl border p-16 text-left transition-all duration-fast',
                  isSelected
                    ? 'border-expense bg-expense/5'
                    : 'border-border bg-surface-card hover:border-expense/40'
                )}
              >
                <div
                  className={cn(
                    'flex size-36 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-expense/10' : 'bg-surface-input'
                  )}
                >
                  <Icon
                    className={cn('size-18', isSelected ? 'text-expense' : 'text-text-secondary')}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-body-sm font-medium text-text-primary">{label}</span>
                <div
                  className={cn(
                    'ml-auto flex size-20 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-fast',
                    isSelected ? 'border-expense bg-expense' : 'border-border bg-transparent'
                  )}
                >
                  {isSelected && (
                    <svg viewBox="0 0 10 8" className="size-10" fill="none">
                      <path
                        d="M1 4 L4 7 L9 1"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
              {isSelected && (
                <div
                  className="flex flex-col gap-8 rounded-lg border border-border bg-surface-card p-12"
                  style={{ animation: 'mzn-scale-in 0.3s ease-out both' }}
                >
                  <div className="flex items-center gap-8">
                    <span className="text-caption text-text-tertiary w-[100px] text-left">
                      Balance
                    </span>
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-body-sm text-text-tertiary tabular-nums">Rs.</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={balances[key] ?? ''}
                        onChange={(e) =>
                          setBalances((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder="0"
                        className="flex-1 bg-transparent text-right text-body-sm tabular-nums text-text-primary placeholder:text-text-tertiary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="text-caption text-text-tertiary w-[100px] text-left">
                      Monthly
                    </span>
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-body-sm text-text-tertiary tabular-nums">Rs.</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={payments[key] ?? ''}
                        onChange={(e) =>
                          setPayments((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        placeholder="0"
                        className="flex-1 bg-transparent text-right text-body-sm tabular-nums text-text-primary placeholder:text-text-tertiary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
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
