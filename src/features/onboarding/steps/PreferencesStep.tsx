import { useState } from 'react'
import { useSettingsStore } from '@/app/settingsStore'
import { useFinancialIdentityStore } from '@/features/profile/financialIdentityStore'
import { SUPPORTED_CURRENCIES } from '@/utils/currency'
import { ThemeToggle } from '@/features/settings/ThemeToggle'
import { cn } from '@/utils/cn'
import { Globe, Calendar } from 'lucide-react'

const COUNTRY_OPTIONS = [
  { code: 'IN', label: 'India' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AE', label: 'UAE' },
  { code: 'SG', label: 'Singapore' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'JP', label: 'Japan' },
]

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'kn', label: 'Kannada' },
]

const WEEK_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 0, label: 'Sunday' },
] as const

export function PreferencesStep({
  onNext,
}: {
  onNext: (data: { country: string; language: string; currency: string }) => void
}) {
  const settings = useSettingsStore((s) => s.settings)
  const identity = useFinancialIdentityStore((s) => s.identity)
  const updateSettings = useSettingsStore((s) => s.update)

  const [currency, setCurrency] = useState(settings?.currency ?? 'INR')
  const [country, setCountry] = useState(identity?.country ?? 'IN')
  const [language, setLanguage] = useState(identity?.language ?? 'en')
  const [weekStartsOn, setWeekStartsOn] = useState(settings?.firstDayOfWeek ?? 1)

  function handleContinue() {
    updateSettings({ currency, firstDayOfWeek: weekStartsOn, language })
    onNext({ country, language, currency })
  }

  return (
    <div className="flex flex-col items-center gap-28 text-center w-full">
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
      >
        <div className="flex size-64 items-center justify-center rounded-2xl bg-brand-secondary/10">
          <Globe className="size-32 text-brand-secondary" aria-hidden="true" />
        </div>
        <h2 className="text-h1 font-semibold text-text-primary">Preferences</h2>
        <p className="max-w-sm text-body text-text-secondary">
          Set your location and display preferences.
        </p>
      </div>

      <div
        className="flex flex-col gap-20 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        <div className="flex flex-col gap-8">
          <label className="text-overline text-text-tertiary text-left">Currency</label>
          <div className="card-input relative rounded-2xl p-4">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full min-h-touch appearance-none bg-transparent rounded-xl px-16 text-body-sm font-medium text-text-primary outline-none cursor-pointer"
              aria-label="Currency"
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <div className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <label className="text-overline text-text-tertiary text-left">Country</label>
          <div className="card-input relative rounded-2xl p-4">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full min-h-touch appearance-none bg-transparent rounded-xl px-16 text-body-sm font-medium text-text-primary outline-none cursor-pointer"
              aria-label="Country"
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <label className="text-overline text-text-tertiary text-left">Language</label>
          <div className="card-input relative rounded-2xl p-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full min-h-touch appearance-none bg-transparent rounded-xl px-16 text-body-sm font-medium text-text-primary outline-none cursor-pointer"
              aria-label="Language"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-12">
          <span className="text-overline text-text-tertiary">Theme</span>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-center gap-8">
            <Calendar className="size-14 text-text-secondary" aria-hidden="true" />
            <label className="text-overline text-text-tertiary">Week starts on</label>
          </div>
          <div className="flex justify-center gap-8">
            {WEEK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWeekStartsOn(opt.value)}
                className={cn(
                  'min-h-touch rounded-xl px-20 text-body-sm font-medium transition-all duration-fast',
                  weekStartsOn === opt.value
                    ? 'bg-brand-teal900 text-white shadow-pressed'
                    : 'bg-surface-card text-text-secondary hover:bg-brand-teal900/10 border border-border'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        className="inline-flex min-h-touch items-center justify-center gap-8 rounded-2xl bg-brand-teal900 px-28 py-12 text-body font-semibold text-white shadow-glass-sm transition-all duration-fast hover:shadow-glass-pressed active:scale-[0.97]"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.15s both' }}
      >
        Continue
      </button>
    </div>
  )
}
