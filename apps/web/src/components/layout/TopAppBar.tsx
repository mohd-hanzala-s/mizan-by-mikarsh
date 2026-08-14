import { Search, Bell, Command } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { NAV_ITEMS } from '@/constants/navigation'
import { NotificationService } from '@/services/NotificationService'

interface TopAppBarProps {
  onScaffoldAction: (label: string) => void
  onNotificationsClick?: () => void
  onSearchClick?: () => void
}

export function TopAppBar({
  onScaffoldAction,
  onNotificationsClick,
  onSearchClick,
}: TopAppBarProps) {
  const location = useLocation()
  const current = NAV_ITEMS.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )
  const [unread, setUnread] = useState(() => NotificationService.unreadCount())

  useEffect(() => {
    const interval = setInterval(() => {
      setUnread(NotificationService.unreadCount())
    }, 15000)
    return () => clearInterval(interval)
  }, [location.pathname])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onSearchClick?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSearchClick])

  return (
    <header
      className="sticky top-0 z-20 flex h-56 shrink-0 items-center justify-between border-b border-brand-teal900/5 dark:border-brand-teal400/8 px-16 md:px-24 bg-surface/80 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <h1 className="font-heading text-h3 font-bold text-text-primary tracking-tight">
        {current?.label ?? 'Mizan'}
      </h1>
      <div className="flex items-center gap-8">
        <button
          type="button"
          aria-label="Search"
          onClick={onSearchClick ?? (() => onScaffoldAction('Search'))}
          className="card-input flex h-36 items-center gap-8 px-12 text-text-secondary transition-all duration-fast hover:text-text-primary group"
        >
          <Search className="size-16" aria-hidden="true" />
          <span className="hidden text-body-sm md:inline">Search...</span>
          <kbd className="hidden items-center gap-2 rounded-lg border border-border/40 bg-surface/80 px-4 py-1 text-[10px] font-mono font-medium text-text-tertiary md:flex">
            <Command className="size-10" />K
          </kbd>
        </button>
        <button
          type="button"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
          onClick={onNotificationsClick ?? (() => onScaffoldAction('Notifications'))}
          className="card-input relative flex size-36 items-center justify-center text-text-secondary transition-all duration-fast hover:text-text-primary"
        >
          <Bell className="size-16" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex size-16 items-center justify-center rounded-full bg-expense text-[10px] font-bold text-white ring-2 ring-surface tabular-nums">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
