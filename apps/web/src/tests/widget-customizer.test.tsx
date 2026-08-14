import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WidgetCustomizer } from '@/features/dashboard/WidgetCustomizer'
import { DEFAULT_LAYOUT } from '@/features/dashboard/widgetConfig'

describe('WidgetCustomizer', () => {
  it('opens the customize panel and lists every default widget', () => {
    render(<WidgetCustomizer layout={DEFAULT_LAYOUT} onLayoutChange={() => {}} />)
    fireEvent.click(screen.getByLabelText('Customize dashboard'))
    expect(screen.getByText('Customize Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Overview Metrics')).toBeInTheDocument()
  })

  it('moving the first widget down swaps it with the second', () => {
    const onLayoutChange = vi.fn()
    render(<WidgetCustomizer layout={DEFAULT_LAYOUT} onLayoutChange={onLayoutChange} />)
    fireEvent.click(screen.getByLabelText('Customize dashboard'))

    const firstWidgetId = DEFAULT_LAYOUT[0]
    const secondWidgetId = DEFAULT_LAYOUT[1]

    fireEvent.click(screen.getAllByLabelText(/Move .+ down/)[0])

    const newLayout = onLayoutChange.mock.calls[0][0] as string[]
    expect(newLayout[0]).toBe(secondWidgetId)
    expect(newLayout[1]).toBe(firstWidgetId)
  })

  it('the first widget cannot move up and the last cannot move down', () => {
    render(<WidgetCustomizer layout={DEFAULT_LAYOUT} onLayoutChange={() => {}} />)
    fireEvent.click(screen.getByLabelText('Customize dashboard'))

    const upButtons = screen.getAllByLabelText(/Move .+ up/)
    const downButtons = screen.getAllByLabelText(/Move .+ down/)
    expect(upButtons[0]).toBeDisabled()
    expect(downButtons[downButtons.length - 1]).toBeDisabled()
  })

  it('shows "All widgets are visible" when nothing is hidden', () => {
    render(<WidgetCustomizer layout={DEFAULT_LAYOUT} onLayoutChange={() => {}} />)
    fireEvent.click(screen.getByLabelText('Customize dashboard'))
    expect(screen.getByText('All widgets are visible.')).toBeInTheDocument()
  })

  it('drag-and-drop reorders by moving the dragged widget before the drop target', () => {
    const onLayoutChange = vi.fn()
    render(<WidgetCustomizer layout={DEFAULT_LAYOUT} onLayoutChange={onLayoutChange} />)
    fireEvent.click(screen.getByLabelText('Customize dashboard'))

    // Each row is the parent of its "Move up" button's grandparent — walk
    // up from the up-buttons to their row containers.
    const upButtons = screen.getAllByLabelText(/Move .+ up/)
    const rows = upButtons.map((btn) => btn.closest('[draggable="true"]') as HTMLElement)

    const dragged = DEFAULT_LAYOUT[2]
    const target = DEFAULT_LAYOUT[0]

    fireEvent.dragStart(rows[2])
    fireEvent.dragOver(rows[0])
    fireEvent.drop(rows[0])

    const newLayout = onLayoutChange.mock.calls[0][0] as string[]
    expect(newLayout.indexOf(dragged)).toBeLessThan(newLayout.indexOf(target))
    expect(newLayout).toHaveLength(DEFAULT_LAYOUT.length)
    expect(new Set(newLayout)).toEqual(new Set(DEFAULT_LAYOUT))
  })
})
