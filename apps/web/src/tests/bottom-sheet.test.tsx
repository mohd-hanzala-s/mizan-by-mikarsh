import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomSheet } from '@/components/layout/BottomSheet'

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <BottomSheet open={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </BottomSheet>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders as a bottom-anchored sheet by default and a centered dialog at lg+', () => {
    render(
      <BottomSheet open onClose={() => {}} title="Test Sheet">
        <p>Content</p>
      </BottomSheet>
    )
    const dialog = screen.getByRole('dialog')
    // The panel is the dialog's second child (first is the backdrop button).
    const panel = dialog.children[1] as HTMLElement
    // Mobile: anchored to the bottom edge, full width.
    expect(panel.className).toContain('bottom-0')
    expect(panel.className).toContain('inset-x-0')
    // lg+: centered dialog instead — both the override classes that
    // cancel the mobile positioning and the ones that center it.
    expect(panel.className).toContain('lg:inset-x-auto')
    expect(panel.className).toContain('lg:bottom-auto')
    expect(panel.className).toContain('lg:left-1/2')
    expect(panel.className).toContain('lg:top-1/2')
    expect(panel.className).toContain('lg:max-w-lg')
  })

  it('shows the title and content', () => {
    render(
      <BottomSheet open onClose={() => {}} title="Add Something">
        <p>Form goes here</p>
      </BottomSheet>
    )
    expect(screen.getByText('Add Something')).toBeInTheDocument()
    expect(screen.getByText('Form goes here')).toBeInTheDocument()
  })
})
