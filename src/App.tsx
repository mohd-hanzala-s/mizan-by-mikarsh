import { useEffect, useRef, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useSettingsStore } from '@/app/settingsStore'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'
import { AppLockScreen } from '@/components/common/AppLockScreen'
import { AppRoutes } from '@/routes/router'
import { SampleDataService } from '@/services/SampleDataService'

export function App() {
  const settings = useSettingsStore((s) => s.settings)
  const isLoading = useSettingsStore((s) => s.isLoading)
  const isError = useSettingsStore((s) => s.isError)
  const error = useSettingsStore((s) => s.error)
  const load = useSettingsStore((s) => s.load)
  const [unlocked, setUnlocked] = useState(false)
  const hiddenAtRef = useRef<number | null>(null)

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (settings?.onboardingCompleted && settings.sampleDataRequested) {
      SampleDataService.fulfillIfRequested().then(load)
    }
  }, [settings?.onboardingCompleted, settings?.sampleDataRequested, load])

  // Re-lock after backgrounding, per Settings.appLockTimeoutMinutes. Uses
  // the Page Visibility API — fires the same way in a browser tab switch
  // and in the Android Capacitor WebView going to background, so one
  // implementation covers both targets. `timeoutMinutes === 0` re-locks
  // on every single hide, `null` never re-locks while the app stays open
  // (a fresh launch always re-locks regardless, via `unlocked`'s initial
  // `false`).
  useEffect(() => {
    if (!settings?.appLockEnabled || !unlocked) return

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now()
        return
      }
      // visible again
      const hiddenAt = hiddenAtRef.current
      hiddenAtRef.current = null
      if (hiddenAt === null) return

      const timeoutMinutes = settings?.appLockTimeoutMinutes
      // `null` is the meaningful "never re-lock while open" sentinel,
      // distinct from `undefined` — nullish coalescing (`?? 5`) would
      // wrongly collapse "Never" into "5 minutes". `undefined` shouldn't
      // occur in practice (SettingsRepository.get() backfills it), but
      // falls back to 5 as a safety default rather than "never" if it
      // somehow does.
      if (timeoutMinutes === null) return
      const effectiveTimeoutMinutes = timeoutMinutes ?? 5

      const elapsedMinutes = (Date.now() - hiddenAt) / 60_000
      if (elapsedMinutes >= effectiveTimeoutMinutes) {
        setUnlocked(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [settings?.appLockEnabled, settings?.appLockTimeoutMinutes, unlocked])

  return (
    <ThemeProvider>
      {isLoading ? (
        <LoadingScreen />
      ) : isError ? (
        <ErrorState message={error ?? 'Failed to load settings'} onRetry={() => load()} />
      ) : !settings ? (
        <LoadingScreen />
      ) : !settings.onboardingCompleted ? (
        <OnboardingFlow />
      ) : settings.appLockEnabled && settings.appLockPinHash && !unlocked ? (
        <AppLockScreen storedHash={settings.appLockPinHash} onUnlock={() => setUnlocked(true)} />
      ) : (
        <BrowserRouter
          basename={import.meta.env.BASE_URL}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </BrowserRouter>
      )}
    </ThemeProvider>
  )
}
