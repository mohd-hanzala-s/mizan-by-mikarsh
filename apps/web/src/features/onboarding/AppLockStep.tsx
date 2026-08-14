import { useState } from 'react'
import { PinInput } from '@/components/forms/PinInput'
import { SettingsService } from '@/services/SettingsService'
import { useSettingsStore } from '@/app/settingsStore'
import { LockIllustration } from '@/components/common/Illustrations'
import { CheckCircle2 } from 'lucide-react'

export function AppLockStep() {
  const settings = useSettingsStore((s) => s.settings)
  const load = useSettingsStore((s) => s.load)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const enabled = settings?.appLockEnabled ?? false

  async function handleSetPin() {
    setError(null)
    if (pin.length < 4) return setError('PIN must be at least 4 digits.')
    if (pin !== confirmPin) {
      setError('PINs don\u2019t match.')
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

  return (
    <div className="flex flex-col items-center gap-24 text-center">
      {/* Illustration */}
      <div style={{ animation: 'mzn-scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <LockIllustration size={140} shake={shake} />
      </div>

      <div
        className="flex flex-col gap-8"
        style={{ animation: 'mzn-scale-in 0.5s ease-out 0.1s both' }}
      >
        <h2 className="font-heading text-h1 font-bold text-text-primary">Protect your data</h2>
        <p className="max-w-sm text-body text-text-secondary">
          Optional: set a PIN so only you can open Mizan. You can change this anytime in Settings.
        </p>
      </div>

      {enabled ? (
        <div
          className="flex flex-col items-center gap-12 rounded-xl border border-income/30 bg-income-subtle px-24 py-16"
          style={{ animation: 'mzn-scale-in 0.4s ease-out both' }}
        >
          <div className="flex items-center gap-8">
            <CheckCircle2 className="size-20 text-income" aria-hidden="true" />
            <p className="text-body-sm font-semibold text-income">PIN is set</p>
          </div>
          <button
            type="button"
            onClick={handleDisable}
            className="inline-flex min-h-touch items-center justify-center text-body-sm text-text-secondary underline"
          >
            Remove PIN
          </button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center gap-12"
          style={{ animation: 'mzn-scale-in 0.4s ease-out 0.2s both' }}
        >
          <PinInput value={pin} onChange={setPin} label="Choose a PIN" autoFocus />
          <PinInput value={confirmPin} onChange={setConfirmPin} label="Confirm PIN" />
          {error && (
            <p
              className="text-body-sm text-expense"
              style={{ animation: 'mzn-shake 0.4s ease-in-out' }}
            >
              {error}
            </p>
          )}
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
  )
}
