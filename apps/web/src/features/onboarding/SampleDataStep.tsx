import { Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/app/settingsStore'
import { cn } from '@/utils/cn'
import { SuccessIllustration } from '@/components/common/Illustrations'

export function SampleDataStep() {
  const sampleDataRequested = useSettingsStore((s) => s.settings?.sampleDataRequested ?? false)
  const update = useSettingsStore((s) => s.update)

  return (
    <div className="flex flex-col items-center gap-24 text-center">
      {/* Illustration */}
      <div style={{ animation: 'mzn-scale-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <SuccessIllustration size={140} />
      </div>

      <div
        className="flex flex-col gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        <h2 className="font-heading text-h1 font-bold bg-gradient-to-r from-income to-brand-secondary bg-clip-text text-transparent">
          You&rsquo;re all set!
        </h2>
        <p className="max-w-sm text-body text-text-secondary">
          Start with a blank slate, or explore with a few sample transactions you can delete
          anytime.
        </p>
      </div>

      <label
        className={cn(
          'flex min-h-touch max-w-sm cursor-pointer items-center gap-12 rounded-xl border px-16 text-left transition-all duration-fast shadow-sm',
          sampleDataRequested
            ? 'border-income bg-income-subtle shadow-income/10'
            : 'border-border bg-surface-card hover:border-income/40 hover:bg-income-subtle/20'
        )}
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.2s both' }}
      >
        <div
          className={cn(
            'flex size-24 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-fast',
            sampleDataRequested ? 'border-income bg-income' : 'border-border bg-transparent'
          )}
        >
          {sampleDataRequested && (
            <svg viewBox="0 0 10 8" className="size-12" fill="none">
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
        <div className="flex items-center gap-8 min-w-0">
          <Sparkles className="size-14 shrink-0 text-income" aria-hidden="true" />
          <span className="text-body-sm font-medium text-text-primary">
            Load sample data so I can explore the app
          </span>
        </div>
        <input
          type="checkbox"
          checked={sampleDataRequested}
          onChange={(e) => update({ sampleDataRequested: e.target.checked })}
          className="sr-only"
        />
      </label>
    </div>
  )
}
