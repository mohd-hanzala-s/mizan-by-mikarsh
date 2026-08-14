import { useParams, Outlet } from 'react-router-dom'
import { Target } from 'lucide-react'
import { GoalsPage } from './GoalsPage'
import { cn } from '@/utils/cn'

/**
 * Wraps the existing GoalsPage (unmodified — it already knows how to
 * navigate to /goals/:id) in a master-detail shell for lg+ widths,
 * mirroring the pattern in AccountsPage. Kept as a separate wrapper
 * rather than inlining into GoalsPage itself: GoalsPage is large enough
 * already that folding layout responsibility into it too would make it
 * harder to follow, and this way the list column's behavior is provably
 * identical to the plain /goals route (it's the exact same component).
 */
export function GoalsLayout() {
  const { id: selectedId } = useParams<{ id?: string }>()

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div
        className={cn(
          'lg:w-[380px] lg:shrink-0 lg:border-r lg:border-border lg:overflow-y-auto',
          selectedId && 'hidden lg:block'
        )}
      >
        <GoalsPage />
      </div>

      <div className={cn('flex-1', selectedId ? 'flex' : 'hidden lg:flex')}>
        {selectedId ? (
          <Outlet />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-8 p-24 text-center">
            <Target className="size-40 text-text-tertiary/50" aria-hidden="true" />
            <p className="text-body-sm text-text-tertiary">
              Select a goal to see its progress and contribution history.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
