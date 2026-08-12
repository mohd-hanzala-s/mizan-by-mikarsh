import { NavLink } from 'react-router-dom'
import { PRIMARY_TABS } from '@/constants/navigation'
import { cn } from '@/utils/cn'

export function BottomNavigation() {
  return (
    <nav
      aria-label="Primary navigation"
      className="card-nav sticky bottom-0 z-30 flex items-stretch md:hidden select-none dark:border-t dark:border-brand-teal400/8"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {PRIMARY_TABS.map(({ id, label, path, icon: Icon }) => (
        <NavLink
          key={id}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            cn(
              'group relative flex min-h-touch flex-1 flex-col items-center justify-center gap-2 py-8 text-[11px] font-medium transition-all duration-fast',
              isActive ? 'text-accent font-semibold' : 'text-text-secondary'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-1 left-1/2 size-4 -translate-x-1/2 rounded-full bg-gold-500" />
              )}
              <Icon
                className={cn(
                  'size-20 transition-transform duration-fast group-active:scale-90',
                  isActive && 'text-accent'
                )}
                aria-hidden="true"
              />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
