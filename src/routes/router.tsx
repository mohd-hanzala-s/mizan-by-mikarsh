import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingScreen } from '@/components/common/LoadingScreen'

// Route-level code splitting (§4 performance rules — "lazy-load non-critical
// sections"). Each screen ships in its own chunk, loaded on first navigation,
// so the initial shell stays small and cold start stays fast.
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const TransactionsPage = lazy(() =>
  import('@/features/transactions/TransactionsPage').then((m) => ({ default: m.TransactionsPage }))
)
const AccountsPage = lazy(() =>
  import('@/features/accounts/AccountsPage').then((m) => ({ default: m.AccountsPage }))
)
const AccountDetailPage = lazy(() =>
  import('@/features/accounts/AccountDetailPage').then((m) => ({ default: m.AccountDetailPage }))
)
const BudgetsPage = lazy(() =>
  import('@/features/budgets/BudgetsPage').then((m) => ({ default: m.BudgetsPage }))
)
const LoansPage = lazy(() =>
  import('@/features/loans/LoansPage').then((m) => ({ default: m.LoansPage }))
)
const InvestmentsPage = lazy(() =>
  import('@/features/investments/InvestmentsPage').then((m) => ({ default: m.InvestmentsPage }))
)
const BillSplitsPage = lazy(() =>
  import('@/features/billsplit/BillSplitsPage').then((m) => ({ default: m.BillSplitsPage }))
)
const RecurringPage = lazy(() =>
  import('@/features/recurring/RecurringPage').then((m) => ({ default: m.RecurringPage }))
)
const CalendarPage = lazy(() =>
  import('@/features/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage }))
)
// Analytics, Reports, and Insights used to be three separate destinations —
// they're now tabs inside one hub (see InsightsHubPage). /analytics and
// /reports below redirect old links/bookmarks to the matching tab.
const InsightsHubPage = lazy(() =>
  import('@/features/insights/InsightsHubPage').then((m) => ({ default: m.InsightsHubPage }))
)
const MoneyHubPage = lazy(() =>
  import('@/features/money/MoneyHubPage').then((m) => ({ default: m.MoneyHubPage }))
)
const WealthHubPage = lazy(() =>
  import('@/features/wealth/WealthHubPage').then((m) => ({ default: m.WealthHubPage }))
)
const PlannerHubPage = lazy(() =>
  import('@/features/planner/PlannerHubPage').then((m) => ({ default: m.PlannerHubPage }))
)
const MoreHubPage = lazy(() =>
  import('@/features/more/MoreHubPage').then((m) => ({ default: m.MoreHubPage }))
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
)
const GoalsLayout = lazy(() =>
  import('@/features/goals/GoalsLayout').then((m) => ({ default: m.GoalsLayout }))
)
const GoalDetailPage = lazy(() =>
  import('@/features/goals/GoalDetailPage').then((m) => ({ default: m.GoalDetailPage }))
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  }))
)
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
)
const VaultPage = lazy(() =>
  import('@/features/vault/VaultPage').then((m) => ({ default: m.VaultPage }))
)
const VaultDocListPage = lazy(() =>
  import('@/features/vault/VaultDocListPage').then((m) => ({ default: m.VaultDocListPage }))
)
const VaultDocDetailPage = lazy(() =>
  import('@/features/vault/VaultDocDetailPage').then((m) => ({ default: m.VaultDocDetailPage }))
)
const AboutPage = lazy(() =>
  import('@/features/about/AboutPage').then((m) => ({ default: m.AboutPage }))
)
const BrandStoryPage = lazy(() =>
  import('@/features/about/BrandStoryPage').then((m) => ({ default: m.BrandStoryPage }))
)
const MissionPage = lazy(() =>
  import('@/features/about/MissionPage').then((m) => ({ default: m.MissionPage }))
)
const MikarshPage = lazy(() =>
  import('@/features/about/MikarshPage').then((m) => ({ default: m.MikarshPage }))
)
const PrivacyPage = lazy(() =>
  import('@/features/about/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
)
const FeaturesPage = lazy(() =>
  import('@/features/about/FeaturesPage').then((m) => ({ default: m.FeaturesPage }))
)
const FAQPage = lazy(() => import('@/features/about/FAQPage').then((m) => ({ default: m.FAQPage })))
const SimulatorPage = lazy(() =>
  import('@/features/simulator/SimulatorPage').then((m) => ({ default: m.SimulatorPage }))
)
const CommandCenter = lazy(() =>
  import('@/features/command/CommandCenter').then((m) => ({ default: m.CommandCenter }))
)
const AlertsPage = lazy(() =>
  import('@/features/automation/AutomationAlerts').then((m) => ({
    default: m.AutomationAlertsPage,
  }))
)
const NotFoundPage = lazy(() =>
  import('@/features/not-found/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/money" element={<MoneyHubPage />} />
          <Route path="/wealth" element={<WealthHubPage />} />
          <Route path="/planner" element={<PlannerHubPage />} />
          <Route path="/more" element={<MoreHubPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/accounts" element={<AccountsPage />}>
            <Route path=":id" element={<AccountDetailPage />} />
          </Route>
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/bill-splits" element={<BillSplitsPage />} />
          <Route path="/recurring" element={<RecurringPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/insights" element={<InsightsHubPage />} />
          <Route path="/analytics" element={<Navigate to="/insights?tab=overview" replace />} />
          <Route path="/reports" element={<Navigate to="/insights?tab=reports" replace />} />
          {/* Financial Replay is now a Dashboard widget ("Monthly Recap"),
              not a standalone destination — send old links home. */}
          <Route path="/replay" element={<Navigate to="/" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/goals" element={<GoalsLayout />}>
            <Route path=":id" element={<GoalDetailPage />} />
          </Route>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/vault/list" element={<VaultDocListPage />} />
          <Route path="/vault/detail" element={<VaultDocDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about/story" element={<BrandStoryPage />} />
          <Route path="/about/mission" element={<MissionPage />} />
          <Route path="/about/mikarsh" element={<MikarshPage />} />
          <Route path="/about/privacy" element={<PrivacyPage />} />
          <Route path="/about/features" element={<FeaturesPage />} />
          <Route path="/about/faq" element={<FAQPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/command" element={<CommandCenter />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
