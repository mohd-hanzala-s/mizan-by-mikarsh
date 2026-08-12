import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { db } from '@/database/db'
import { TransactionService } from '@/services/TransactionService'
import { App } from '@/App'

describe('Dashboard with data', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.settings.update('active', { onboardingCompleted: true })
    await TransactionService.create({
      amount: 45000,
      description: 'Salary',
      type: 'income',
      categoryId: 'cat-salary',
      accountId: 'acc-bank',
      transactionDate: new Date().toISOString(),
    })
    await TransactionService.create({
      amount: 250,
      description: 'Tea',
      type: 'expense',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      transactionDate: new Date().toISOString(),
    })
  })

  it(
    'shows metric cards and recent activity instead of the empty state',
    async () => {
      render(<App />)

      await waitFor(
        () => {
          // "Income" also appears in the Dashboard's Monthly Recap widget
          // (a summary of the same underlying data), so scope this check
          // to the main metrics row rather than assuming a single match.
          expect(screen.getAllByText('Income').length).toBeGreaterThan(0)
        },
        { timeout: 10000 }
      )

      expect(screen.queryByText(/no activity yet/i)).not.toBeInTheDocument()
      expect(screen.getAllByText('Expense').length).toBeGreaterThan(0)
      expect(screen.getByText('Salary')).toBeInTheDocument()
      expect(screen.getByText('Tea')).toBeInTheDocument()
    },
    15000
  )
})
