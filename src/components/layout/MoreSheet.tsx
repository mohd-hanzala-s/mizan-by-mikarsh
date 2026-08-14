import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { NAV_ITEMS } from '@/constants/navigation'
import { cn } from '@/utils/cn'

interface MoreSheetProps {
  open: boolean
  onClose: () => void
}

export function MoreSheet({ open, onClose }: MoreSheetProps) {
  const remainingItems = NAV_ITEMS.filter((item) => !item.primary)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="More destinations"
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <div
        className="card-modal absolute inset-x-0 bottom-0 p-20"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
      >
        <div className="mb-16 flex items-center justify-between">
          <h2 className="text-h3 text-text-primary">More</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex size-40 items-center justify-center rounded-2xl hover:shadow-glass-pressed text-text-secondary hover:text-text-primary transition-all"
          >
            <X className="size-20" aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-12">
          {remainingItems.map(({ id, label, path, icon: Icon }) => (
            <NavLink
              key={id}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex min-h-touch flex-col items-center gap-6 rounded-2xl p-12 text-body-sm font-medium transition-all duration-fast',
                  isActive
                    ? 'bg-brand-teal900/10 text-accent font-semibold'
                    : 'text-text-secondary hover:bg-brand-teal900/5'
                )
              }
            >
              <span className="flex size-36 items-center justify-center rounded-xl bg-brand-teal900/8 text-accent">
                <Icon className="size-20" aria-hidden="true" />
              </span>
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
