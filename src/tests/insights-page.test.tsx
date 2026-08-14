import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db } from '@/database/db'
import { InsightsPage } from '@/features/insights/InsightsPage'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useSettingsStore } from '@/app/settingsStore'
import type { Transaction } from '@/types/entities'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function addTransaction(overrides: Partial<Transaction> = {}) {
  const now = new Date().toISOString()
  const txn: Transaction = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    transactionDate: todayIso(),
    type: 'expense',
    amount: 500,
    currency: 'INR',
    description: 'Groceries',
    categoryId: 'cat-food',
    accountId: 'acc-cash',
    recurringRuleId: null,
    loanId: null,
    budgetId: null,
    tags: [],
    notes: '',
    status: 'paid',
    source: 'manual',
    isFavorite: false,
    isDeleted: false,
    version: 1,
    linkedTransactionId: null,
    ...overrides,
  }
  await db.transactions.add(txn)
  return txn
}

async function settle() {
  await waitFor(() => {
    expect(useTransactionsStore.getState().isLoading).toBe(false)
    expect(useAccountsStore.getState().isLoading).toBe(false)
    expect(useRecurringStore.getState().isLoading).toBe(false)
    expect(useLoansStore.getState().isLoading).toBe(false)
    expect(useBudgetsStore.getState().isLoading).toBe(false)
    expect(useSettingsStore.getState().isLoading).toBe(false)
  })
}

describe('InsightsPage', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.settings.update('active', { onboardingCompleted: true })
  })

  it('shows an empty state before any transactions exist', async () => {
    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Insights')).toBeInTheDocument()
    })
    expect(screen.getByText(/No insights yet/i)).toBeInTheDocument()
    await settle()
  })

  it('renders the health score once transactions exist', async () => {
    await addTransaction()
    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Health score')).toBeInTheDocument()
    })
    expect(screen.getByText(/Top strength/i)).toBeInTheDocument()
    expect(screen.getByText(/Top concern/i)).toBeInTheDocument()
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
    await settle()
  })

  it('renders the monthly profile section', async () => {
    await addTransaction({ type: 'income', amount: 50000, description: 'Salary' })
    await addTransaction({ amount: 2000, description: 'Groceries' })
    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Monthly profile')).toBeInTheDocument()
    })
    expect(screen.getByText(/Highest spending category/i)).toBeInTheDocument()
    expect(screen.getByText(/Average daily spend/i)).toBeInTheDocument()
    await settle()
  })

  it('dismisses a recommendation when the user marks it as unhelpful', async () => {
    await addTransaction({ amount: 5000, description: 'Overspend' })
    render(
      <MemoryRouter>
        <InsightsPage />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Recommendations')).toBeInTheDocument()
    })
    // With a single expense month the engine emits the low-priority monthly review
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i })
    expect(dismissButtons.length).toBeGreaterThan(0)
    dismissButtons[0].click()
    await waitFor(() => {
      const remaining = screen.queryAllByRole('button', { name: /dismiss/i })
      expect(remaining.length).toBeLessThan(dismissButtons.length)
    })
    await settle()
  })
})
