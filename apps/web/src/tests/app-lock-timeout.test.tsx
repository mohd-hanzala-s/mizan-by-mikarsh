import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { db } from '@/database/db'
import { SettingsService } from '@/services/SettingsService'
import { App } from '@/App'

/** Simulates the tab/app going to background then foreground again after
 * `elapsedMs`, the same visibilitychange sequence a real backgrounding
 * produces (see App.tsx). Controls `Date.now()` directly rather than
 * using fake timers, since fake timers also stall `waitFor`'s own
 * internal polling (it schedules its retries via setTimeout too).
 * jsdom's `document.visibilityState` is normally read-only, so it's
 * overridden per call via defineProperty. */
let mockedNow = Date.now()

function simulateBackgroundCycle(elapsedMs: number) {
  act(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })

  mockedNow += elapsedMs

  act(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

async function unlockWithPin(pin: string) {
  const input = screen.getByLabelText('Enter PIN')
  fireEvent.change(input, { target: { value: pin } })
  fireEvent.click(screen.getByRole('button', { name: /unlock/i }))
  await waitFor(() => {
    expect(screen.queryByText(/mizan is locked/i)).not.toBeInTheDocument()
  })
}

describe('App lock — auto-lock timeout', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.settings.update('active', { onboardingCompleted: true })
    await SettingsService.setPin('1234')
    mockedNow = Date.now()
    vi.spyOn(Date, 'now').mockImplementation(() => mockedNow)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('re-locks after the configured timeout elapses in the background', async () => {
    await db.settings.update('active', { appLockTimeoutMinutes: 5 })
    render(<App />)

    await waitFor(() => expect(screen.getByText(/mizan is locked/i)).toBeInTheDocument())
    await unlockWithPin('1234')

    simulateBackgroundCycle(6 * 60_000) // 6 minutes > 5 minute timeout

    await waitFor(() => expect(screen.getByText(/mizan is locked/i)).toBeInTheDocument())
  })

  it('stays unlocked when backgrounded for less than the timeout', async () => {
    await db.settings.update('active', { appLockTimeoutMinutes: 5 })
    render(<App />)

    await waitFor(() => expect(screen.getByText(/mizan is locked/i)).toBeInTheDocument())
    await unlockWithPin('1234')

    simulateBackgroundCycle(2 * 60_000) // 2 minutes < 5 minute timeout

    expect(screen.queryByText(/mizan is locked/i)).not.toBeInTheDocument()
  })

  it('never re-locks while open when the timeout is set to "Never"', async () => {
    await db.settings.update('active', { appLockTimeoutMinutes: null })
    render(<App />)

    await waitFor(() => expect(screen.getByText(/mizan is locked/i)).toBeInTheDocument())
    await unlockWithPin('1234')

    simulateBackgroundCycle(60 * 60_000) // 1 hour

    expect(screen.queryByText(/mizan is locked/i)).not.toBeInTheDocument()
  })

  it('re-locks immediately on any backgrounding when set to "Immediately"', async () => {
    await db.settings.update('active', { appLockTimeoutMinutes: 0 })
    render(<App />)

    await waitFor(() => expect(screen.getByText(/mizan is locked/i)).toBeInTheDocument())
    await unlockWithPin('1234')

    simulateBackgroundCycle(0)

    await waitFor(() => expect(screen.getByText(/mizan is locked/i)).toBeInTheDocument())
  })
})
