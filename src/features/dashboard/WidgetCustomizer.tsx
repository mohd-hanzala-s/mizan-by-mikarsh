import { useState } from 'react'
import { Settings2, X, GripVertical, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import {
  DASHBOARD_WIDGETS,
  type DashboardLayout,
  type DashboardWidgetId,
  saveLayout,
} from './widgetConfig'

interface WidgetCustomizerProps {
  layout: DashboardLayout
  onLayoutChange: (layout: DashboardLayout) => void
}

export function WidgetCustomizer({ layout, onLayoutChange }: WidgetCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draggedId, setDraggedId] = useState<DashboardWidgetId | null>(null)
  const [dragOverId, setDragOverId] = useState<DashboardWidgetId | null>(null)

  function toggle(widgetId: DashboardWidgetId) {
    const next = layout.includes(widgetId)
      ? layout.filter((id) => id !== widgetId)
      : [...layout, widgetId]
    onLayoutChange(next)
    saveLayout(next)
  }

  function move(widgetId: DashboardWidgetId, direction: 'up' | 'down') {
    const idx = layout.indexOf(widgetId)
    if (idx === -1) return
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= layout.length) return
    const next = [...layout]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onLayoutChange(next)
    saveLayout(next)
  }

  /** Reorders by moving `draggedId` to sit just before `targetId` — native
   * HTML5 drag-and-drop (no extra dependency for something this simple).
   * The up/down buttons stay as a fully-equivalent, keyboard/screen-reader
   * accessible way to do the same reorder — drag is additive polish, not
   * a replacement for an operable fallback. */
  function handleDrop(targetId: DashboardWidgetId) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }
    const withoutDragged = layout.filter((id) => id !== draggedId)
    const targetIndex = withoutDragged.indexOf(targetId)
    const next = [
      ...withoutDragged.slice(0, targetIndex),
      draggedId,
      ...withoutDragged.slice(targetIndex),
    ]
    onLayoutChange(next)
    saveLayout(next)
    setDraggedId(null)
    setDragOverId(null)
  }

  function isVisible(widgetId: DashboardWidgetId): boolean {
    return layout.includes(widgetId)
  }

  return (
    <>
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label="Customize dashboard"
      >
        <Settings2 className="size-16" aria-hidden="true" />
        <span className="hidden sm:inline">Customize</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-teal900/60 p-16">
          <div className="flex max-h-full w-full max-w-md flex-col gap-16 overflow-auto card-modal p-16 md:p-24">
            <div className="flex items-center justify-between">
              <h2 className="text-h3 text-text-primary">Customize Dashboard</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-32 items-center justify-center rounded-full text-text-secondary hover:bg-surface-pressed dark:hover:bg-surface-raised"
                aria-label="Close"
              >
                <X className="size-20" />
              </button>
            </div>

            <p className="text-body-sm text-text-secondary">
              Toggle visibility and reorder the sections on your dashboard.
            </p>

            <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-md border border-border">
              {layout.map((widgetId, idx) => {
                const widget = DASHBOARD_WIDGETS.find((w) => w.id === widgetId)
                if (!widget) return null
                const isFirst = idx === 0
                const isLast = idx === layout.length - 1

                return (
                  <div
                    key={widgetId}
                    draggable
                    onDragStart={() => setDraggedId(widgetId)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (dragOverId !== widgetId) setDragOverId(widgetId)
                    }}
                    onDragLeave={() => setDragOverId((prev) => (prev === widgetId ? null : prev))}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDrop(widgetId)
                    }}
                    onDragEnd={() => {
                      setDraggedId(null)
                      setDragOverId(null)
                    }}
                    className={cn(
                      'flex items-center gap-8 card px-12 py-12 border-none rounded-none transition-colors first:rounded-t-md last:rounded-b-md',
                      draggedId === widgetId && 'opacity-40',
                      dragOverId === widgetId &&
                        draggedId !== widgetId &&
                        'border-t-2 border-t-brand-teal400'
                    )}
                  >
                    <GripVertical
                      className="size-16 shrink-0 cursor-grab text-text-tertiary active:cursor-grabbing"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-body font-medium text-text-primary">
                      {widget.label}
                    </span>
                    <div className="flex shrink-0 items-center gap-4">
                      <button
                        type="button"
                        onClick={() => move(widgetId, 'up')}
                        disabled={isFirst}
                        className="flex size-28 items-center justify-center rounded text-text-secondary hover:bg-surface-pressed disabled:opacity-30 dark:hover:bg-surface-raised"
                        aria-label={`Move ${widget.label} up`}
                      >
                        <ChevronUp className="size-14" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(widgetId, 'down')}
                        disabled={isLast}
                        className="flex size-28 items-center justify-center rounded text-text-secondary hover:bg-surface-pressed disabled:opacity-30 dark:hover:bg-surface-raised"
                        aria-label={`Move ${widget.label} down`}
                      >
                        <ChevronDown className="size-14" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-overline text-text-tertiary">Hidden widgets</h3>
              {DASHBOARD_WIDGETS.filter((w) => !isVisible(w.id)).map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center gap-8 rounded-md border border-border-subtle card px-12 py-8"
                >
                  <EyeOff className="size-14 shrink-0 text-text-tertiary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-body-sm text-text-tertiary">
                    {widget.label}
                  </span>
                  <Button variant="tertiary" size="sm" onClick={() => toggle(widget.id)}>
                    Show
                  </Button>
                </div>
              ))}
              {DASHBOARD_WIDGETS.every((w) => isVisible(w.id)) && (
                <p className="text-body-sm text-text-tertiary">All widgets are visible.</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
