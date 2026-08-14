import { useState, useCallback, useEffect } from 'react'
import { useFinancialIdentityStore } from '@/features/profile/financialIdentityStore'
import type { AiFeatures } from '@/types/entities'
import { cn } from '@/utils/cn'
import { TrendingUp, Lightbulb, Tag, Calculator, Target } from 'lucide-react'

const FEATURE_OPTIONS: {
  key: keyof AiFeatures
  label: string
  description: string
  icon: typeof TrendingUp
}[] = [
  {
    key: 'forecasting',
    label: 'Forecasting',
    description: 'Predict your future net worth based on income and spending patterns.',
    icon: TrendingUp,
  },
  {
    key: 'recommendations',
    label: 'Recommendations',
    description: 'Get personalized money tips tailored to your financial behaviour.',
    icon: Lightbulb,
  },
  {
    key: 'autoCategorize',
    label: 'Auto Categorization',
    description: 'Automatically tag transactions using smart category detection.',
    icon: Tag,
  },
  {
    key: 'budgetSuggestions',
    label: 'Budget Suggestions',
    description: 'Smart budget recommendations based on your spending history.',
    icon: Calculator,
  },
  {
    key: 'goalPrediction',
    label: 'Goal Prediction',
    description: 'Track goal completion probability and get nudges to stay on track.',
    icon: Target,
  },
]

export function AiFeaturesStep({
  onNext,
  registerNext,
}: {
  onNext: (data: { aiFeatures: AiFeatures }) => void
  registerNext?: (submit: (() => void) | null) => void
}) {
  const identity = useFinancialIdentityStore((s) => s.identity)
  const currentFeatures = identity?.aiFeatures ?? {
    forecasting: true,
    recommendations: true,
    autoCategorize: true,
    budgetSuggestions: true,
    goalPrediction: true,
  }

  const [features, setFeatures] = useState<AiFeatures>({ ...currentFeatures })

  function toggle(key: keyof AiFeatures) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = useCallback(() => {
    onNext({ aiFeatures: features })
  }, [features, onNext])

  useEffect(() => {
    registerNext?.(handleSubmit)
    return () => registerNext?.(null)
  }, [registerNext, handleSubmit])

  return (
    <div className="flex flex-col items-center gap-28 text-center w-full">
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
      >
        <div className="flex size-64 items-center justify-center rounded-2xl bg-brand-teal900/10">
          <Lightbulb className="size-32 text-brand-teal900" aria-hidden="true" />
        </div>
        <h2 className="text-h1 font-semibold text-text-primary">Smart Features</h2>
        <p className="max-w-sm text-body text-text-secondary">
          Enable smart features to get more from your money. All data stays on your device.
        </p>
      </div>

      <div
        className="flex flex-col gap-12 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        {FEATURE_OPTIONS.map(({ key, label, description, icon: Icon }) => (
          <div
            key={key}
            className={cn(
              'flex items-start gap-12 rounded-xl border p-16 transition-all duration-fast',
              features[key]
                ? 'border-brand-teal400/40 bg-surface-card'
                : 'border-border/50 bg-surface-card/50'
            )}
          >
            <div
              className={cn(
                'flex size-36 shrink-0 items-center justify-center rounded-lg',
                features[key] ? 'bg-brand-teal900/10' : 'bg-surface-input'
              )}
            >
              <Icon
                className={cn(
                  'size-18',
                  features[key] ? 'text-brand-teal900' : 'text-text-tertiary'
                )}
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 min-w-0 text-left">
              <span className="text-body-sm font-semibold text-text-primary">{label}</span>
              <span className="text-caption text-text-secondary leading-snug">{description}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={features[key]}
              onClick={() => toggle(key)}
              className={cn(
                'relative inline-flex h-24 w-44 shrink-0 rounded-full transition-colors duration-fast',
                features[key] ? 'bg-brand-teal400' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block size-20 rounded-full bg-white shadow-sm transition-transform duration-fast',
                  features[key] ? 'translate-x-[22px]' : 'translate-x-[2px]'
                )}
                style={{ marginTop: '2px' }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
