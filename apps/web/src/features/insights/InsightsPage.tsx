import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, Sparkles, ArrowRight } from 'lucide-react'
import { db } from '@/database/db'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { useInvestmentsStore } from '@/features/investments/investmentsStore'
import { useSettingsStore } from '@/app/settingsStore'
import {
  DEFAULT_AI_FEATURES,
  useFinancialIdentityStore,
} from '@/features/profile/financialIdentityStore'
import {
  InsightService,
  computeHealthBreakdown,
  type Recommendation,
  type RecommendationPriority,
} from '@/services/InsightService'
import { InsightCard } from '@/components/finance/InsightCard'
import { FinancialHealthCard } from '@/components/finance/FinancialHealthCard'
import { EmptyState } from '@/components/common/EmptyState'
import { EmptyInsightsIllustration } from '@/components/common/Illustrations'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { Category } from '@/types/entities'

const DISMISSED_STORAGE_KEY = 'mizan-dismissed-insights'

function loadDismissed(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // localStorage not available
  }
}

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-16 p-16">
      <h2 className="text-overline text-brand-teal400">{title}</h2>
      {children}
    </section>
  )
}

function ProfileRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'income' | 'expense'
}) {
  const toneClass =
    tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-text-primary'
  return (
    <div className="flex items-center justify-between gap-8 py-8">
      <span className="text-body-sm text-text-secondary">{label}</span>
      <span className={cn('text-right text-body-sm font-medium', toneClass)}>{value}</span>
    </div>
  )
}

const PRIORITY_BADGE: Record<RecommendationPriority, string> = {
  critical: 'bg-expense-subtle text-expense',
  high: 'bg-gold-500/15 text-gold-500',
  medium: 'bg-brand-teal400/15 text-brand-teal400',
  low: 'bg-brand-teal900/5 text-text-secondary',
}

function priorityCount(
  recommendations: Recommendation[],
  priority: RecommendationPriority
): number {
  return recommendations.filter((r) => r.priority === priority).length
}

export function InsightsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const rules = useRecurringStore((s) => s.rules)
  const loans = useLoansStore((s) => s.loans)
  const payments = useLoansStore((s) => s.payments)
  const budgets = useBudgetsStore((s) => s.budgets)
  const goals = useGoalsStore((s) => s.goals)
  const investments = useInvestmentsStore((s) => s.investments)
  const settings = useSettingsStore((s) => s.settings)
  const aiFeatures = useFinancialIdentityStore((s) => s.identity?.aiFeatures) ?? DEFAULT_AI_FEATURES
  const navigate = useNavigate()

  const loadsRef = useRef({
    tx: useTransactionsStore.getState().load,
    acct: useAccountsStore.getState().load,
    rec: useRecurringStore.getState().load,
    loans: useLoansStore.getState().load,
    budgets: useBudgetsStore.getState().load,
    goals: useGoalsStore.getState().load,
    investments: useInvestmentsStore.getState().load,
    settings: useSettingsStore.getState().load,
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed)

  useEffect(() => {
    loadsRef.current.tx()
    loadsRef.current.acct()
    loadsRef.current.rec()
    loadsRef.current.loans()
    loadsRef.current.budgets()
    loadsRef.current.goals()
    loadsRef.current.investments()
    loadsRef.current.settings()
    useFinancialIdentityStore.getState().load()
    db.categories.toArray().then((all) => setCategories(all.filter((c) => !c.isArchived)))
  }, [])

  const budgetMonthStart = settings?.budgetMonthStart ?? 1

  const health = useMemo(
    () =>
      InsightService.computeHealthScore(
        transactions,
        accounts,
        budgets,
        loans,
        payments,
        rules,
        budgetMonthStart
      ),
    [transactions, accounts, budgets, loans, payments, rules, budgetMonthStart]
  )

  const breakdownFactors = useMemo(
    () =>
      computeHealthBreakdown({
        transactions,
        accounts,
        rules,
        loans,
        payments,
        budgets,
        goals,
        investments,
        budgetMonthStart,
      }),
    [transactions, accounts, rules, loans, payments, budgets, goals, investments, budgetMonthStart]
  )

  const confidence = useMemo(
    () => InsightService.computeConfidenceIndex(transactions, accounts),
    [transactions, accounts]
  )

  const recommendations = useMemo(() => {
    if (!aiFeatures.recommendations) return []
    return InsightService.getRecommendations(
      transactions,
      accounts,
      budgets,
      categories,
      loans,
      payments,
      rules,
      budgetMonthStart
    )
  }, [
    transactions,
    accounts,
    budgets,
    categories,
    loans,
    payments,
    rules,
    budgetMonthStart,
    aiFeatures.recommendations,
  ])

  const visibleRecommendations = useMemo(
    () => recommendations.filter((r) => !dismissed.has(r.id)),
    [recommendations, dismissed]
  )

  const anomalies = useMemo(
    () => InsightService.getAnomalies(transactions, categories),
    [transactions, categories]
  )

  const profile = useMemo(
    () => InsightService.getMonthlyProfile(transactions, categories),
    [transactions, categories]
  )

  const savings = useMemo(() => {
    if (!aiFeatures.budgetSuggestions) return []
    return InsightService.getSavingsSuggestions(transactions, categories)
  }, [transactions, categories, aiFeatures.budgetSuggestions])

  const onFeedback = (id: string, type: 'helpful' | 'dismissed') => {
    if (type === 'dismissed') {
      setDismissed((prev) => {
        const next = new Set(prev).add(id)
        saveDismissed(next)
        return next
      })
    }
  }

  if (transactions.length === 0) {
    return (
      <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
        {!embedded && <h1 className="text-h2 text-text-primary">Insights</h1>}
        <EmptyState
          illustration={<EmptyInsightsIllustration size={140} />}
          title="No insights yet"
          description="Log some transactions and the Financial Health Score, patterns, and personalized recommendations will start appearing here."
        />
      </div>
    )
  }

  const hasAnomalies = anomalies.length > 0
  const hasRecommendations = visibleRecommendations.length > 0
  const hasSavings = savings.length > 0
  const hasProfileData = profile.highestSpendingCategory !== null

  return (
    <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
      <div className="flex flex-col gap-4">
        {!embedded && <h1 className="text-h2 text-text-primary">Insights</h1>}
        <p className="text-body-sm text-text-tertiary">
          Your Financial Health Score, patterns, and personalized recommendations — advisory only,
          derived entirely from your local data.
        </p>
      </div>

      <FinancialHealthCard health={health} breakdownFactors={breakdownFactors} />

      <Card title="Confidence Index">
        <p className="text-body-sm text-text-secondary mb-8">
          How reliable are your data and projections? Higher confidence means better insights.
        </p>
        <div className="flex items-center gap-16">
          <span
            className={cn(
              'text-h3 font-semibold tabular-nums',
              confidence.level === 'high'
                ? 'text-brand-teal400'
                : confidence.level === 'medium'
                  ? 'text-gold-500'
                  : 'text-expense'
            )}
          >
            {confidence.score}%
          </span>
          <div className="flex flex-wrap gap-8">
            {confidence.factors.map((f) => (
              <span
                key={f.label}
                className={cn(
                  'rounded-full px-12 py-4 text-caption font-medium',
                  f.score >= 70
                    ? 'bg-brand-teal400/15 text-brand-teal400'
                    : f.score >= 40
                      ? 'bg-gold-500/15 text-gold-500'
                      : 'bg-expense-subtle text-expense'
                )}
              >
                {f.label} {f.score}%
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Recommendations">
        {!hasRecommendations ? (
          <p className="text-body-sm text-text-tertiary">
            {!aiFeatures.recommendations
              ? 'Recommendations are turned off. Enable them in Profile → Smart Features.'
              : "No recommendations right now. Keep logging and they'll show up here when something needs attention."}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-8">
              {(['critical', 'high', 'medium', 'low'] as const).map((p) => {
                const count = priorityCount(visibleRecommendations, p)
                if (count === 0) return null
                return (
                  <span
                    key={p}
                    className={cn(
                      'rounded-full px-12 py-4 text-caption font-medium capitalize',
                      PRIORITY_BADGE[p]
                    )}
                  >
                    {p} · {count}
                  </span>
                )
              })}
            </div>
            <div className="flex flex-col gap-12">
              {visibleRecommendations.map((r) => (
                <InsightCard key={r.id} recommendation={r} onFeedback={onFeedback} />
              ))}
            </div>
          </>
        )}
      </Card>

      {hasAnomalies && (
        <Card title="Patterns & anomalies">
          <ul className="flex flex-col divide-y divide-border-subtle">
            {anomalies.map((a) => (
              <li key={a.id} className="flex items-start gap-8 py-8">
                <Radar className="mt-4 size-16 shrink-0 text-gold-500" aria-hidden="true" />
                <div className="flex flex-col gap-4">
                  <span className="text-body-sm font-medium text-text-primary">
                    {a.description}
                  </span>
                  <span className="text-body-sm text-text-secondary">{a.explanation}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {hasSavings && (
        <Card title="Savings suggestions">
          <p className="text-body-sm text-text-tertiary">
            Evidence-based cuts, drawn from the categories growing fastest this month.
          </p>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {savings.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-8 py-8">
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium text-text-primary">
                    {s.categoryName}
                  </p>
                  <p className="text-body-sm text-text-secondary">
                    {fmt(s.currentMonthSpend)} this month vs {fmt(s.avgMonthlySpend)} average
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-8">
                  <span className="text-body-sm font-medium tabular-nums text-brand-teal400">
                    ~{fmt(s.potential)}
                  </span>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => navigate('/transactions')}
                    className="gap-4"
                  >
                    Review <ArrowRight className="size-16" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Monthly profile">
        {!hasProfileData ? (
          <p className="text-body-sm text-text-tertiary">Nothing logged this month yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border-subtle">
            <ProfileRow
              label="Highest spending category"
              value={
                profile.highestSpendingCategory
                  ? `${profile.highestSpendingCategory.name} · ${fmt(profile.highestSpendingCategory.amount)}`
                  : '—'
              }
            />
            <ProfileRow label="Average daily spend" value={fmt(profile.averageDailySpend)} />
            <ProfileRow
              label="Most active day"
              value={profile.mostActiveDay ? `Day ${profile.mostActiveDay}` : '—'}
            />
            <ProfileRow
              label="Largest transaction"
              value={
                profile.largestTransaction
                  ? `${profile.largestTransaction.description} · ${fmt(profile.largestTransaction.amount)}`
                  : '—'
              }
            />
            <ProfileRow
              label="Most-used category"
              value={
                profile.mostUsedCategory
                  ? `${profile.mostUsedCategory.name} · ${profile.mostUsedCategory.count} entries`
                  : '—'
              }
            />
            <ProfileRow label="Recurring payments" value={String(profile.recurringPaymentCount)} />
            <ProfileRow
              label="Savings achieved"
              value={fmt(profile.savingsAchieved)}
              tone={profile.savingsAchieved >= 0 ? 'income' : 'expense'}
            />
            <ProfileRow
              label="Vs previous month"
              value={
                profile.vsPreviousMonth === null
                  ? '—'
                  : `${profile.vsPreviousMonth >= 0 ? '+' : ''}${profile.vsPreviousMonth.toFixed(0)}%`
              }
              tone={
                profile.vsPreviousMonth !== null && profile.vsPreviousMonth <= 0
                  ? 'income'
                  : 'expense'
              }
            />
          </div>
        )}
      </Card>

      <div className="flex items-center justify-center gap-8 text-caption text-text-tertiary">
        <Sparkles className="size-16" aria-hidden="true" />
        <span>
          {hasRecommendations
            ? `${visibleRecommendations.length} recommendation${visibleRecommendations.length === 1 ? '' : 's'}`
            : 'No active recommendations'}
          {hasAnomalies ? ` · ${anomalies.length} pattern${anomalies.length === 1 ? '' : 's'}` : ''}
          {hasSavings
            ? ` · ${savings.length} savings suggestion${savings.length === 1 ? '' : 's'}`
            : ''}
        </span>
      </div>
    </div>
  )
}
