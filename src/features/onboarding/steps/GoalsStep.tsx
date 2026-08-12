import { useState } from 'react'
import type { GoalType } from '@/types/entities'
import { cn } from '@/utils/cn'
import {
  Shield,
  Home,
  Car,
  GraduationCap,
  Umbrella,
  Plane,
  TrendingUp,
  Smartphone,
  Heart,
  Target,
} from 'lucide-react'

const GOAL_OPTIONS: {
  value: GoalType
  label: string
  icon: typeof Target
}[] = [
  { value: 'emergency_fund', label: 'Emergency Fund', icon: Shield },
  { value: 'house', label: 'House', icon: Home },
  { value: 'vehicle', label: 'Vehicle', icon: Car },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'retirement', label: 'Retirement', icon: Umbrella },
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'investment', label: 'Investment', icon: TrendingUp },
  { value: 'gadget', label: 'Gadget', icon: Smartphone },
  { value: 'wedding', label: 'Wedding', icon: Heart },
]

export interface GoalEntry {
  type: GoalType
  label: string
  targetAmount: number
}

export function GoalsStep({
  onNext,
}: {
  onNext: (data: { goals: GoalEntry[] }) => void
}) {
  const [selected, setSelected] = useState<Set<GoalType>>(new Set())
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  function toggle(type: GoalType) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function handleAmount(type: GoalType, val: string) {
    setAmounts((prev) => ({ ...prev, [type]: val }))
  }

  function handleSubmit() {
    const goals: GoalEntry[] = []
    for (const opt of GOAL_OPTIONS) {
      if (selected.has(opt.value)) {
        goals.push({
          type: opt.value,
          label: opt.label,
          targetAmount: Number(amounts[opt.value]) || 0,
        })
      }
    }
    onNext({ goals })
  }

  return (
    <div className="flex flex-col items-center gap-28 text-center w-full">
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
      >
        <div className="flex size-64 items-center justify-center rounded-2xl bg-gold-500/10">
          <Target className="size-32 text-gold-500" aria-hidden="true" />
        </div>
        <h2 className="text-h1 font-semibold text-text-primary">Financial goals</h2>
        <p className="max-w-sm text-body text-text-secondary">
          What are you saving for? Select all that apply.
        </p>
      </div>

      <div
        className="flex flex-col gap-16 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        <div className="flex flex-wrap gap-8">
          {GOAL_OPTIONS.map(({ value, label, icon: Icon }) => {
            const isSelected = selected.has(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggle(value)}
                className={cn(
                  'inline-flex items-center gap-8 rounded-full border px-16 py-10 text-body-sm font-medium transition-all duration-fast',
                  isSelected
                    ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                    : 'border-border bg-surface-card text-text-secondary hover:border-gold-500/40'
                )}
              >
                <Icon className="size-14" aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </div>

        {selected.size > 0 && (
          <div className="flex flex-col gap-12 mt-8">
            <span className="text-overline text-text-tertiary">Target amounts</span>
            {GOAL_OPTIONS.filter((g) => selected.has(g.value)).map(({ value, label }) => (
              <div
                key={value}
                className="flex items-center gap-8 rounded-xl border border-border bg-surface-card px-16 py-12"
              >
                <span className="text-body-sm font-medium text-text-primary flex-1 text-left">
                  {label}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-body-sm text-text-tertiary tabular-nums">Rs.</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amounts[value] ?? ''}
                    onChange={(e) => handleAmount(value, e.target.value)}
                    placeholder="0"
                    className="w-[100px] rounded-lg border border-border bg-transparent px-10 py-6 text-right text-body-sm tabular-nums text-text-primary placeholder:text-text-tertiary focus:border-brand-teal400 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
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
