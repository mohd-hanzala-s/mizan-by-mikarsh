import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { db } from '@/database/db'
import { GoalService } from '@/services/GoalService'
import { GoalsLayout } from '@/features/goals/GoalsLayout'
import { GoalDetailPage } from '@/features/goals/GoalDetailPage'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/goals" element={<GoalsLayout />}>
          <Route path=":id" element={<GoalDetailPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Goals master-detail routing', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('shows the placeholder with no goal selected', async () => {
    renderAt('/goals')
    await waitFor(() => {
      expect(screen.getByText(/Select a goal to see its progress/i)).toBeInTheDocument()
    })
  })

  it('renders the selected goal detail via the nested route', async () => {
    const goal = await GoalService.create({
      name: 'Vacation Fund',
      type: 'travel',
      targetAmount: 50000,
      deadline: null,
      categoryId: null,
      notes: '',
    })

    renderAt(`/goals/${goal.id}`)

    await waitFor(() => {
      expect(screen.getAllByText('Vacation Fund').length).toBeGreaterThan(0)
    })
  })
})
