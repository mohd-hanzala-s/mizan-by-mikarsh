import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { db } from '@/database/db'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
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
    expect(useBudgetsStore.getState().isLoading).toBe(false)
    expect(useSettingsStore.getState().isLoading).toBe(false)
  })
}

describe('ReportsPage', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.settings.update('active', { onboardingCompleted: true })
  })

  it('shows an empty state before any transactions exist', async () => {
    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })
    expect(screen.getByText(/No reports yet/i)).toBeInTheDocument()
    await settle()
  })

  it('renders the report summary and sections once transactions exist', async () => {
    await addTransaction({ amount: 2000, type: 'income' })
    await addTransaction({ amount: 500 })
    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
    })
    expect(screen.getAllByText('₹2,000').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₹500').length).toBeGreaterThan(0)
    expect(screen.getAllByText('₹1,500').length).toBeGreaterThan(0)
    expect(screen.getByText('Spending by category')).toBeInTheDocument()
    expect(screen.getByText('By account')).toBeInTheDocument()
    expect(screen.getByText('Budget vs actual')).toBeInTheDocument()
    expect(screen.getByText('Top merchants')).toBeInTheDocument()
    expect(screen.getByText('Export & backup')).toBeInTheDocument()
    await settle()
  })

  it('switches between monthly, quarterly, and yearly period types', async () => {
    await addTransaction()
    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('radio', { name: 'Quarterly' }))
    expect(screen.getByRole('radio', { name: 'Quarterly' })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(screen.getByRole('radio', { name: 'Yearly' }))
    expect(screen.getByRole('radio', { name: 'Yearly' })).toHaveAttribute('aria-checked', 'true')
    await settle()
  })

  it('navigates to the previous period', async () => {
    const d = new Date()
    const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 15)
    await addTransaction({ transactionDate: todayIso() })
    await addTransaction({
      transactionDate: `${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}-10`,
      amount: 999,
    })

    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Previous period'))
    expect(screen.getAllByText('₹999').length).toBeGreaterThan(0)
    await settle()
  })

  it('offers CSV export and backup actions', async () => {
    await addTransaction()
    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download backup/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Choose backup file/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Optional backup passphrase')).toBeInTheDocument()
    await settle()
  })
})
