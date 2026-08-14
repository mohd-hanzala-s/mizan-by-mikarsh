import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db } from '@/database/db'
import { BillSplitService } from '@/services/BillSplitService'
import { BillSplitsPage } from '@/features/billsplit/BillSplitsPage'

describe('BillSplitsPage', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('shows an empty state before any splits exist', async () => {
    render(
      <MemoryRouter>
        <BillSplitsPage />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/no shared bills yet/i)).toBeInTheDocument()
    })
  })

  it('shows the split, its participants, and total outstanding', async () => {
    await BillSplitService.create({
      description: 'Dinner at Cafe Blue',
      totalAmount: 90,
      participantNames: ['Alice', 'Bob'],
    })

    render(
      <MemoryRouter>
        <BillSplitsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Dinner at Cafe Blue')).toBeInTheDocument()
    })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Total still owed to you')).toBeInTheDocument()
  })

  it('marking a participant settled updates the outstanding total', async () => {
    await BillSplitService.create({
      description: 'Groceries',
      totalAmount: 60,
      participantNames: ['Alice'],
    })

    render(
      <MemoryRouter>
        <BillSplitsPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Groceries')).toBeInTheDocument())
    // ₹60 across payer + Alice = 2-way, Alice owes ₹30 (appears for both
    // "You" and Alice's row since it's an even split — just confirm it's
    // present at least once rather than assuming a single match).
    expect(screen.getAllByText('₹30').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByLabelText('Mark Alice as paid'))

    await waitFor(() => {
      expect(screen.getByText('Settled')).toBeInTheDocument()
      expect(screen.queryByText('Total still owed to you')).not.toBeInTheDocument()
    })
  })
})
