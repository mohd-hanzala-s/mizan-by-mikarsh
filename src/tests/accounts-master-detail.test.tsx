import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { db } from '@/database/db'
import { AccountsPage } from '@/features/accounts/AccountsPage'
import { AccountDetailPage } from '@/features/accounts/AccountDetailPage'

/** Mirrors the real nested route structure in routes/router.tsx —
 * AccountDetailPage renders as a child of AccountsPage so the list and
 * detail can share one URL tree for the lg+ master-detail split. */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/accounts" element={<AccountsPage />}>
          <Route path=":id" element={<AccountDetailPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Accounts master-detail routing', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('shows the account list and a placeholder with no selection', async () => {
    renderAt('/accounts')
    await waitFor(() => expect(screen.getByText('Cash')).toBeInTheDocument())
    expect(screen.getByText(/select an account to see its balance/i)).toBeInTheDocument()
  })

  it('renders the selected account detail via the nested route when navigating to /accounts/:id', async () => {
    renderAt('/accounts/acc-cash')

    // "Cash" appears both as a list-card name and as the detail header
    // once accounts finish loading — wait for that (not just the static
    // "Accounts" heading, which renders before the async load resolves)
    // to confirm the detail route actually rendered.
    await waitFor(() => {
      expect(screen.getAllByText('Cash').length).toBeGreaterThan(1)
    })
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('shows "Account not found" for an unknown id without crashing', async () => {
    renderAt('/accounts/does-not-exist')
    await waitFor(() => {
      expect(screen.getByText(/account not found/i)).toBeInTheDocument()
    })
  })
})
