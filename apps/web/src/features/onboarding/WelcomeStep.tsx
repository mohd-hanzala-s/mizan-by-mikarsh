import { useSettingsStore } from '@/app/settingsStore'
import { ThemeToggle } from '@/features/settings/ThemeToggle'
import type { Settings } from '@/types/entities'
import { cn } from '@/utils/cn'
import { WelcomeIllustration } from '@/components/common/Illustrations'
import { ShieldCheck, Zap, BarChart3 } from 'lucide-react'

const DISPLAY_OPTIONS: { value: Settings['currencyDisplay']; label: string; example: string }[] = [
  { value: 'lakh-crore', label: 'Lakh / Crore', example: '₹1,00,000' },
  { value: 'international', label: 'International', example: '₹100,000' },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    label: 'Private',
    desc: 'Everything stays on your device — no cloud, no account.',
  },
  { icon: Zap, label: 'Instant', desc: 'Log a transaction in under thirty seconds.' },
  { icon: BarChart3, label: 'Smart', desc: 'Budgets, goals, and data-driven insights built in.' },
]

export function WelcomeStep() {
  const currencyDisplay = useSettingsStore((s) => s.settings?.currencyDisplay ?? 'lakh-crore')
  const update = useSettingsStore((s) => s.update)

  return (
    <div className="flex flex-col items-center gap-28 text-center">
      {/* Hero illustration */}
      <div style={{ animation: 'mzn-scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <WelcomeIllustration size={160} />
      </div>

      <div
        className="flex flex-col gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        <h1 className="font-heading text-display font-bold bg-gradient-to-r from-brand-teal900 via-brand-secondary to-brand-gold bg-clip-text text-transparent">
          Welcome to Mizan
        </h1>
        <p className="max-w-sm text-body-lg text-text-secondary">
          Know exactly where every rupee goes. Everything stays on this device.
        </p>
      </div>

      {/* Feature list */}
      <div
        className="flex flex-col gap-12 w-full max-w-xs text-left"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.2s both' }}
      >
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-start gap-12 rounded-xl bg-surface-card/80 border border-border/50 p-12 backdrop-blur-sm shadow-sm"
          >
            <div className="flex size-32 shrink-0 items-center justify-center rounded-lg bg-brand-teal900/10">
              <Icon className="size-16 text-brand-teal900" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-text-primary">{label}</p>
              <p className="text-caption text-text-secondary leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex flex-col items-center gap-12"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.3s both' }}
      >
        <span className="text-overline text-text-tertiary">Theme</span>
        <ThemeToggle />
      </div>

      <div
        className="flex flex-col items-center gap-12"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.35s both' }}
      >
        <span className="text-overline text-text-tertiary">Number format</span>
        <div role="radiogroup" aria-label="Number format" className="flex gap-8">
          {DISPLAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={currencyDisplay === opt.value}
              onClick={() => update({ currencyDisplay: opt.value })}
              className={cn(
                'min-h-touch rounded-md border px-16 text-left transition-colors duration-fast',
                currencyDisplay === opt.value
                  ? 'border-income bg-income-subtle'
                  : 'border-border bg-surface-card hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <p className="text-body-sm font-medium text-text-primary">{opt.label}</p>
              <p className="font-mono text-caption tabular-nums text-text-secondary">
                {opt.example}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
