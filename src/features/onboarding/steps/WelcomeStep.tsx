import { useFinancialIdentityStore } from '@/features/profile/financialIdentityStore'
import type { ProfileType } from '@/types/entities'
import { cn } from '@/utils/cn'
import {
  GraduationCap,
  Briefcase,
  Building2,
  PenTool,
  Users,
  Umbrella,
} from 'lucide-react'

const PROFILE_OPTIONS: {
  value: ProfileType
  label: string
  tagline: string
  icon: typeof GraduationCap
}[] = [
  {
    value: 'student',
    label: 'Student',
    tagline: 'Learning to manage money early',
    icon: GraduationCap,
  },
  {
    value: 'employee',
    label: 'Employee',
    tagline: 'Salaried with steady income',
    icon: Briefcase,
  },
  {
    value: 'business',
    label: 'Business',
    tagline: 'Running your own venture',
    icon: Building2,
  },
  {
    value: 'freelancer',
    label: 'Freelancer',
    tagline: 'Variable income, independent work',
    icon: PenTool,
  },
  {
    value: 'family',
    label: 'Family',
    tagline: 'Managing household finances',
    icon: Users,
  },
  {
    value: 'retired',
    label: 'Retired',
    tagline: 'Living off savings & investments',
    icon: Umbrella,
  },
]

export function WelcomeStep({
  onNext,
}: {
  onNext: (data: { profileType: ProfileType }) => void
}) {
  const identity = useFinancialIdentityStore((s) => s.identity)
  const currentType = identity?.profileType ?? 'employee'

  return (
    <div className="flex flex-col items-center gap-32 text-center w-full">
      <div
        className="flex flex-col items-center gap-12"
        style={{ animation: 'mzn-scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className="card-hero flex size-80 items-center justify-center rounded-full">
          <span className="text-display font-bold text-white select-none">M</span>
        </div>
        <h1 className="font-heading text-display font-bold bg-gradient-to-r from-brand-teal900 via-brand-secondary to-brand-gold bg-clip-text text-transparent">
          Welcome to Mizan
        </h1>
        <p className="max-w-sm text-body-lg text-text-secondary">
          Know exactly where every rupee goes. Everything stays on this device.
        </p>
      </div>

      <div
        className="flex flex-col items-center gap-16 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.15s both' }}
      >
        <h2 className="text-h2 font-semibold text-text-primary">Who are you?</h2>
        <div className="grid grid-cols-2 gap-12 w-full">
          {PROFILE_OPTIONS.map(({ value, label, tagline, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onNext({ profileType: value })}
              className={cn(
                'flex flex-col items-start gap-8 rounded-xl border p-16 text-left transition-all duration-fast',
                currentType === value
                  ? 'border-brand-teal400 bg-brand-teal900/10 shadow-sm'
                  : 'border-border bg-surface-card hover:border-brand-teal400/40'
              )}
            >
              <div
                className={cn(
                  'flex size-36 shrink-0 items-center justify-center rounded-lg',
                  currentType === value ? 'bg-brand-teal900/15' : 'bg-surface-input'
                )}
              >
                <Icon
                  className={cn(
                    'size-18',
                    currentType === value ? 'text-brand-teal900' : 'text-text-secondary'
                  )}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-body-sm font-semibold',
                    currentType === value ? 'text-brand-teal900' : 'text-text-primary'
                  )}
                >
                  {label}
                </p>
                <p className="text-caption text-text-tertiary leading-snug">{tagline}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
