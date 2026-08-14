import { NavLink, useLocation } from 'react-router-dom'
import { Scale } from 'lucide-react'
import { PRIMARY_TABS, NAV_CHILDREN } from '@/constants/navigation'
import { cn } from '@/utils/cn'

export function NavigationRail() {
  const location = useLocation()

  function isTabActive(tabId: string, tabPath: string): boolean {
    if (tabPath === '/' && location.pathname === '/') return true
    if (location.pathname === tabPath) return true
    const children = NAV_CHILDREN[tabId]
    if (children) {
      return children.some((child) =>
        child.path === '/' ? location.pathname === '/' : location.pathname.startsWith(child.path)
      )
    }
    return false
  }

  return (
    <nav
      aria-label="Main navigation"
      className="card-nav hidden w-[80px] flex-col items-center gap-4 py-20 md:flex lg:w-[232px] lg:items-stretch lg:px-12 z-30"
    >
      <NavLink to="/" className="mb-16 flex items-center gap-10 px-8">
        <div className="card-sm flex size-36 shrink-0 items-center justify-center">
          <Scale className="size-18 text-brand-teal900" aria-hidden="true" />
        </div>
        <div className="hidden min-w-0 flex-col lg:flex">
          <span className="font-heading text-h3 tracking-tight font-bold text-text-primary">
            Mizan
          </span>
          <span className="text-[10px] tracking-widest font-semibold text-text-tertiary uppercase">
            Finance
          </span>
        </div>
      </NavLink>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {PRIMARY_TABS.map(({ id, label, path, icon: Icon }) => {
          const active = isTabActive(id, path)
          const hasChildren = NAV_CHILDREN[id] && NAV_CHILDREN[id].length > 0

          return (
            <div key={id}>
              <NavLink
                to={path}
                end={path === '/'}
                className={(_) =>
                  cn(
                    'group relative flex min-h-touch w-full items-center gap-10 rounded-2xl px-10 py-10 text-body-sm font-medium transition-all duration-standard',
                    'lg:w-full',
                    active
                      ? 'border-l-2 border-l-gold-500 bg-brand-teal900/10 text-accent font-semibold'
                      : 'text-text-secondary hover:bg-brand-teal900/5 hover:text-text-primary'
                  )
                }
              >
                <Icon
                  className={cn(
                    'size-20 shrink-0 transition-all duration-fast group-hover:scale-105',
                    active ? 'text-accent' : 'text-text-tertiary'
                  )}
                  aria-hidden="true"
                />
                <span className="hidden truncate lg:inline">{label}</span>
              </NavLink>
              {hasChildren && active && (
                <div className="flex flex-col gap-1 ml-32 mt-2">
                  {NAV_CHILDREN[id].map((child) => {
                    const childActive =
                      child.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(child.path)
                    return (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        end={child.path === '/'}
                        className={cn(
                          'group relative flex min-h-touch w-full items-center gap-10 rounded-2xl px-10 py-8 text-body-sm font-medium transition-all duration-standard',
                          childActive
                            ? 'text-accent font-semibold'
                            : 'text-text-secondary hover:bg-brand-teal900/5 hover:text-text-primary'
                        )}
                      >
                        <child.icon
                          className={cn(
                            'size-18 shrink-0 transition-all duration-fast group-hover:scale-105',
                            childActive ? 'text-accent' : 'text-text-tertiary'
                          )}
                          aria-hidden="true"
                        />
                        <span className="hidden truncate lg:inline">{child.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="hidden border-t border-border/30 pt-12 lg:block">
        <p className="px-10 text-[10px] font-medium text-text-tertiary">v2.0</p>
      </div>
    </nav>
  )
}
