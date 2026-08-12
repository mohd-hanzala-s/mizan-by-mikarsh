import { Plus } from 'lucide-react'
import { cn } from '@/utils/cn'

interface FabProps {
  onClick: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className }: FabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add transaction"
      className={cn(
        'card flex size-56 items-center justify-center rounded-full bg-brand-teal900 text-white dark:bg-gold-500 dark:text-brand-teal900',
        'transition-all duration-fast hover:shadow-lg active:scale-95',
        className
      )}
    >
      <Plus className="size-24" aria-hidden="true" />
    </button>
  )
}
