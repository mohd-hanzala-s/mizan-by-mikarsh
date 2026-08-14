import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, ArrowRight, FlaskConical } from 'lucide-react'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { useInvestmentsStore } from '@/features/investments/investmentsStore'
import { useSettingsStore } from '@/app/settingsStore'
import { computeHealthScore } from '@/services/InsightService'
import { GoalService } from '@/services/GoalService'
import { formatAmount } from '@/utils/currency'
import { DashboardCard } from '@/components/finance/DashboardCard'
import { GoalCard } from '@/components/finance/GoalCard'
import { ProgressRing } from '@/components/charts/ProgressRing'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonPage } from '@/components/common/Skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

function scoreTone(score: number): 'poor' | 'fair' | 'good' {
  if (score >= 70) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}

const TONE_RING_COLOR: Record<'poor' | 'fair' | 'good', string> = {
  poor: '#D9534F',
  fair: '#D9A441',
  good: '#62C3A7',
}

const TONE_RING_TRACK: Record<'poor' | 'fair' | 'good', string> = {
  poor: 'rgba(217, 83, 79, 0.15)',
  fair: 'rgba(217, 164, 65, 0.15)',
  good: 'rgba(98, 195, 167, 0.15)',
}

const TONE_LABEL: Record<'poor' | 'fair' | 'good', string> = {
  poor: 'Needs attention',
  fair: 'On the way',
  good: 'Healthy',
}

export function WealthHubPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const txIsLoading = useTransactionsStore((s) => s.isLoading)
  const loadTx = useTransactionsStore((s) => s.load)
  const accounts = useAccountsStore((s) => s.accounts)
  const acctIsLoading = useAccountsStore((s) => s.isLoading)
  const loadAccts = useAccountsStore((s) => s.load)
  const budgets = useBudgetsStore((s) => s.budgets)
  const loadBudgets = useBudgetsStore((s) => s.load)
  const recurringRules = useRecurringStore((s) => s.rules)
  const loadRecurring = useRecurringStore((s) => s.load)
  const loans = useLoansStore((s) => s.loans)
  const loanPayments = useLoansStore((s) => s.payments)
  const loadLoans = useLoansStore((s) => s.load)
  const goals = useGoalsStore((s) => s.goals)
  const loadGoals = useGoalsStore((s) => s.load)
  const investments = useInvestmentsStore((s) => s.investments)
  const invIsLoading = useInvestmentsStore((s) => s.isLoading)
  const loadInv = useInvestmentsStore((s) => s.load)
  const settings = useSettingsStore((s) => s.settings)
  const navigate = useNavigate()

  useEffect(() => {
    loadTx()
    loadAccts()
    loadBudgets()
    loadRecurring()
    loadLoans()
    loadGoals()
    loadInv()
  }, [loadTx, loadAccts, loadBudgets, loadRecurring, loadLoans, loadGoals, loadInv])

  const budgetMonthStart = settings?.budgetMonthStart ?? 1

  const netWorth = useMemo(() => {
    const activeAccounts = accounts.filter((a) => !a.isArchived)
    const assetTotal = activeAccounts.reduce((s, a) => s + Math.max(0, a.currentBalance), 0)
    const loanTotal = loans
      .filter((l) => l.status === 'active')
      .reduce((s, l) => s + l.currentBalance, 0)
    const nw = assetTotal - loanTotal
    return { nw, currency: activeAccounts[0]?.currency ?? 'INR' }
  }, [accounts, loans])

  const healthScore = useMemo(
    () =>
      computeHealthScore(
        transactions,
        accounts,
        budgets,
        loans,
        loanPayments,
        recurringRules,
        budgetMonthStart
      ),
    [transactions, accounts, budgets, loans, loanPayments, recurringRules, budgetMonthStart]
  )

  const healthTone = scoreTone(healthScore.score)

  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'active'), [goals])

  const activeInvestments = useMemo(
    () => investments.filter((i) => i.status !== 'sold'),
    [investments]
  )

  const investmentTotal = useMemo(
    () => activeInvestments.reduce((s, i) => s + i.units * i.currentPricePerUnit, 0),
    [activeInvestments]
  )

  if (txIsLoading || acctIsLoading || invIsLoading || !settings) {
    return <SkeletonPage sections={3} />
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No wealth data yet"
        description="Start tracking your finances to see net worth, goals, and health score here."
        actionLabel="Go to Dashboard"
        onAction={() => navigate('/')}
      />
    )
  }

  return (
    <div className="flex flex-col gap-20 p-16 md:p-24">
      <div>
        <h1 className="font-heading text-h2 font-bold text-text-primary tracking-tight">Wealth</h1>
        <p className="text-body-sm text-text-tertiary mt-4">Growth &amp; planning hub</p>
      </div>

      <section className="card-hero p-20 md:p-28">
        <div className="flex flex-col gap-20 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-8">
            <p className="text-caption font-medium text-brand-teal200 uppercase tracking-wider">
              Net Worth
            </p>
            <p className="text-display font-bold text-white tabular-nums tracking-tight">
              {netWorth.nw < 0 ? '\u2212' : ''}
              {formatAmount(Math.abs(netWorth.nw), netWorth.currency)}
            </p>
          </div>
          <div className="flex items-center gap-32">
            <ProgressRing
              value={healthScore.score}
              size={120}
              strokeWidth={10}
              color={TONE_RING_COLOR[healthTone]}
              trackColor={TONE_RING_TRACK[healthTone]}
              label={String(healthScore.score)}
              sublabel="Health"
            />
            <div className="flex flex-col gap-4">
              <span className="text-caption font-medium text-brand-teal200 uppercase tracking-wider">
                {TONE_LABEL[healthTone]}
              </span>
              <p className="text-body-sm text-brand-teal100 max-w-[200px]">
                {healthScore.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      </section>

      <DashboardCard
        title="Goals"
        action={
          activeGoals.length > 0 && (
            <Button variant="tertiary" size="sm" onClick={() => navigate('/goals')}>
              View All <ArrowRight className="size-14" aria-hidden="true" />
            </Button>
          )
        }
      >
        {activeGoals.length === 0 ? (
          <p className="text-body-sm text-text-secondary py-8">
            Set a savings or purchase goal to track your progress.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {activeGoals.slice(0, 3).map((goal) => (
              <GoalCard
                key={goal.id}
                progress={GoalService.computeProgress(goal)}
                compact
                onClick={() => navigate(`/goals/${goal.id}`)}
              />
            ))}
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        title="Investments"
        action={
          investments.length > 0 && (
            <Button variant="tertiary" size="sm" onClick={() => navigate('/investments')}>
              View All <ArrowRight className="size-14" aria-hidden="true" />
            </Button>
          )
        }
      >
        {investments.length === 0 ? (
          <p className="text-body-sm text-text-secondary py-8">
            Add investments to track your portfolio.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between py-8 border-b border-border">
              <span className="text-body-sm text-text-secondary">Total Portfolio Value</span>
              <span className="tabular-nums text-body font-bold text-text-primary">
                {formatAmount(investmentTotal, 'INR')}
              </span>
            </div>
            {activeInvestments.slice(0, 5).map((inv) => {
              const currentValue = inv.units * inv.currentPricePerUnit
              const purchaseValue = inv.units * inv.avgCostPerUnit
              const gain = currentValue - purchaseValue
              const gainPct = purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0
              return (
                <div key={inv.id} className="flex items-center justify-between gap-8 py-8">
                  <div className="min-w-0">
                    <p className="truncate text-body font-semibold text-text-primary">{inv.name}</p>
                    <p className="text-caption text-text-tertiary mt-1">{inv.type}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-nums text-body font-bold text-text-primary">
                      {formatAmount(currentValue, settings.currency)}
                    </p>
                    <p
                      className={cn(
                        'text-caption tabular-nums font-medium',
                        gain >= 0 ? 'text-income' : 'text-expense'
                      )}
                    >
                      {gain >= 0 ? '+' : ''}
                      {gainPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DashboardCard>

      <section className="card flex flex-col gap-14 p-20">
        <div className="flex items-center justify-between">
          <h2 className="text-overline font-bold tracking-wider text-text-tertiary uppercase">
            What-If Simulator
          </h2>
        </div>
        <div className="flex flex-col items-center gap-12 py-16">
          <FlaskConical className="size-40 text-brand-teal400/40" aria-hidden="true" />
          <p className="text-body-sm text-text-secondary text-center max-w-[300px]">
            See how changes in income, expenses, savings, and debt impact your financial future.
          </p>
          <Button variant="tertiary" size="sm" onClick={() => navigate('/simulator')}>
            Open Simulator <ArrowRight className="size-14" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </div>
  )
}
