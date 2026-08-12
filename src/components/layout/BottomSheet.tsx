import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <div
        className={cn(
          'card-modal absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-3xl',
          'lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-lg',
          'lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:max-h-[85vh]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-20 py-16">
          <h2 className="text-h3 text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-40 items-center justify-center rounded-2xl text-text-secondary hover:shadow-glass-pressed hover:text-text-primary transition-all"
          >
            <X className="size-20" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto p-20">{children}</div>
      </div>
    </div>
  )
}
