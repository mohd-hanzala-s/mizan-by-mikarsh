import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Settings, ChevronRight, ChevronDown, Shield, Download, Upload,
  DollarSign, Briefcase, Users as UsersIcon, ShieldAlert, TrendingUp,
  BarChart3, Code, AlertTriangle, Sparkles,
} from 'lucide-react'
import { useFinancialIdentityStore } from './financialIdentityStore'
import { useSettingsStore } from '@/app/settingsStore'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useInvestmentsStore } from '@/features/investments/investmentsStore'
import { AppLockSettings } from '@/features/settings/AppLockSettings'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/common/Skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { cn } from '@/utils/cn'
import type { ProfileType, RiskAppetite, IncomeFrequency, FinancialIdentity } from '@/types/entities'

const PROFILE_TYPE_OPTIONS: { value: ProfileType; label: string; icon: typeof User }[] = [
  { value: 'student', label: 'Student', icon: User },
  { value: 'employee', label: 'Employee', icon: Briefcase },
  { value: 'business', label: 'Business', icon: TrendingUp },
  { value: 'freelancer', label: 'Freelancer', icon: Code },
  { value: 'family', label: 'Family', icon: UsersIcon },
  { value: 'retired', label: 'Retired', icon: Shield },
]

const RISK_OPTIONS: { value: RiskAppetite; label: string; desc: string; icon: typeof Shield }[] = [
  { value: 'conservative', label: 'Conservative', desc: 'Prefer stable, low-risk financial choices. Focus on safety and capital preservation.', icon: Shield },
  { value: 'balanced', label: 'Balanced', desc: 'Comfortable with moderate risk for moderate returns. Mix of safe and growth assets.', icon: TrendingUp },
  { value: 'aggressive', label: 'Aggressive', desc: 'Willing to accept higher risk for potentially higher returns. Growth-oriented strategy.', icon: TrendingUp },
]

const FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const BACKUP_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Light', icon: SunIcon },
  { value: 'dark' as const, label: 'Dark', icon: MoonIcon },
  { value: 'system' as const, label: 'System', icon: MonitorIcon },
]

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function MonitorIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  )
}

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex items-center justify-between gap-12 py-8 cursor-pointer">
      <div>
        <span className="text-body-sm font-medium text-text-primary">{label}</span>
        {description && <p className="text-caption text-text-tertiary">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative h-24 w-44 shrink-0 rounded-full transition-colors duration-fast',
          enabled ? 'bg-brand-teal900' : 'bg-neutral-300 dark:bg-neutral-600'
        )}
      >
        <span className={cn(
          'absolute top-2 size-20 rounded-full bg-white shadow-sm transition-transform duration-fast',
          enabled ? 'left-[calc(100%-22px)]' : 'left-2'
        )} />
      </button>
    </label>
  )
}

function SectionHeader({ icon: Icon, title, isOpen, onClick }: { icon: typeof User; title: string; isOpen: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-12 px-16 py-14 text-left"
    >
      <Icon className="size-20 text-brand-teal400" aria-hidden="true" />
      <span className="flex-1 text-body font-semibold text-brand-teal400">{title}</span>
      <ChevronDown className={cn('size-20 text-text-tertiary transition-transform duration-fast', isOpen && 'rotate-180')} aria-hidden="true" />
    </button>
  )
}

function PillSelect<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon?: typeof User }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-8" role="radiogroup">
      {options.map((opt) => {
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-6 rounded-full border px-14 py-8 text-body-sm font-medium transition-colors duration-fast',
              value === opt.value
                ? 'border-brand-teal900 bg-brand-teal900/10 text-brand-teal900'
                : 'border-border text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800'
            )}
          >
            {Icon && <Icon className="size-14" aria-hidden="true" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-8">
      <span className="text-body-sm text-text-secondary">{label}</span>
      <span className="text-body-sm font-medium tabular-nums text-text-primary">{value}</span>
    </div>
  )
}

function formatAmount(amount: number, currencyDisplay: string): string {
  const rounded = Math.round(amount)
  const locale = currencyDisplay === 'international' ? 'en-US' : 'en-IN'
  return `₹${rounded.toLocaleString(locale)}`
}

export function ProfilePage() {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['personal', 'income', 'summary'])
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  const identity = useFinancialIdentityStore((s) => s.identity)
  const identitySave = useFinancialIdentityStore((s) => s.save)
  const identityReset = useFinancialIdentityStore((s) => s.reset)

  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.update)
  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const goals = useGoalsStore((s) => s.goals)
  const budgets = useBudgetsStore((s) => s.budgets)
  const loans = useLoansStore((s) => s.loans)
  const investments = useInvestmentsStore((s) => s.investments)
  const navigate = useNavigate()

  const loadsRef = useRef({
    identity: useFinancialIdentityStore.getState().load,
    tx: useTransactionsStore.getState().load,
    acct: useAccountsStore.getState().load,
    goals: useGoalsStore.getState().load,
    budgets: useBudgetsStore.getState().load,
    loans: useLoansStore.getState().load,
    inv: useInvestmentsStore.getState().load,
    settings: useSettingsStore.getState().load,
  })

  useEffect(() => {
    loadsRef.current.identity()
    Promise.all([
      loadsRef.current.tx(),
      loadsRef.current.acct(),
      loadsRef.current.goals(),
      loadsRef.current.budgets(),
      loadsRef.current.loans(),
      loadsRef.current.inv(),
      loadsRef.current.settings(),
    ]).catch(() => setLoadError('Failed to load profile data. Please try again.'))
  }, [])

  const isLoading = useTransactionsStore((s) => s.isLoading) && transactions.length === 0

  if (isLoading) {
    return (
      <div className="flex flex-col gap-16 p-16 md:p-24">
        <Skeleton className="h-40 w-192" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (loadError) {
    return (
      <ErrorState
        message={loadError}
        onRetry={() => {
          setLoadError(null)
          loadsRef.current.identity()
          loadsRef.current.tx()
          loadsRef.current.acct()
          loadsRef.current.goals()
          loadsRef.current.budgets()
          loadsRef.current.loans()
          loadsRef.current.inv()
          loadsRef.current.settings()
        }}
      />
    )
  }

  if (!identity || !settings) {
    return (
      <div className="flex flex-col gap-16 p-16 md:p-24">
        <Skeleton className="h-40 w-192" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const savePartial = (patch: Partial<FinancialIdentity>) => identitySave(patch)

  const activeTxns = transactions.filter((t) => !t.isDeleted)
  const activeAccts = accounts.filter((a) => !a.isArchived)
  const activeGoals = goals.filter((g) => g.status !== 'cancelled')
  const activeBudgets = budgets.filter((b) => b.active)
  const activeLoans = loans.filter((l) => l.status === 'active')
  const activeInvestments = investments.filter((i) => i.status === 'active')

  const totalBalance = activeAccts.reduce((s, a) => s + a.currentBalance, 0)
  const goalsTargetTotal = activeGoals.reduce((s, g) => s + g.targetAmount, 0)
  const loansBalanceTotal = activeLoans.reduce((s, l) => s + l.currentBalance, 0)
  const investmentsTotal = activeInvestments.reduce((s, i) => s + i.units * i.currentPricePerUnit, 0)
  const currencyDisplay = settings.currencyDisplay ?? 'lakh-crore'

  const displayName = identity.displayName || 'Mizan User'

  return (
    <div className="flex flex-col gap-16 p-16 pb-32 md:p-24">
      <h1 className="text-h2 text-text-primary">Financial Identity</h1>

      <section className="rounded-md border border-border bg-surface-card p-16">
        <div className="flex items-center gap-16">
          <div className="flex size-56 items-center justify-center rounded-full bg-brand-teal900/10">
            <User className="size-28 text-brand-teal900" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-lg font-semibold text-text-primary">{displayName}</p>
            <p className="text-body-sm capitalize text-text-tertiary">
              {identity.profileType}
            </p>
          </div>
        </div>
      </section>

      {/* 1. Personal Information */}
      <section className="rounded-md border border-border bg-surface-card overflow-hidden">
        <SectionHeader icon={User} title="Personal Information" isOpen={openSections.has('personal')} onClick={() => toggleSection('personal')} />
        {openSections.has('personal') && (
          <div className="border-t border-border-subtle px-16 py-16 space-y-16">
            <div>
              <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Display Name</label>
              <input
                type="text"
                value={identity.displayName}
                onChange={(e) => savePartial({ displayName: e.target.value })}
                placeholder="Your name"
                aria-label="Display name"
                className="w-full rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary outline-none focus:border-brand-teal400"
              />
            </div>
            <div>
              <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Profile Type</label>
              <PillSelect options={PROFILE_TYPE_OPTIONS} value={identity.profileType} onChange={(v) => savePartial({ profileType: v })} />
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Country</label>
                <select
                  value={identity.country}
                  onChange={(e) => savePartial({ country: e.target.value })}
                  className="w-full rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary outline-none focus:border-brand-teal400"
                  aria-label="Country"
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AE">UAE</option>
                  <option value="SG">Singapore</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
              <div>
                <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Language</label>
                <select
                  value={identity.language}
                  onChange={(e) => savePartial({ language: e.target.value })}
                  className="w-full rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary outline-none focus:border-brand-teal400"
                  aria-label="Language"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="kn">Kannada</option>
                  <option value="mr">Marathi</option>
                  <option value="gu">Gujarati</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Income & Employment */}
      <section className="rounded-md border border-border bg-surface-card overflow-hidden">
        <SectionHeader icon={DollarSign} title="Income & Employment" isOpen={openSections.has('income')} onClick={() => toggleSection('income')} />
        {openSections.has('income') && (
          <div className="border-t border-border-subtle px-16 py-16 space-y-16">
            <div>
              <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Income ({identity.incomeFrequency})</label>
              <div className="relative">
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-body text-text-tertiary">₹</span>
                <input
                  type="number"
                  value={identity.monthlyIncome || ''}
                  onChange={(e) => savePartial({ monthlyIncome: Number(e.target.value) || 0 })}
                  placeholder="0"
                  min={0}
                  aria-label="Income amount"
                  className="w-full rounded-md border border-border bg-surface pl-28 pr-12 py-8 text-body tabular-nums text-text-primary outline-none focus:border-brand-teal400"
                />
              </div>
            </div>
            <div>
              <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Frequency</label>
              <PillSelect options={FREQUENCY_OPTIONS} value={identity.incomeFrequency} onChange={(v) => savePartial({ incomeFrequency: v })} />
            </div>
            <div>
              <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Salary Day (1-31)</label>
              <select
                value={identity.salaryDay}
                onChange={(e) => savePartial({ salaryDay: Number(e.target.value) })}
                className="w-full rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary outline-none focus:border-brand-teal400"
                aria-label="Salary day"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Employment Type</label>
                <input
                  type="text"
                  value={identity.employmentType}
                  onChange={(e) => savePartial({ employmentType: e.target.value })}
                  placeholder="Full-time"
                  aria-label="Employment type"
                  className="w-full rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary outline-none focus:border-brand-teal400"
                />
              </div>
              <div>
                <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Employer Name</label>
                <input
                  type="text"
                  value={identity.employerName}
                  onChange={(e) => savePartial({ employerName: e.target.value })}
                  placeholder="Company name"
                  aria-label="Employer name"
                  className="w-full rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary outline-none focus:border-brand-teal400"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. Dependents & Tax */}
      <section className="rounded-md border border-border bg-surface-card overflow-hidden">
        <SectionHeader icon={UsersIcon} title="Dependents & Tax" isOpen={openSections.has('dependents')} onClick={() => toggleSection('dependents')} />
        {openSections.has('dependents') && (
          <div className="border-t border-border-subtle px-16 py-16 space-y-16">
            <div>
              <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Number of Dependents</label>
              <div className="flex items-center gap-12">
                <button
                  type="button"
                  onClick={() => savePartial({ dependents: Math.max(0, identity.dependents - 1) })}
                  className="flex size-36 items-center justify-center rounded-full border border-border text-body-lg text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  disabled={identity.dependents <= 0}
                  aria-label="Decrease dependents"
                >
                  -
                </button>
                <span className="min-w-32 text-center text-body-lg font-semibold tabular-nums text-text-primary">{identity.dependents}</span>
                <button
                  type="button"
                  onClick={() => savePartial({ dependents: identity.dependents + 1 })}
                  className="flex size-36 items-center justify-center rounded-full border border-border text-body-lg text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Increase dependents"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Tax Bracket</label>
              <select
                value={identity.taxBracket}
                onChange={(e) => savePartial({ taxBracket: e.target.value })}
                className="w-full rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary outline-none focus:border-brand-teal400"
                aria-label="Tax bracket"
              >
                <option value="">Not set</option>
                <option value="0%">Nil (0%)</option>
                <option value="5%">5%</option>
                <option value="10%">10%</option>
                <option value="15%">15%</option>
                <option value="20%">20%</option>
                <option value="25%">25%</option>
                <option value="30%">30%</option>
                <option value="35%">35%</option>
                <option value="40%+">40%+</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 4. Risk Profile */}
      <section className="rounded-md border border-border bg-surface-card overflow-hidden">
        <SectionHeader icon={ShieldAlert} title="Risk Profile" isOpen={openSections.has('risk')} onClick={() => toggleSection('risk')} />
        {openSections.has('risk') && (
          <div className="border-t border-border-subtle px-16 py-16">
            <div className="grid gap-12" role="radiogroup" aria-label="Risk appetite">
              {RISK_OPTIONS.map((opt) => {
                const isActive = identity.riskAppetite === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => savePartial({ riskAppetite: opt.value })}
                    className={cn(
                      'rounded-lg border p-14 text-left transition-colors duration-fast',
                      isActive
                        ? 'border-brand-teal900 bg-brand-teal900/5'
                        : 'border-border hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    )}
                  >
                    <div className="flex items-center gap-10">
                      <opt.icon className={cn('size-20', isActive ? 'text-brand-teal900' : 'text-text-secondary')} aria-hidden="true" />
                      <span className={cn('text-body font-semibold', isActive ? 'text-brand-teal900' : 'text-text-primary')}>{opt.label}</span>
                    </div>
                    <p className="mt-4 text-caption text-text-tertiary">{opt.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* 5. Financial Summary */}
      <section className="rounded-md border border-border bg-surface-card overflow-hidden">
        <SectionHeader icon={BarChart3} title="Financial Summary" isOpen={openSections.has('summary')} onClick={() => toggleSection('summary')} />
        {openSections.has('summary') && (
          <div className="border-t border-border-subtle px-16 py-16">
            <div className="divide-y divide-border-subtle">
              <StatRow label="Total Balance" value={formatAmount(totalBalance, currencyDisplay)} />
              <StatRow label="Active Goals" value={`${activeGoals.length} · ${formatAmount(goalsTargetTotal, currencyDisplay)} target`} />
              <StatRow label="Active Loans" value={`${activeLoans.length} · ${formatAmount(loansBalanceTotal, currencyDisplay)} balance`} />
              <StatRow label="Active Budgets" value={String(activeBudgets.length)} />
              <StatRow label="Total Investments" value={formatAmount(investmentsTotal, currencyDisplay)} />
              <StatRow label="Transactions" value={activeTxns.length.toLocaleString('en-IN')} />
            </div>
          </div>
        )}
      </section>

      {/* 6. Preferences */}
      <section className="rounded-md border border-border bg-surface-card overflow-hidden">
        <SectionHeader icon={Settings} title="Preferences" isOpen={openSections.has('preferences')} onClick={() => toggleSection('preferences')} />
        {openSections.has('preferences') && (
          <div className="border-t border-border-subtle px-16 py-16 space-y-12">
            <div>
              <label className="mb-4 block text-caption uppercase tracking-wide text-text-tertiary">Theme</label>
              <div className="card-input inline-flex rounded-2xl p-4" role="radiogroup" aria-label="Theme">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={settings.theme === value}
                    onClick={() => updateSettings({ theme: value })}
                    className={cn(
                      'flex min-h-touch items-center gap-8 rounded-xl px-16 text-body-sm font-medium transition-all duration-fast',
                      settings.theme === value
                        ? 'bg-surface text-text-primary shadow-glass-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-12">
              <span className="text-body-sm text-text-primary">Currency Display</span>
              <select
                value={settings.currencyDisplay}
                onChange={(e) => updateSettings({ currencyDisplay: e.target.value as 'lakh-crore' | 'international' })}
                className="rounded-md border border-border bg-surface px-8 py-4 text-body-sm text-text-primary"
                aria-label="Currency display format"
              >
                <option value="lakh-crore">Lakh / Crore</option>
                <option value="international">International</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-12">
              <span className="text-body-sm text-text-primary">Date Format</span>
              <select
                value={settings.dateFormat}
                onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                className="rounded-md border border-border bg-surface px-8 py-4 text-body-sm text-text-primary"
                aria-label="Date format"
              >
                {DATE_FORMAT_OPTIONS.map((fmt) => (
                  <option key={fmt} value={fmt}>{fmt}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-12">
              <span className="text-body-sm text-text-primary">Budget Month Start</span>
              <select
                value={settings.budgetMonthStart ?? 1}
                onChange={(e) => updateSettings({ budgetMonthStart: Number(e.target.value) })}
                className="rounded-md border border-border bg-surface px-8 py-4 text-body-sm text-text-primary"
                aria-label="Budget month start day"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-12">
              <span className="text-body-sm text-text-primary">Week Starts On</span>
              <select
                value={identity.weekStartsOn}
                onChange={(e) => savePartial({ weekStartsOn: Number(e.target.value) })}
                className="rounded-md border border-border bg-surface px-8 py-4 text-body-sm text-text-primary"
                aria-label="Week starts on"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-12">
              <span className="text-body-sm text-text-primary">Backup Frequency</span>
              <select
                value={settings.backupFrequency}
                onChange={(e) => updateSettings({ backupFrequency: e.target.value as 'off' | 'weekly' | 'monthly' })}
                className="rounded-md border border-border bg-surface px-8 py-4 text-body-sm text-text-primary"
                aria-label="Backup frequency"
              >
                {BACKUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 7. AI Configuration */}
      <section className="rounded-md border border-border bg-surface-card overflow-hidden">
        <SectionHeader icon={Sparkles} title="AI Configuration" isOpen={openSections.has('ai')} onClick={() => toggleSection('ai')} />
        {openSections.has('ai') && (
          <div className="border-t border-border-subtle px-16 py-16 space-y-6">
            <Toggle
              enabled={identity.aiFeatures.forecasting}
              onChange={(v) => savePartial({ aiFeatures: { ...identity.aiFeatures, forecasting: v } })}
              label="Forecasting"
              description="Predict future balances and cash flow trends"
            />
            <Toggle
              enabled={identity.aiFeatures.recommendations}
              onChange={(v) => savePartial({ aiFeatures: { ...identity.aiFeatures, recommendations: v } })}
              label="Recommendations"
              description="Get personalised financial advice and tips"
            />
            <Toggle
              enabled={identity.aiFeatures.autoCategorize}
              onChange={(v) => savePartial({ aiFeatures: { ...identity.aiFeatures, autoCategorize: v } })}
              label="Auto Categorization"
              description="Automatically assign categories to transactions"
            />
            <Toggle
              enabled={identity.aiFeatures.budgetSuggestions}
              onChange={(v) => savePartial({ aiFeatures: { ...identity.aiFeatures, budgetSuggestions: v } })}
              label="Budget Suggestions"
              description="Smart budget amounts based on spending patterns"
            />
            <Toggle
              enabled={identity.aiFeatures.goalPrediction}
              onChange={(v) => savePartial({ aiFeatures: { ...identity.aiFeatures, goalPrediction: v } })}
              label="Goal Prediction"
              description="Estimate goal completion dates with current savings rate"
            />
          </div>
        )}
      </section>

      {/* 8. Security & Privacy */}
      <section className="rounded-md border border-border bg-surface-card overflow-hidden">
        <SectionHeader icon={Shield} title="Security & Privacy" isOpen={openSections.has('security')} onClick={() => toggleSection('security')} />
        {openSections.has('security') && (
          <div className="border-t border-border-subtle px-16 py-16 space-y-12">
            <AppLockSettings />
            <button
              type="button"
              onClick={() => navigate('/insights?tab=reports')}
              className="flex w-full items-center gap-12 rounded-md px-12 py-10 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <Upload className="size-20 text-text-secondary" aria-hidden="true" />
              <span className="flex-1 text-body-sm text-text-primary">Backup & Restore</span>
              <ChevronRight className="size-20 text-text-tertiary" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/insights?tab=reports')}
              className="flex w-full items-center gap-12 rounded-md px-12 py-10 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <Download className="size-20 text-text-secondary" aria-hidden="true" />
              <span className="flex-1 text-body-sm text-text-primary">Export Data</span>
              <ChevronRight className="size-20 text-text-tertiary" aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {/* 9. Developer */}
      {settings.developerMode && (
        <section className="rounded-md border border-border bg-surface-card overflow-hidden">
          <SectionHeader icon={Code} title="Developer" isOpen={openSections.has('developer')} onClick={() => toggleSection('developer')} />
          {openSections.has('developer') && (
            <div className="border-t border-border-subtle px-16 py-16 space-y-12">
              <Toggle
                enabled={settings.developerMode}
                onChange={(v) => updateSettings({ developerMode: v })}
                label="Developer Mode"
                description="Enable advanced debugging and experimental features"
              />
              <div className="rounded-md border border-border bg-surface p-12">
                <p className="mb-8 text-caption uppercase tracking-wide text-text-tertiary">API Tokens</p>
                <p className="text-body-sm text-text-tertiary">API token management is not yet available.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 10. Danger Zone */}
      <section className="rounded-md border border-expense/30 bg-surface-card overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('danger')}
          className="flex w-full items-center gap-12 px-16 py-14 text-left"
        >
          <AlertTriangle className="size-20 text-expense" aria-hidden="true" />
          <span className="flex-1 text-body font-semibold text-expense">Danger Zone</span>
          <ChevronDown className={cn('size-20 text-text-tertiary transition-transform duration-fast', openSections.has('danger') && 'rotate-180')} aria-hidden="true" />
        </button>
        {openSections.has('danger') && (
          <div className="border-t border-expense/20 px-16 py-16">
            <p className="mb-12 text-body-sm text-text-secondary">
              This will reset all your financial identity preferences to their defaults. This action cannot be undone.
            </p>
            {!resetConfirm ? (
              <Button variant="destructive" size="sm" onClick={() => setResetConfirm(true)}>
                Reset All Identity Data
              </Button>
            ) : (
              <div className="space-y-8">
                <p className="text-body-sm font-semibold text-expense">Are you sure? This cannot be undone.</p>
                <div className="flex gap-8">
                  <Button variant="destructive" size="sm" onClick={() => { identityReset(); setResetConfirm(false) }}>
                    Yes, Reset Everything
                  </Button>
                  <Button variant="tertiary" size="sm" onClick={() => setResetConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-md border border-border bg-surface-card p-16">
        <h2 className="text-overline text-text-tertiary mb-8">About</h2>
        <p className="text-body-sm text-text-secondary">
          Mizan v2.0.0 — Offline-first personal finance. All your data stays on-device, encrypted
          and private. No cloud accounts, no trackers, no ads.
        </p>
        <div className="mt-8 flex gap-16">
          <span className="text-caption text-text-tertiary">Made in India</span>
          <span className="text-caption text-text-tertiary">Version 2.0.0</span>
        </div>
      </section>
    </div>
  )
}
