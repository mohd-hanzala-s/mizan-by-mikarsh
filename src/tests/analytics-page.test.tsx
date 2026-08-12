import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { db } from '@/database/db'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
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

describe('AnalyticsPage', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.settings.update('active', { onboardingCompleted: true })
  })

  it('shows an empty state before any transactions exist', async () => {
    render(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })
    expect(screen.getByText(/No analytics yet/i)).toBeInTheDocument()
    await settle()
  })

  it('renders the forecast and chart sections once transactions exist', async () => {
    await addTransaction()
    render(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByText('Cash flow · last 6 months')).toBeInTheDocument()
    })
    expect(screen.getByText(/Forecast · /)).toBeInTheDocument()
    expect(screen.getByText('Month-end spending')).toBeInTheDocument()
    expect(screen.getByText('Spending by category · this month')).toBeInTheDocument()
    expect(screen.getByText('Spending heatmap · last 16 weeks')).toBeInTheDocument()
    await settle()
  })

  it('shows a low-confidence note with sparse data', async () => {
    await addTransaction()
    render(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByText('Low confidence')).toBeInTheDocument()
    })
    await settle()
  })
})
