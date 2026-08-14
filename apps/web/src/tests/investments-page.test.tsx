import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db } from '@/database/db'
import { InvestmentService } from '@/services/InvestmentService'
import { InvestmentsPage } from '@/features/investments/InvestmentsPage'

describe('InvestmentsPage', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('shows an empty state before any holdings exist', async () => {
    render(
      <MemoryRouter>
        <InvestmentsPage />
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/no investments yet/i)).toBeInTheDocument()
    })
  })

  it('shows the portfolio summary and holding once one exists', async () => {
    await InvestmentService.create({
      name: 'Nifty Index Fund',
      type: 'mutual_fund',
      units: 10,
      avgCostPerUnit: 100,
      currentPricePerUnit: 120,
      accountId: null,
    })

    render(
      <MemoryRouter>
        <InvestmentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Nifty Index Fund')).toBeInTheDocument()
    })
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
    // Invested 1000, current 1200 -> gain of 200 (+20.0%)
    expect(screen.getByText(/\+₹200 \(\+20\.0%\)/)).toBeInTheDocument()
  })

  it('updates the price mark and recomputes gain/loss', async () => {
    await InvestmentService.create({
      name: 'Growth Fund',
      type: 'mutual_fund',
      units: 10,
      avgCostPerUnit: 100,
      currentPricePerUnit: 100,
      accountId: null,
    })

    render(
      <MemoryRouter>
        <InvestmentsPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Growth Fund')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('Update price'))
    const input = await screen.findByLabelText('Current price per unit')
    fireEvent.change(input, { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByText(/\+₹500 \(\+50\.0%\)/)).toBeInTheDocument()
    })
  })
})
