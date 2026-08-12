import { useFinancialIdentityStore } from '@/features/profile/financialIdentityStore'
import type { RiskAppetite } from '@/types/entities'
import { cn } from '@/utils/cn'
import { Shield, Scale, TrendingUp } from 'lucide-react'

const RISK_OPTIONS: {
  value: RiskAppetite
  label: string
  description: string
  icon: typeof Shield
}[] = [
  {
    value: 'conservative',
    label: 'Conservative',
    description: 'I prefer safety. Low returns are fine.',
    icon: Shield,
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'I am okay with moderate risk for better returns.',
    icon: Scale,
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'I can handle volatility for maximum growth.',
    icon: TrendingUp,
  },
]

export function RiskStep({
  onNext,
}: {
  onNext: (data: { riskAppetite: RiskAppetite }) => void
}) {
  const identity = useFinancialIdentityStore((s) => s.identity)
  const currentRisk = identity?.riskAppetite ?? 'balanced'

  return (
    <div className="flex flex-col items-center gap-28 text-center w-full">
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
      >
        <div className="flex size-64 items-center justify-center rounded-2xl bg-brand-secondary/10">
          <Scale className="size-32 text-brand-secondary" aria-hidden="true" />
        </div>
        <h2 className="text-h1 font-semibold text-text-primary">Risk appetite</h2>
        <p className="max-w-sm text-body text-text-secondary">
          How comfortable are you with financial risk?
        </p>
      </div>

      <div
        className="flex flex-col gap-12 w-full max-w-md"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        {RISK_OPTIONS.map(({ value, label, description, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onNext({ riskAppetite: value })}
            className={cn(
              'flex items-start gap-16 rounded-xl border p-20 text-left transition-all duration-fast',
              currentRisk === value
                ? 'border-brand-teal400 bg-brand-teal900/10 shadow-sm'
                : 'border-border bg-surface-card hover:border-brand-teal400/40'
            )}
          >
            <div
              className={cn(
                'flex size-44 shrink-0 items-center justify-center rounded-xl',
                currentRisk === value ? 'bg-brand-teal900/15' : 'bg-surface-input'
              )}
            >
              <Icon
                className={cn(
                  'size-22',
                  currentRisk === value ? 'text-brand-teal900' : 'text-text-secondary'
                )}
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col gap-4 min-w-0">
              <span
                className={cn(
                  'text-body font-semibold',
                  currentRisk === value ? 'text-brand-teal900' : 'text-text-primary'
                )}
              >
                {label}
              </span>
              <span className="text-body-sm text-text-secondary leading-relaxed">
                {description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
