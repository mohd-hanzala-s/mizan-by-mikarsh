import { useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { BarChart3, FileBarChart, Lightbulb, ArrowRight } from 'lucide-react'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { InsightsPage } from '@/features/insights/InsightsPage'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

type TabId = 'overview' | 'reports' | 'recommendations'

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
]

// Consolidates the former standalone Analytics, Reports, and Insights
// destinations into one hub — same three feature areas, same components
// and logic underneath (each still owns its own data loading), just one
// nav entry instead of three overlapping "look at your data" screens.
//
// Deep-link support: /insights?tab=overview or /insights?tab=reports lets
// existing bookmarks/links to the old pages land on the right tab (see the
// redirects in routes/router.tsx and the Quick Actions links in
// ProfilePage.tsx).
export function InsightsHubPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const activeTab = useMemo<TabId>(() => {
    const requested = searchParams.get('tab')
    return TABS.some((t) => t.id === requested) ? (requested as TabId) : 'recommendations'
  }, [searchParams])

  // Normalize the URL once so the address bar reflects the resolved tab
  // (e.g. a bare /insights becomes /insights?tab=recommendations), without
  // adding extra history entries on every tab switch.
  useEffect(() => {
    if (searchParams.get('tab') !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true })
    }
  }, [activeTab, searchParams, setSearchParams])

  function selectTab(id: TabId) {
    setSearchParams({ tab: id })
  }

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-h2 text-text-primary">Insights</h1>
          <Button variant="tertiary" size="sm" onClick={() => navigate('/simulator')}>
            Simulator <ArrowRight className="size-14" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-body-sm text-text-tertiary">
          Recommendations, trends, and reports — all derived entirely from your local data.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Insights sections"
        className="card-sm flex gap-4 overflow-x-auto p-4"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => selectTab(id)}
            className={cn(
              'flex min-h-touch flex-1 items-center justify-center gap-8 rounded-lg px-14 py-8 text-body-sm font-medium whitespace-nowrap transition-colors duration-fast',
              activeTab === id
                ? 'bg-brand-teal900/10 text-accent font-semibold'
                : 'text-text-secondary hover:bg-brand-teal900/5 hover:text-text-primary'
            )}
          >
            <Icon className="size-16 shrink-0" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Conditionally mounted (not just hidden) so each tab's own data
          loading only runs while visible — the same lazy-loading principle
          the app already applies at the route level. */}
      {activeTab === 'recommendations' && <InsightsPage embedded />}
      {activeTab === 'overview' && <AnalyticsPage embedded />}
      {activeTab === 'reports' && <ReportsPage embedded />}
    </div>
  )
}
