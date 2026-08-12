import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db } from '@/database/db'
import { TransactionService } from '@/services/TransactionService'
import { AccountRepository } from '@/repositories/AccountRepository'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal'

describe('GlobalSearchModal — type filters', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()

    await TransactionService.create({
      amount: 500,
      description: 'Budget lunch',
      type: 'expense',
      categoryId: 'cat-food',
      accountId: 'acc-cash',
      transactionDate: new Date().toISOString(),
    })

    const account = await AccountRepository.getById('acc-cash')
    await AccountRepository.update(account!.id, { name: 'Budget Wallet' })

    // GlobalSearchModal reads from the Zustand stores' in-memory state
    // (kept in sync elsewhere in the app, e.g. AppShell/TransactionsPage),
    // not directly from Dexie — so tests need to load them explicitly.
    await useTransactionsStore.getState().load()
    await useAccountsStore.getState().load()
  })

  it('mixes result types together by default', async () => {
    render(
      <MemoryRouter>
        <GlobalSearchModal open onClose={() => {}} />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('Global search'), { target: { value: 'budget' } })

    await waitFor(() => {
      expect(screen.getByText('Budget lunch')).toBeInTheDocument()
      expect(screen.getByText('Budget Wallet')).toBeInTheDocument()
    })
  })

  it('narrows results to one type when its filter chip is selected', async () => {
    render(
      <MemoryRouter>
        <GlobalSearchModal open onClose={() => {}} />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('Global search'), { target: { value: 'budget' } })

    await waitFor(() => expect(screen.getByText('Budget lunch')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Accounts \(1\)/ }))

    await waitFor(() => {
      expect(screen.getByText('Budget Wallet')).toBeInTheDocument()
      expect(screen.queryByText('Budget lunch')).not.toBeInTheDocument()
    })
  })

  it('returning to "All" restores every matching type', async () => {
    render(
      <MemoryRouter>
        <GlobalSearchModal open onClose={() => {}} />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('Global search'), { target: { value: 'budget' } })
    await waitFor(() => expect(screen.getByText('Budget lunch')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Accounts \(1\)/ }))
    await waitFor(() => expect(screen.queryByText('Budget lunch')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    await waitFor(() => {
      expect(screen.getByText('Budget lunch')).toBeInTheDocument()
      expect(screen.getByText('Budget Wallet')).toBeInTheDocument()
    })
  })
})
