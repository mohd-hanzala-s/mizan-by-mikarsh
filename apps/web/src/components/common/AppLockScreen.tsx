import { useEffect, useRef, useState } from 'react'
import { Scale, Fingerprint } from 'lucide-react'
import { PinInput } from '@/components/forms/PinInput'
import { SettingsService } from '@/services/SettingsService'
import { BiometricService } from '@/services/BiometricService'
import { Button } from '@/components/ui/button'
import { LockIllustration } from '@/components/common/Illustrations'

interface AppLockScreenProps {
  storedHash: string
  onUnlock: () => void
}

export function AppLockScreen({ storedHash, onUnlock }: AppLockScreenProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)
  const [shake, setShake] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricChecking, setBiometricChecking] = useState(false)
  const checkBiometric = useRef(BiometricService.isAvailable)

  useEffect(() => {
    let cancelled = false
    checkBiometric.current().then((ok) => {
      if (!cancelled) setBiometricAvailable(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleBiometricUnlock() {
    setBiometricChecking(true)
    const ok = await BiometricService.unlock()
    setBiometricChecking(false)
    if (ok) onUnlock()
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setChecking(true)
    setError(false)
    const valid = await SettingsService.verifyPin(pin, storedHash)
    setChecking(false)
    if (valid) {
      onUnlock()
    } else {
      setError(true)
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center gap-24 overflow-hidden bg-surface px-24">
      {/* Floating particle dots */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 6 + i * 2,
            height: 6 + i * 2,
            borderRadius: '50%',
            background: 'var(--color-brand-teal900)',
            opacity: 0.06 + i * 0.02,
            left: `${10 + i * 14}%`,
            top: `${15 + (i % 3) * 20}%`,
            animation: `mzn-float ${3 + i * 0.5}s ease-in-out infinite ${i * 0.4}s`,
          }}
        />
      ))}

      {/* Radial glow background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, var(--color-brand-teal900)0d 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo wordmark */}
      <div
        className="flex items-center gap-8"
        style={{ animation: 'mzn-scale-in 0.4s ease-out both' }}
      >
        <div className="flex size-32 items-center justify-center rounded-lg bg-brand-teal900/10">
          <Scale className="size-16 text-brand-teal900" aria-hidden="true" />
        </div>
        <span className="font-heading text-h3 font-bold text-text-primary">Mizan</span>
      </div>

      {/* Lock illustration */}
      <div style={{ animation: 'mzn-scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
        <LockIllustration size={130} shake={shake} />
      </div>

      <h1
        className="font-heading text-h1 font-bold text-text-primary"
        style={{ animation: 'mzn-scale-in 0.4s ease-out 0.2s both' }}
      >
        Mizan is locked
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-16"
        style={{ animation: 'mzn-scale-in 0.4s ease-out 0.3s both' }}
      >
        <PinInput value={pin} onChange={setPin} label="Enter PIN" autoFocus error={error} />
        {error && (
          <p
            className="text-body-sm text-expense"
            style={{ animation: 'mzn-shake 0.4s ease-in-out' }}
          >
            Incorrect PIN. Try again.
          </p>
        )}
        <Button type="submit" variant="primary" loading={checking} disabled={pin.length < 4}>
          Unlock
        </Button>
      </form>

      {biometricAvailable && (
        <button
          type="button"
          onClick={handleBiometricUnlock}
          disabled={biometricChecking}
          className="mt-4 inline-flex items-center gap-8 rounded-lg px-16 py-8 text-body text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
        >
          <Fingerprint className="size-18" aria-hidden="true" />
          {biometricChecking ? 'Authenticating…' : 'Unlock with biometrics'}
        </button>
      )}
    </div>
  )
}
