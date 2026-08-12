export type DashboardWidgetId =
  | 'alerts'
  | 'metrics'
  | 'quick-add'
  | 'spending-timeline'
  | 'upcoming-payments'
  | 'budgets'
  | 'goals'
  | 'recent-activity'
  | 'accounts'
  | 'loans'
  | 'net-worth'
  | 'replay'

export interface DashboardWidget {
  id: DashboardWidgetId
  label: string
  defaultVisible: boolean
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: 'alerts', label: 'Alerts', defaultVisible: true },
  { id: 'metrics', label: 'Overview Metrics', defaultVisible: true },
  { id: 'quick-add', label: 'Quick Add', defaultVisible: true },
  { id: 'spending-timeline', label: 'Spending Timeline', defaultVisible: true },
  { id: 'upcoming-payments', label: 'Upcoming Payments', defaultVisible: true },
  { id: 'budgets', label: 'Budgets', defaultVisible: true },
  { id: 'goals', label: 'Goals', defaultVisible: true },
  { id: 'recent-activity', label: 'Recent Activity', defaultVisible: true },
  { id: 'accounts', label: 'Account Balances', defaultVisible: true },
  { id: 'loans', label: 'Loans', defaultVisible: true },
  { id: 'net-worth', label: 'Net Worth', defaultVisible: true },
  { id: 'replay', label: 'Monthly Recap', defaultVisible: true },
]

export type DashboardLayout = DashboardWidgetId[]

export const DEFAULT_LAYOUT: DashboardLayout = DASHBOARD_WIDGETS.map((w) => w.id)

const STORAGE_KEY = 'mizan-dashboard-layout'

export function loadLayout(): DashboardLayout {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((id): id is DashboardWidgetId =>
          DASHBOARD_WIDGETS.some((w) => w.id === id)
        )
      }
    }
  } catch {
    // localStorage not available
  }
  return DEFAULT_LAYOUT
}

export function saveLayout(layout: DashboardLayout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // localStorage not available
  }
}

export function getVisibleWidgets(layout: DashboardLayout): Set<DashboardWidgetId> {
  return new Set(layout)
}
