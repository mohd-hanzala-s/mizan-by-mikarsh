import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Trash2, TrendingDown, Repeat, Landmark, Target } from 'lucide-react'
import { format, isToday, isThisWeek } from 'date-fns'
import { NotificationService, type AppNotification } from '@/services/NotificationService'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/utils/cn'

const CATEGORY_ICONS: Record<AppNotification['category'], typeof Bell> = {
  budget: TrendingDown,
  recurring: Repeat,
  loan: Landmark,
  goal: Target,
}

const CATEGORY_LINKS: Record<AppNotification['category'], string> = {
  budget: '/budgets',
  recurring: '/recurring',
  loan: '/loans',
  goal: '/goals',
}

function groupNotifications(notifications: AppNotification[]) {
  const today: AppNotification[] = []
  const thisWeek: AppNotification[] = []
  const older: AppNotification[] = []

  for (const n of notifications) {
    const d = new Date(n.timestamp)
    if (isToday(d)) {
      today.push(n)
    } else if (isThisWeek(d, { weekStartsOn: 1 })) {
      thisWeek.push(n)
    } else {
      older.push(n)
    }
  }

  return { today, thisWeek, older }
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [justCleared, setJustCleared] = useState(false)

  useEffect(() => {
    setNotifications(NotificationService.getStoredNotifications())
  }, [])

  function handleMarkRead(id: string) {
    NotificationService.markAsRead(id)
    setNotifications(NotificationService.getStoredNotifications())
  }

  function handleClearAll() {
    NotificationService.clearAll()
    setNotifications([])
    setJustCleared(true)
    setTimeout(() => setJustCleared(false), 2000)
  }

  function handleClick(notification: AppNotification) {
    handleMarkRead(notification.id)
    const link = CATEGORY_LINKS[notification.category]
    if (link) navigate(link)
  }

  const grouped = groupNotifications(notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  if (notifications.length === 0) {
    return (
      <div className="p-16 md:p-24">
        <div className="flex items-center justify-between">
          <h1 className="text-h2 text-text-primary">Notifications</h1>
        </div>
        <EmptyState
          icon={Bell}
          title={justCleared ? 'All cleared' : 'No notifications'}
          description={
            justCleared
              ? 'Your notification history has been cleared.'
              : 'You will see budget alerts, bill reminders, and loan updates here.'
          }
        />
      </div>
    )
  }

  function renderSection(title: string, items: AppNotification[]) {
    if (items.length === 0) return null
    return (
      <div className="flex flex-col gap-8">
        <h2 className="text-overline text-text-tertiary px-4">{title}</h2>
        <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-md border border-border bg-surface-card">
          {items.map((n) => {
            const Icon = CATEGORY_ICONS[n.category]
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={cn(
                  'flex items-start gap-12 px-16 py-12 text-left transition-colors duration-fast hover:bg-neutral-50 dark:hover:bg-neutral-900',
                  !n.read && 'bg-info-subtle/30'
                )}
              >
                <div
                  className={cn(
                    'flex size-32 shrink-0 items-center justify-center rounded-full',
                    !n.read
                      ? 'bg-info-subtle text-info'
                      : 'bg-neutral-100 text-text-secondary dark:bg-neutral-800'
                  )}
                >
                  <Icon className="size-16" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-8">
                    <span className="text-caption font-semibold text-text-tertiary uppercase">
                      {n.category}
                    </span>
                    {!n.read && (
                      <span className="size-6 rounded-full bg-info" aria-label="Unread" />
                    )}
                  </div>
                  <p className="text-body-sm font-medium text-text-primary">{n.title}</p>
                  <p className="text-body-sm text-text-secondary">{n.body}</p>
                  <p className="text-caption text-text-tertiary">
                    {format(new Date(n.timestamp), 'd MMM yyyy, h:mm a')}
                  </p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkRead(n.id)
                    }}
                    className="flex size-28 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label="Mark as read"
                  >
                    <Check className="size-14" />
                  </button>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-h2 text-text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-expense px-8 py-2 text-caption font-bold text-white tabular-nums">
              {unreadCount} new
            </span>
          )}
        </div>
        <Button variant="tertiary" size="sm" onClick={handleClearAll}>
          <Trash2 className="size-14" aria-hidden="true" />
          Clear all
        </Button>
      </div>

      {renderSection('Today', grouped.today)}
      {renderSection('This Week', grouped.thisWeek)}
      {renderSection('Older', grouped.older)}
    </div>
  )
}
