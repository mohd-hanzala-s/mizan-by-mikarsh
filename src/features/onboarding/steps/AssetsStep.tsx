import { useState } from 'react'
import { cn } from '@/utils/cn'
import { Home, Gem, Car, PiggyBank, Bitcoin, TrendingUp, BarChart3 } from 'lucide-react'

const ASSET_OPTIONS = [
  { key: 'property', label: 'House / Property', icon: Home },
  { key: 'gold', label: 'Gold / Jewellery', icon: Gem },
  { key: 'vehicle', label: 'Vehicle', icon: Car },
  { key: 'cash', label: 'Cash Savings', icon: PiggyBank },
  { key: 'crypto', label: 'Crypto', icon: Bitcoin },
  { key: 'stocks', label: 'Stocks', icon: TrendingUp },
  { key: 'mutual_funds', label: 'Mutual Funds', icon: BarChart3 },
]

export interface AssetEntry {
  label: string
  value: number
}

export function AssetsStep({ onNext }: { onNext: (data: { assets: AssetEntry[] }) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [amounts, setAmounts] = useState<Record<string, string>>({})

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
    const assets: AssetEntry[] = []
    for (const opt of ASSET_OPTIONS) {
      if (selected.has(opt.key)) {
        assets.push({ label: opt.label, value: Number(amounts[opt.key]) || 0 })
      }
    }
    onNext({ assets })
  }

  return (
    <div className="flex flex-col items-center gap-28 text-center w-full">
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
      >
        <div className="flex size-64 items-center justify-center rounded-2xl bg-income/10">
          <PiggyBank className="size-32 text-income" aria-hidden="true" />
        </div>
        <h2 className="text-h1 font-semibold text-text-primary">Your assets</h2>
        <p className="max-w-sm text-body text-text-secondary">
          What do you already own? Approximate values are fine.
        </p>
      </div>

      <div
        className="flex flex-col gap-12 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        {ASSET_OPTIONS.map(({ key, label, icon: Icon }) => {
          const isSelected = selected.has(key)
          return (
            <div key={key} className="flex flex-col gap-8">
              <button
                type="button"
                onClick={() => toggle(key)}
                className={cn(
                  'flex items-center gap-12 rounded-xl border p-16 text-left transition-all duration-fast',
                  isSelected
                    ? 'border-income bg-income-subtle'
                    : 'border-border bg-surface-card hover:border-income/40'
                )}
              >
                <div
                  className={cn(
                    'flex size-36 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-income/10' : 'bg-surface-input'
                  )}
                >
                  <Icon
                    className={cn('size-18', isSelected ? 'text-income' : 'text-text-secondary')}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-body-sm font-medium text-text-primary">{label}</span>
                <div
                  className={cn(
                    'ml-auto flex size-20 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-fast',
                    isSelected ? 'border-income bg-income' : 'border-border bg-transparent'
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
                  className="flex items-center gap-8 rounded-lg border border-border bg-surface-card px-12 py-10"
                  style={{ animation: 'mzn-scale-in 0.3s ease-out both' }}
                >
                  <span className="text-body-sm text-text-tertiary tabular-nums">Rs.</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amounts[key] ?? ''}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="Approximate value"
                    className="flex-1 bg-transparent text-right text-body-sm tabular-nums text-text-primary placeholder:text-text-tertiary focus:outline-none"
                  />
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
