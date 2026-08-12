import { useRef, useState } from 'react'
import { Trash2, Pencil, Repeat, StickyNote } from 'lucide-react'
import type { Category, Transaction } from '@/types/entities'
import { DynamicIcon } from '@/components/common/DynamicIcon'
import { cn } from '@/utils/cn'
import { startOfStoredDate } from '@/utils/dates'

interface TransactionCardProps {
  transaction: Transaction
  category: Category | undefined
  onDelete: () => void
  onEdit: () => void
  onDuplicate: () => void
}

const SWIPE_ACTION_THRESHOLD = 72
const LONG_PRESS_MS = 500
const LONG_PRESS_MOVE_TOLERANCE = 10

export function TransactionCard({
  transaction,
  category,
  onDelete,
  onEdit,
  onDuplicate,
}: TransactionCardProps) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const longPressCancelled = useRef(false)

  const isTransfer = transaction.type === 'transfer'

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !isTransfer) onEdit()
    else if (e.key === 'Delete' || e.key === 'Backspace') onDelete()
    else if ((e.key === 'd' || e.key === 'D') && !isTransfer) onDuplicate()
    else return
    e.preventDefault()
  }

  function handlePointerDown(e: React.PointerEvent) {
    startX.current = e.clientX
    startY.current = e.clientY
    longPressCancelled.current = false
    longPressTimer.current = setTimeout(() => {
      if (!longPressCancelled.current && !isTransfer) onDuplicate()
    }, LONG_PRESS_MS)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    if (Math.abs(dx) > LONG_PRESS_MOVE_TOLERANCE || Math.abs(dy) > LONG_PRESS_MOVE_TOLERANCE) {
      longPressCancelled.current = true
      clearTimeout(longPressTimer.current)
    }
    setDragX(isTransfer ? Math.min(dx, 0) : dx)
  }

  function handlePointerUp() {
    clearTimeout(longPressTimer.current)
    setDragging(false)
    if (dragX <= -SWIPE_ACTION_THRESHOLD) onDelete()
    else if (dragX >= SWIPE_ACTION_THRESHOLD && !isTransfer) onEdit()
    setDragX(0)
  }

  const amountColor = isTransfer
    ? 'text-info'
    : transaction.type === 'expense' ? 'text-expense' : 'text-income'
  const amountPrefix = isTransfer
    ? transaction.transferDirection === 'credit' ? '+' : '\u2212'
    : transaction.type === 'expense' ? '\u2212' : '+'

  const amountLabel = `${amountPrefix}\u20B9${transaction.amount.toLocaleString('en-IN')}`
  const dateLabel = startOfStoredDate(transaction.transactionDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
  const actionLabel = isTransfer
    ? 'Press Delete to remove this transfer'
    : 'Press Enter to edit, Delete to remove, or D to duplicate'

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex items-center justify-between px-20">
        <span className={cn('flex items-center gap-8 text-body-sm font-medium text-income', dragX < 0 && 'invisible')}>
          <Pencil className="size-16" aria-hidden="true" /> Edit
        </span>
        <span className={cn('flex items-center gap-8 text-body-sm font-medium text-expense', dragX > 0 && 'invisible')}>
          Delete <Trash2 className="size-16" aria-hidden="true" />
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`${transaction.description}, ${amountLabel} on ${dateLabel} \u2014 ${actionLabel}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{ transform: `translateX(${dragX}px)` }}
        className={cn(
          'relative flex items-center gap-12 px-16 py-12 card-sm rounded-xl touch-pan-y',
          !dragging && 'transition-transform duration-standard'
        )}
      >
        <span
          className="flex size-40 shrink-0 items-center justify-center rounded-xl shadow-pressed transition-transform duration-fast group-hover:scale-105"
          style={{
            backgroundColor: category ? `${category.color}18` : 'rgba(150, 150, 150, 0.1)',
            color: category?.color ?? 'var(--text-tertiary)',
          }}
        >
          {category ? (
            <DynamicIcon name={category.icon} className="size-20" />
          ) : (
            <StickyNote className="size-20" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-8 min-w-0">
            <p className="truncate text-body font-semibold text-text-primary">{transaction.description}</p>
            {transaction.recurringRuleId && (
              <span className="flex items-center gap-2 rounded-lg bg-surface px-4 py-1 text-[10px] font-medium text-text-tertiary shadow-pressed shrink-0">
                <Repeat className="size-10" aria-hidden="true" /> Recurring
              </span>
            )}
          </div>
          <p className="truncate text-caption font-medium text-text-secondary mt-1">
            {category?.name ?? 'Uncategorized'} \u00B7{' '}
            {startOfStoredDate(transaction.transactionDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          {transaction.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4">
              {transaction.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-brand-teal900/8 px-6 py-1 text-[10px] font-medium text-brand-teal900 shadow-pressed">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <span className={cn('shrink-0 font-heading tabular-nums text-body-lg font-bold tracking-tight', amountColor)}>
          {amountPrefix}\u20B9{transaction.amount.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  )
}
