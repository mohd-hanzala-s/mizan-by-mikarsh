import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { db } from '@/database/db'
import { App } from '@/App'

describe('App post-onboarding', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    // Skip onboarding for this test — it's covered separately.
    await db.settings.update('active', { onboardingCompleted: true })
  })

  it('renders the app shell with the 5 primary navigation tabs', async () => {
    render(<App />)

    await waitFor(
      () => {
        expect(screen.getByText('No activity yet')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    const labels = ['Home', 'Money', 'Wealth', 'Planner', 'More']
    labels.forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    })
  })
})
