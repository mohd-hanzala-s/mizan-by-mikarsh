import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, Info, Zap, ArrowRight, X } from 'lucide-react'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { db } from '@/database/db'
import { AutomationService, type AutoDetection } from '@/services/AutomationService'
import { cn } from '@/utils/cn'
import type { Category } from '@/types/entities'

const SEVERITY_ICON: Record<AutoDetection['severity'], typeof Bell> = {
  info: Info,
  warning: AlertTriangle,
  alert: AlertTriangle,
}

const SEVERITY_STYLE: Record<AutoDetection['severity'], string> = {
  info: 'border-brand-teal400 bg-brand-teal400/5',
  warning: 'border-gold-500 bg-gold-500/5',
  alert: 'border-expense bg-expense-subtle',
}

const SEVERITY_ICON_COLOR: Record<AutoDetection['severity'], string> = {
  info: 'text-brand-teal400',
  warning: 'text-gold-500',
  alert: 'text-expense',
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function AutomationAlerts({ limit }: { limit?: number }) {
  const navigate = useNavigate()
  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const rules = useRecurringStore((s) => s.rules)
  const loans = useLoansStore((s) => s.loans)
  const payments = useLoansStore((s) => s.payments)

  const [categories, setCategories] = useState<Category[]>([])
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('mizan-dismissed-automation')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return
    const reference = startOfDay(new Date())
    const hasData =
      transactions.length > 0 &&
      transactions.some(
        (t) =>
          !t.isDeleted &&
          new Date(t.transactionDate).getTime() > reference.getTime() - 30 * 24 * 60 * 60 * 1000
      )
    if (!hasData) return
    setLoaded(true)
    db.categories.toArray().then((all) => setCategories(all.filter((c) => !c.isArchived)))
  }, [transactions, loaded])

  useEffect(() => {
    useRecurringStore.getState().load()
    useLoansStore.getState().load()
  }, [])

  const detections = useMemo(() => {
    if (transactions.length === 0 || categories.length === 0) return []
    return AutomationService.detectAll({
      transactions,
      accounts,
      rules,
      loans,
      payments,
      categories,
    })
  }, [transactions, accounts, rules, loans, payments, categories])

  const visibleDetections = useMemo(() => {
    let filtered = detections.filter((d) => !dismissedKeys.has(d.type + d.title + d.description))
    if (limit !== undefined) filtered = filtered.slice(0, limit)
    return filtered
  }, [detections, dismissedKeys, limit])

  const dismiss = (d: AutoDetection) => {
    setDismissedKeys((prev) => {
      const next = new Set(prev).add(d.type + d.title + d.description)
      try {
        localStorage.setItem('mizan-dismissed-automation', JSON.stringify([...next]))
      } catch {
        // ignore
      }
      return next
    })
  }

  if (visibleDetections.length === 0) return null

  return (
    <section className="card flex flex-col gap-10 p-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Zap className="size-18 text-brand-teal400" aria-hidden="true" />
          <h2 className="text-overline text-brand-teal400">Smart Alerts</h2>
          {visibleDetections.length > 0 && (
            <span className="rounded-full bg-brand-teal400/15 px-8 py-2 text-caption font-medium text-brand-teal400">
              {visibleDetections.length}
            </span>
          )}
        </div>
        {limit !== undefined && detections.length > limit && (
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center gap-4 text-caption text-brand-teal400 hover:text-brand-teal400/80 transition-colors"
          >
            View all
            <ArrowRight className="size-14" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {visibleDetections.map((d) => {
          const Icon = SEVERITY_ICON[d.severity]
          return (
            <div
              key={d.type + d.title + d.description}
              className={cn(
                'flex items-start gap-10 rounded-xl border p-12 transition-colors',
                SEVERITY_STYLE[d.severity]
              )}
            >
              <Icon
                className={cn('mt-2 size-16 shrink-0', SEVERITY_ICON_COLOR[d.severity])}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold text-text-primary">{d.title}</p>
                <p className="text-caption text-text-secondary mt-2 leading-relaxed">
                  {d.description}
                </p>
                {d.action && (
                  <button
                    onClick={() => navigate(d.action!.path)}
                    className="mt-6 text-caption font-medium text-brand-teal400 hover:text-brand-teal400/80 transition-colors"
                  >
                    {d.action.label} &rarr;
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(d)}
                className="shrink-0 rounded-lg p-4 text-text-tertiary hover:bg-surface hover:text-text-secondary transition-colors"
                aria-label="Dismiss"
              >
                <X className="size-14" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function AutomationAlertsPage() {
  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 text-text-primary">Smart Automation</h1>
        <p className="text-body-sm text-text-tertiary">
          Auto-detected insights from your financial data — duplicates, unusual patterns, upcoming
          bills, and savings opportunities.
        </p>
      </div>
      <AutomationAlerts />
    </div>
  )
}
