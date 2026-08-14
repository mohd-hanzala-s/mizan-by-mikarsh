import { useState } from 'react'
import { useSettingsStore } from '@/app/settingsStore'
import { PinInput } from '@/components/forms/PinInput'
import { SettingsService } from '@/services/SettingsService'
import { LockIllustration } from '@/components/common/Illustrations'
import { CheckCircle2, Bell, Database, Calendar, Fingerprint, ShieldCheck } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PermissionItem {
  key: string
  label: string
  description: string
  icon: typeof Bell
  enabled: boolean
  toggle: () => void
}

export function PermissionsStep({ onFinish }: { onFinish: (data: { pinSet: boolean }) => void }) {
  const settings = useSettingsStore((s) => s.settings)
  const load = useSettingsStore((s) => s.load)
  const update = useSettingsStore((s) => s.update)

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [storage, setStorage] = useState(true)
  const [biometrics, setBiometrics] = useState(false)
  const [calendarAccess, setCalendarAccess] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const pinEnabled = settings?.appLockEnabled ?? false

  async function handleSetPin() {
    setPinError(null)
    if (pin.length < 4) return setPinError('PIN must be at least 4 digits.')
    if (pin !== confirmPin) {
      setPinError('PINs do not match.')
      setShake(true)
      setTimeout(() => setShake(false), 600)
      return
    }
    await SettingsService.setPin(pin)
    await load()
  }

  async function handleDisable() {
    await SettingsService.disableAppLock()
    await load()
    setPin('')
    setConfirmPin('')
  }

  async function handleFinish() {
    setFinishing(true)
    try {
      await update({ onboardingCompleted: true })
    } catch {
      setFinishing(false)
    }
    onFinish({ pinSet: pinEnabled })
  }

  const permissions: PermissionItem[] = [
    {
      key: 'notifications',
      label: 'Notifications',
      description: 'Get reminders for bills, budgets, and goal milestones.',
      icon: Bell,
      enabled: notifications,
      toggle: () => setNotifications((v) => !v),
    },
    {
      key: 'storage',
      label: 'Storage',
      description: 'Access local storage for encrypted backups.',
      icon: Database,
      enabled: storage,
      toggle: () => setStorage((v) => !v),
    },
    {
      key: 'biometrics',
      label: 'Biometrics',
      description: 'Use fingerprint or face unlock for faster app access.',
      icon: Fingerprint,
      enabled: biometrics,
      toggle: () => setBiometrics((v) => !v),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      description: 'Sync due dates and reminders with your financial calendar.',
      icon: Calendar,
      enabled: calendarAccess,
      toggle: () => setCalendarAccess((v) => !v),
    },
  ]

  return (
    <div className="flex flex-col items-center gap-24 text-center w-full">
      <div
        className="flex flex-col items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out both' }}
      >
        <div className="flex size-64 items-center justify-center rounded-2xl bg-income/10">
          <ShieldCheck className="size-32 text-income" aria-hidden="true" />
        </div>
        <h2 className="text-h1 font-semibold text-text-primary">Almost there</h2>
        <p className="max-w-sm text-body text-text-secondary">
          Set up security and choose what Mizan can access.
        </p>
      </div>

      <div
        className="flex flex-col gap-16 w-full max-w-sm"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        <div className="flex flex-col gap-8">
          <h3 className="text-overline text-text-tertiary text-center">App Lock</h3>
          <div className="flex flex-col items-center gap-8">
            <LockIllustration size={80} shake={shake} />
            {pinEnabled ? (
              <div className="flex flex-col items-center gap-8 rounded-xl border border-income/30 bg-income-subtle px-20 py-12">
                <div className="flex items-center gap-8">
                  <CheckCircle2 className="size-18 text-income" aria-hidden="true" />
                  <p className="text-body-sm font-semibold text-income">PIN is set</p>
                </div>
                <button
                  type="button"
                  onClick={handleDisable}
                  className="text-body-sm text-text-secondary underline"
                >
                  Remove PIN
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-12">
                <PinInput value={pin} onChange={setPin} label="Choose a PIN" autoFocus />
                <PinInput value={confirmPin} onChange={setConfirmPin} label="Confirm PIN" />
                {pinError && <p className="text-body-sm text-expense">{pinError}</p>}
                <button
                  type="button"
                  onClick={handleSetPin}
                  disabled={pin.length < 4}
                  className="inline-flex min-h-touch items-center justify-center rounded-xl bg-brand-teal900 px-24 text-body-sm font-semibold text-white transition-all duration-fast hover:bg-brand-teal900/90 active:scale-[0.98] disabled:opacity-40"
                >
                  Set PIN
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <h3 className="text-overline text-text-tertiary text-center">Permissions</h3>
          {permissions.map(({ key, label, description, icon: Icon, enabled, toggle }) => (
            <div
              key={key}
              className={cn(
                'flex items-start gap-12 rounded-xl border p-16 transition-all duration-fast',
                enabled
                  ? 'border-brand-teal400/40 bg-surface-card'
                  : 'border-border/50 bg-surface-card/50'
              )}
            >
              <div
                className={cn(
                  'flex size-36 shrink-0 items-center justify-center rounded-lg',
                  enabled ? 'bg-brand-teal900/10' : 'bg-surface-input'
                )}
              >
                <Icon
                  className={cn('size-18', enabled ? 'text-brand-teal900' : 'text-text-tertiary')}
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
                aria-checked={enabled}
                onClick={toggle}
                className={cn(
                  'relative inline-flex h-24 w-48 shrink-0 rounded-full transition-colors duration-fast',
                  enabled ? 'bg-brand-teal400' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'inline-block size-20 rounded-full bg-white shadow-sm transition-transform duration-fast',
                    enabled ? 'translate-x-[26px]' : 'translate-x-[2px]'
                  )}
                  style={{ marginTop: '2px' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleFinish}
        disabled={finishing}
        className="inline-flex min-h-touch items-center justify-center gap-8 rounded-2xl bg-brand-teal900 px-32 py-16 text-body font-semibold text-white shadow-glass-sm transition-all duration-fast hover:shadow-glass-pressed active:scale-[0.97] disabled:opacity-60"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.2s both' }}
      >
        {finishing ? 'Setting up...' : 'Get Started'}
      </button>
    </div>
  )
}
