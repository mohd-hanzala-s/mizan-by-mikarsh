import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Zap,
  TrendingUp,
  CreditCard,
  PiggyBank,
  AlertCircle,
  Target,
  BarChart3,
  Calculator,
  Wallet,
  Landmark,
} from 'lucide-react'
import { db } from '@/database/db'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { useSettingsStore } from '@/app/settingsStore'
import { getCashFlowSeries, getLoanAnalysis } from '@/services/AnalyticsService'
import { SimulationService, getDefaultInputs } from '@/services/SimulationService'
import { GoalService } from '@/services/GoalService'
import { computeBudgetStatus } from '@/services/BudgetService'
import { InsightService } from '@/services/InsightService'
import { cn } from '@/utils/cn'
import type {
  Account,
  Budget,
  Category,
  Transaction,
  RecurringRule,
  Loan,
  LoanPayment,
  Goal,
} from '@/types/entities'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

type CommandResult =
  | { type: 'empty'; query: string }
  | { type: 'error'; message: string }
  | {
      type: 'biggest_expenses'
      transactions: Array<{ description: string; amount: number; categoryName: string }>
    }
  | {
      type: 'affordability'
      item: string
      amount: number
      canAfford: boolean
      maybe: boolean
      reasoning: string
    }
  | {
      type: 'net_worth_prediction'
      years: number
      finalNetWorth: number
      debtFreeYear: number | null
      fiYear: number | null
    }
  | {
      type: 'monthly_savings'
      recommendedAmount: number
      monthlyIncome: number
      monthlyExpenses: number
    }
  | { type: 'duplicate_subs'; rules: RecurringRule[] }
  | {
      type: 'monthly_spending'
      total: number
      categoryBreakdown: Array<{ name: string; amount: number; percent: number }>
    }
  | {
      type: 'budget_status'
      statuses: Array<{ name: string; percentUsed: number; severity: string; remaining: number }>
    }
  | { type: 'closest_goal'; goal: Goal; progress: ReturnType<typeof GoalService.computeProgress> }
  | {
      type: 'total_debt'
      totalOutstanding: number
      loans: Array<{ name: string; balance: number; emi: number }>
    }
  | { type: 'retirement_check'; healthScore: number; projectedNW: number; message: string }
  | { type: 'not_understood'; query: string }

interface ResultCard {
  icon: typeof Search
  title: string
  subtitle: string
  detail?: string
  action?: { label: string; path: string }
  color: string
}

const SUGGESTIONS = [
  'Show my biggest expenses',
  "What's my spending this month?",
  'How much should I save monthly?',
  'How much debt do I have?',
  'How am I doing on budgets?',
  'Which goal is closest?',
  'Find duplicate subscriptions',
  'Predict my net worth in 5 years',
  'Can I afford a 50000 vacation?',
  'Am I on track for retirement?',
]

function monthTransactions(
  transactions: Transaction[],
  offset: number,
  reference: Date
): Transaction[] {
  const start = new Date(reference.getFullYear(), reference.getMonth() - offset, 1)
  const end = new Date(reference.getFullYear(), reference.getMonth() - offset + 1, 1)
  return transactions.filter(
    (t) => !t.isDeleted && new Date(t.transactionDate) >= start && new Date(t.transactionDate) < end
  )
}

function filterExpense(txs: Transaction[]): Transaction[] {
  return txs.filter((t) => t.type === 'expense')
}

function categorySums(txs: Transaction[], categories: Category[]): Map<string, number> {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const map = new Map<string, number>()
  for (const t of filterExpense(txs)) {
    const name = catById.get(t.categoryId)?.name ?? 'Uncategorized'
    map.set(name, (map.get(name) ?? 0) + t.amount)
  }
  return map
}

function executeCommand(
  query: string,
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  rules: RecurringRule[],
  loans: Loan[],
  payments: LoanPayment[],
  budgets: Budget[],
  goals: Goal[],
  budgetMonthStart: number
): CommandResult {
  const q = query.trim().toLowerCase()
  const reference = new Date()

  if (
    q.includes('biggest expense') ||
    q.includes('largest expense') ||
    q.includes('top expense') ||
    q.includes('most expense')
  ) {
    const currentMonth = monthTransactions(transactions, 0, reference)
    const expenses = filterExpense(currentMonth)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
    if (expenses.length === 0) return { type: 'error', message: 'No expenses found this month.' }
    const catById = new Map(categories.map((c) => [c.id, c]))
    return {
      type: 'biggest_expenses',
      transactions: expenses.map((t) => ({
        description: t.description || 'Transaction',
        amount: t.amount,
        categoryName: catById.get(t.categoryId)?.name ?? 'Uncategorized',
      })),
    }
  }

  const affordMatch = q.match(/can i afford a[n]? (\d+)\s*(.+?)\??$/)
  if (affordMatch) {
    const amount = Number(affordMatch[1])
    const item = affordMatch[2].trim()
    const series = getCashFlowSeries(transactions, 3, reference)
    const current = series[series.length - 1]
    const savingsRate = current?.savingsRate ?? 0
    const totalBalance = accounts
      .filter((a) => !a.isArchived)
      .reduce((s, a) => s + a.currentBalance, 0)
    const discretionary = (savingsRate / 100) * (current?.income ?? 0)

    let canAfford = false
    let maybe = false
    let reasoning: string

    if (discretionary >= amount) {
      canAfford = true
      reasoning = `Your monthly savings of ${fmt(discretionary)} can easily cover the ${fmt(amount)} ${item}. Your savings rate is ${savingsRate.toFixed(1)}%.`
    } else if (totalBalance > amount * 3) {
      maybe = true
      reasoning = `A ${fmt(amount)} ${item} is a significant purchase. You have ${fmt(totalBalance)} in total balance. If you save ${fmt(amount)} over the next few months it should be manageable.`
    } else {
      reasoning = `A ${fmt(amount)} ${item} would stretch your finances. Your available balance is ${fmt(totalBalance)} and monthly savings are ${fmt(discretionary)}. Consider saving for it over ${Math.ceil(amount / Math.max(1, discretionary))} months.`
    }

    return { type: 'affordability', item, amount, canAfford, maybe, reasoning }
  }

  if (q.includes('predict') && q.includes('net worth')) {
    const yearMatch = q.match(/(\d+)\s*years?/)
    const years = yearMatch ? Number(yearMatch[1]) : 5
    const simInputs = getDefaultInputs({
      transactions: transactions.filter((t) => !t.isDeleted),
      accounts,
      loans: loans.filter((l) => l.status === 'active'),
      investments: [],
      identity: null,
    })
    simInputs.projectionYears = years
    const result = SimulationService.runSimulation(simInputs)
    return {
      type: 'net_worth_prediction',
      years,
      finalNetWorth: result.finalNetWorth,
      debtFreeYear: result.debtFreeYear,
      fiYear: result.fiYear,
    }
  }

  if (
    q.includes('save monthly') ||
    q.includes('how much should i save') ||
    q.includes('how much to save')
  ) {
    const currentMonth = monthTransactions(transactions, 0, reference)
    const monthIncome = currentMonth
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
    const monthExpense = currentMonth
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)

    if (monthIncome <= 0)
      return {
        type: 'error',
        message:
          'No income data available. Add income transactions to get a savings recommendation.',
      }

    const twentySave = monthIncome * 0.2

    return {
      type: 'monthly_savings',
      recommendedAmount: Math.round(twentySave),
      monthlyIncome: Math.round(monthIncome),
      monthlyExpenses: Math.round(monthExpense),
    }
  }

  if (q.includes('duplicate') && (q.includes('sub') || q.includes('recurring'))) {
    const expenseRules = rules.filter((r) => r.active && r.type === 'expense')
    const dups: RecurringRule[] = []
    for (let i = 0; i < expenseRules.length; i++) {
      for (let j = i + 1; j < expenseRules.length; j++) {
        const a = expenseRules[i]
        const b = expenseRules[j]
        if (a.categoryId !== b.categoryId) continue
        const diff = Math.abs(a.amount - b.amount)
        const avg = (a.amount + b.amount) / 2
        if (avg > 0 && diff / avg <= 0.1) {
          if (!dups.includes(a)) dups.push(a)
          if (!dups.includes(b)) dups.push(b)
        }
      }
    }
    return { type: 'duplicate_subs', rules: dups }
  }

  if (
    q.includes('spending this month') ||
    q.includes('this month spending') ||
    q.includes('monthly spend') ||
    q.includes('my spending')
  ) {
    const currentMonth = monthTransactions(transactions, 0, reference)
    const total = filterExpense(currentMonth).reduce((s, t) => s + t.amount, 0)
    const catSums = categorySums(currentMonth, categories)
    const sorted = [...catSums.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount]) => ({ name, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))

    return {
      type: 'monthly_spending',
      total,
      categoryBreakdown: sorted,
    }
  }

  if (q.includes('budget') && (q.includes('how') || q.includes('status') || q.includes('doing'))) {
    const statuses = budgets
      .filter((b) => b.active)
      .map((b) => {
        const s = computeBudgetStatus(b, transactions, budgetMonthStart, reference)
        const catById = new Map(categories.map((c) => [c.id, c]))
        const name =
          b.categoryId === 'global' ? 'Overall' : (catById.get(b.categoryId)?.name ?? 'Budget')
        return { name, percentUsed: s.percentUsed, severity: s.severity, remaining: s.remaining }
      })
      .sort((a, b) => b.percentUsed - a.percentUsed)

    return { type: 'budget_status', statuses }
  }

  if (q.includes('closest goal') || q.includes('which goal') || q.includes('nearest goal')) {
    const activeGoals = goals.filter((g) => g.status === 'active')
    if (activeGoals.length === 0)
      return {
        type: 'error',
        message: 'No active goals found. Create a goal in the Goals section.',
      }

    const withProgress = activeGoals
      .map((g) => ({ goal: g, progress: GoalService.computeProgress(g) }))
      .sort((a, b) => b.progress.percentage - a.progress.percentage)

    return {
      type: 'closest_goal',
      goal: withProgress[0].goal,
      progress: withProgress[0].progress,
    }
  }

  if (q.includes('debt') || q.includes('loan') || q.includes('emi')) {
    const analysis = getLoanAnalysis(loans)
    if (analysis.totalOutstanding === 0)
      return { type: 'error', message: 'You have no outstanding debt. Well done!' }

    return {
      type: 'total_debt',
      totalOutstanding: analysis.totalOutstanding,
      loans: analysis.loans
        .filter((l) => l.status === 'active')
        .map((l) => ({ name: l.name, balance: l.outstanding, emi: l.monthlyEMI })),
    }
  }

  if (q.includes('retirement') || q.includes('retire') || q.includes('on track')) {
    const health = InsightService.computeHealthScore(
      transactions,
      accounts,
      budgets,
      loans,
      payments,
      rules,
      budgetMonthStart,
      reference
    )

    const simInputs = getDefaultInputs({
      transactions: transactions.filter((t) => !t.isDeleted),
      accounts,
      loans: loans.filter((l) => l.status === 'active'),
      investments: [],
      identity: null,
    })
    simInputs.projectionYears = 25
    simInputs.retirementAge = 60
    const result = SimulationService.runSimulation(simInputs)

    const message =
      health.score >= 70
        ? 'Your financial health is strong — you appear to be on track for retirement. Keep saving and investing consistently.'
        : health.score >= 40
          ? 'You are making progress but could improve your savings rate and reduce debt to get firmly on track.'
          : 'Your financial health needs attention. Focus on building an emergency fund and increasing your savings rate to get on track for retirement.'

    return {
      type: 'retirement_check',
      healthScore: health.score,
      projectedNW: result.finalNetWorth,
      message,
    }
  }

  if (q.length > 0) return { type: 'not_understood', query: q.trim() }
  return { type: 'empty', query: '' }
}

function resultToCard(result: CommandResult): ResultCard | null {
  switch (result.type) {
    case 'biggest_expenses':
      return {
        icon: CreditCard,
        title: 'Top 5 Expenses This Month',
        subtitle: result.transactions
          .map((t) => `${t.description}: ${fmt(t.amount)} (${t.categoryName})`)
          .join('\n'),
        detail: `Total: ${fmt(result.transactions.reduce((s, t) => s + t.amount, 0))}`,
        action: { label: 'View all transactions', path: '/transactions' },
        color: '#D9534F',
      }
    case 'affordability':
      return {
        icon: Wallet,
        title: result.canAfford
          ? `Yes, you can afford a ${fmt(result.amount)} ${result.item}`
          : result.maybe
            ? `Maybe — a ${fmt(result.amount)} ${result.item}`
            : `Not right now — ${fmt(result.amount)} ${result.item}`,
        subtitle: result.reasoning,
        action: { label: 'View budget', path: '/budgets' },
        color: result.canAfford ? '#62C3A7' : result.maybe ? '#D9A441' : '#D9534F',
      }
    case 'net_worth_prediction':
      return {
        icon: TrendingUp,
        title: `Net worth in ${result.years} years: ${fmt(result.finalNetWorth)}`,
        subtitle:
          result.debtFreeYear !== null
            ? `You could be debt-free in ${result.debtFreeYear} year${result.debtFreeYear !== 1 ? 's' : ''}.` +
              (result.fiYear !== null
                ? ` Financially independent in ${result.fiYear} year${result.fiYear !== 1 ? 's' : ''}.`
                : '')
            : 'Based on current income, expenses, and savings projections.',
        action: { label: 'Open simulator', path: '/simulator' },
        color: '#62C3A7',
      }
    case 'monthly_savings':
      return {
        icon: PiggyBank,
        title: `Save ${fmt(result.recommendedAmount)} monthly`,
        subtitle: `Based on the 50/30/20 rule: needs (50%) = ${fmt(result.monthlyIncome * 0.5)}, wants (30%) = ${fmt(result.monthlyIncome * 0.3)}, savings (20%) = ${fmt(result.recommendedAmount)}.`,
        detail: `Monthly income: ${fmt(result.monthlyIncome)}`,
        action: { label: 'Create budget', path: '/budgets' },
        color: '#62C3A7',
      }
    case 'duplicate_subs':
      return {
        icon: AlertCircle,
        title:
          result.rules.length > 0
            ? `Found ${result.rules.length} possible duplicate subscriptions`
            : 'No duplicate subscriptions',
        subtitle:
          result.rules.length > 0
            ? result.rules.map((r) => `${r.title} — ${fmt(r.amount)}/mo`).join('\n')
            : 'All your active recurring expenses appear unique.',
        detail:
          result.rules.length > 0
            ? `Total: ${fmt(result.rules.reduce((s, r) => s + r.amount, 0))}/mo in overlapping subscriptions`
            : undefined,
        action: { label: 'Review recurring', path: '/recurring' },
        color: result.rules.length > 0 ? '#D9A441' : '#62C3A7',
      }
    case 'monthly_spending':
      return {
        icon: BarChart3,
        title: `Spent ${fmt(result.total)} this month`,
        subtitle: result.categoryBreakdown
          .map((c) => `${c.name}: ${fmt(c.amount)} (${c.percent.toFixed(0)}%)`)
          .join('\n'),
        action: { label: 'View analytics', path: '/insights?tab=overview' },
        color: '#0F4D45',
      }
    case 'budget_status':
      return {
        icon: Target,
        title: result.statuses.length > 0 ? 'Budget status' : 'No active budgets',
        subtitle:
          result.statuses.length > 0
            ? result.statuses
                .map(
                  (s) =>
                    `${s.name}: ${s.percentUsed.toFixed(0)}% used${s.severity === 'over' ? ' — OVER BUDGET' : s.severity === 'warning' ? ' — close to limit' : ''}`
                )
                .join('\n')
            : 'Set up budgets to track your spending limits.',
        detail:
          result.statuses.length > 0
            ? `${result.statuses.filter((s) => s.severity === 'over').length} over budget · ${result.statuses.filter((s) => s.severity === 'warning').length} near limit`
            : undefined,
        action: { label: 'Manage budgets', path: '/budgets' },
        color: result.statuses.some((s) => s.severity === 'over') ? '#D9534F' : '#62C3A7',
      }
    case 'closest_goal':
      return {
        icon: Target,
        title: `${result.goal.name} is closest (${result.progress.percentage}%)`,
        subtitle: `Remaining: ${fmt(result.progress.remaining)} of ${fmt(result.goal.targetAmount)} — ${result.progress.probability === 'on_track' ? 'On track' : result.progress.probability === 'at_risk' ? 'At risk' : 'Off track'}`,
        detail: result.goal.deadline
          ? `Deadline: ${new Date(result.goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : undefined,
        action: { label: 'View goal', path: `/goals/${result.goal.id}` },
        color: '#62C3A7',
      }
    case 'total_debt':
      return {
        icon: Landmark,
        title: `Total debt: ${fmt(result.totalOutstanding)}`,
        subtitle: result.loans
          .map((l) => `${l.name}: ${fmt(l.balance)} (${fmt(l.emi)}/mo)`)
          .join('\n'),
        detail: `${result.loans.length} active loan${result.loans.length !== 1 ? 's' : ''}`,
        action: { label: 'Manage loans', path: '/loans' },
        color: '#D9534F',
      }
    case 'retirement_check':
      return {
        icon: TrendingUp,
        title: `Health Score: ${result.healthScore}/100`,
        subtitle: result.message,
        detail: `Projected net worth in 25 years: ${fmt(result.projectedNW)}`,
        action: { label: 'Open simulator', path: '/simulator' },
        color:
          result.healthScore >= 70 ? '#62C3A7' : result.healthScore >= 40 ? '#D9A441' : '#D9534F',
      }
    case 'not_understood':
      return {
        icon: Search,
        title: `I didn't understand "${result.query}"`,
        subtitle:
          'Try asking about expenses, savings, budgets, debt, goals, or your net worth. Tap a suggestion below for ideas.',
        color: '#A4B2AD',
      }
    default:
      return null
  }
}

export function CommandCenter() {
  const navigate = useNavigate()
  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const rules = useRecurringStore((s) => s.rules)
  const loans = useLoansStore((s) => s.loans)
  const payments = useLoansStore((s) => s.payments)
  const budgets = useBudgetsStore((s) => s.budgets)
  const goals = useGoalsStore((s) => s.goals)
  const settings = useSettingsStore((s) => s.settings)

  const loadsRef = useRef({
    tx: useTransactionsStore.getState().load,
    acct: useAccountsStore.getState().load,
    rec: useRecurringStore.getState().load,
    loans: useLoansStore.getState().load,
    budgets: useBudgetsStore.getState().load,
    goals: useGoalsStore.getState().load,
    settings: useSettingsStore.getState().load,
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<CommandResult | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    loadsRef.current.tx()
    loadsRef.current.acct()
    loadsRef.current.rec()
    loadsRef.current.loans()
    loadsRef.current.budgets()
    loadsRef.current.goals()
    loadsRef.current.settings()
    db.categories.toArray().then((all) => setCategories(all.filter((c) => !c.isArchived)))
  }, [])

  const budgetMonthStart = settings?.budgetMonthStart ?? 1

  const handleSearch = () => {
    if (!query.trim()) return
    setHasSearched(true)
    const res = executeCommand(
      query,
      transactions,
      accounts,
      categories,
      rules,
      loans,
      payments,
      budgets,
      goals,
      budgetMonthStart
    )
    setResult(res)
  }

  const handleSuggestion = (q: string) => {
    setQuery(q)
    setHasSearched(true)
    const res = executeCommand(
      q,
      transactions,
      accounts,
      categories,
      rules,
      loans,
      payments,
      budgets,
      goals,
      budgetMonthStart
    )
    setResult(res)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const card = result ? resultToCard(result) : null

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 text-text-primary">Command Center</h1>
        <p className="text-body-sm text-text-tertiary">
          Ask anything about your money — all computed locally, no external AI.
        </p>
      </div>

      <div className="relative">
        <div className="flex items-center gap-0 rounded-2xl border-2 border-brand-teal900/20 bg-surface focus-within:border-brand-teal400 transition-colors">
          <Search className="ml-16 size-20 shrink-0 text-text-tertiary" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your money..."
            className="flex-1 bg-transparent px-12 py-16 text-body outline-none placeholder:text-text-tertiary text-text-primary"
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim()}
            className="mr-8 flex items-center gap-6 rounded-xl bg-brand-teal900 px-16 py-10 text-body-sm font-semibold text-white disabled:opacity-40 hover:bg-brand-teal900/90 transition-colors"
          >
            <Zap className="size-16" aria-hidden="true" />
            Ask
          </button>
        </div>
      </div>

      {!hasSearched && (
        <div className="flex flex-col gap-8">
          <p className="text-caption text-text-tertiary uppercase tracking-wider">Suggestions</p>
          <div className="flex flex-wrap gap-8">
            {SUGGESTIONS.slice(0, 6).map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-border/60 bg-surface px-14 py-8 text-caption text-text-secondary hover:border-brand-teal400/40 hover:text-brand-teal400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {card && (
        <section
          className="card flex flex-col gap-12 p-16"
          style={{ borderLeftColor: card.color, borderLeftWidth: 4 }}
        >
          <div className="flex items-start gap-12">
            <div
              className="flex size-40 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${card.color}15` }}
            >
              <card.icon className="size-20" style={{ color: card.color }} aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-6 min-w-0">
              <h3 className="text-body font-semibold text-text-primary">{card.title}</h3>
              <p className="text-body-sm text-text-secondary whitespace-pre-line leading-relaxed">
                {card.subtitle}
              </p>
              {card.detail && <p className="text-caption text-text-tertiary mt-2">{card.detail}</p>}
            </div>
          </div>
          {card.action && (
            <button
              onClick={() => navigate(card.action!.path)}
              className="self-start rounded-xl bg-brand-teal900 px-14 py-8 text-caption font-semibold text-white hover:bg-brand-teal900/90 transition-colors"
            >
              {card.action.label}
            </button>
          )}
        </section>
      )}

      {hasSearched && !card && (
        <div className="card flex flex-col items-center gap-12 p-24 text-center">
          <Calculator className="size-32 text-text-tertiary" aria-hidden="true" />
          <p className="text-body text-text-secondary">
            {transactions.length === 0
              ? 'Add some transactions first to get answers about your money.'
              : 'Try asking a different question or use one of the suggestions below.'}
          </p>
        </div>
      )}

      {hasSearched && (
        <div className="flex flex-col gap-8">
          <p className="text-caption text-text-tertiary uppercase tracking-wider">More to try</p>
          <div className="flex flex-wrap gap-8">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className={cn(
                  'rounded-full border border-border/60 bg-surface px-14 py-8 text-caption transition-colors',
                  s === query
                    ? 'border-brand-teal400 text-brand-teal400 bg-brand-teal400/10'
                    : 'text-text-secondary hover:border-brand-teal400/40 hover:text-brand-teal400'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-8 text-caption text-text-tertiary mt-16">
        <Zap className="size-16" aria-hidden="true" />
        <span>All answers computed from your local data — nothing leaves your device</span>
      </div>
    </div>
  )
}
