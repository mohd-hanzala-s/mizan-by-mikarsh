import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, addMonths, format, startOfMonth, startOfWeek, type Day } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Cloud,
  CloudRain,
  LayoutGrid,
  LayoutList,
  Columns2,
  Clock,
} from 'lucide-react'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useRecurringStore } from '@/features/recurring/recurringStore'
import { useLoansStore } from '@/features/loans/loansStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useSettingsStore } from '@/app/settingsStore'
import { VaultRepository } from '@/repositories/VaultRepository'
import {
  CalendarService,
  type CalendarEvent,
  type CalendarEventKind,
} from '@/services/CalendarService'
import { CalendarView } from './CalendarView'
import { WeekStrip } from './WeekStrip'
import { CalendarEventRow } from './CalendarEventRow'
import { AgendaView } from './AgendaView'
import { CashFlowStrip } from './CashFlowStrip'
import { SpendingHeatmap } from '@/components/charts/SpendingHeatmap'
import { SearchBar } from '@/components/forms/SearchBar'
import { Button } from '@/components/ui/button'
import { SkeletonPage } from '@/components/common/Skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/utils/cn'
import type { VaultDocument } from '@/types/entities'

type ViewMode = 'month' | 'week' | 'agenda' | 'timeline'

type FinancialWeather = 'sunny' | 'cloudy' | 'rainy'

const VIEW_ICONS: Record<ViewMode, typeof LayoutGrid> = {
  month: LayoutGrid,
  week: Columns2,
  agenda: LayoutList,
  timeline: Clock,
}

function getWeather(netTotal: number): {
  weather: FinancialWeather
  icon: typeof CloudSun
  label: string
} {
  if (netTotal >= 0) return { weather: 'sunny', icon: CloudSun, label: 'Positive cash flow' }
  if (netTotal >= -1000)
    return { weather: 'cloudy', icon: Cloud, label: 'Slightly negative cash flow' }
  return { weather: 'rainy', icon: CloudRain, label: 'Significant cash outflow' }
}

const KIND_FILTERS: { label: string; kinds: CalendarEventKind[] }[] = [
  { label: 'All', kinds: [] },
  { label: 'Bills', kinds: ['recurring', 'credit_card_due'] },
  { label: 'Income', kinds: ['recurring', 'transaction'] },
  { label: 'EMI', kinds: ['loan'] },
  { label: 'Goals', kinds: ['goal_milestone'] },
  { label: 'Documents', kinds: ['document_expiry', 'tax_reminder'] },
]

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function groupByDay(
  events: CalendarEvent[]
): { key: string; date: Date; events: CalendarEvent[] }[] {
  const map = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const key = dayKey(e.date)
    const list = map.get(key) ?? []
    list.push(e)
    map.set(key, list)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, list]) => ({ key, date: list[0].date, events: list }))
}

export function CalendarPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const txLoading = useTransactionsStore((s) => s.isLoading)
  const loadTransactionsRef = useRef(useTransactionsStore.getState().load)
  const rules = useRecurringStore((s) => s.rules)
  const recLoading = useRecurringStore((s) => s.isLoading)
  const loadRecurringRef = useRef(useRecurringStore.getState().load)
  const loans = useLoansStore((s) => s.loans)
  const payments = useLoansStore((s) => s.payments)
  const loanLoading = useLoansStore((s) => s.isLoading)
  const loadLoansRef = useRef(useLoansStore.getState().load)
  const goals = useGoalsStore((s) => s.goals)
  const goalsLoading = useGoalsStore((s) => s.isLoading)
  const loadGoalsRef = useRef(useGoalsStore.getState().load)
  const accounts = useAccountsStore((s) => s.accounts)
  const accountsLoading = useAccountsStore((s) => s.isLoading)
  const loadAccountsRef = useRef(useAccountsStore.getState().load)
  const settings = useSettingsStore((s) => s.settings)
  const settingsLoading = useSettingsStore((s) => s.isLoading)
  const loadSettingsRef = useRef(useSettingsStore.getState().load)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [vaultDocuments, setVaultDocuments] = useState<VaultDocument[]>([])
  const [vaultLoading, setVaultLoading] = useState(true)

  const [view, setView] = useState<ViewMode>('month')
  const [anchor, setAnchor] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())
  const [query, setQuery] = useState('')
  const [kinds, setKinds] = useState<CalendarEventKind[]>([])

  useEffect(() => {
    setLoadError(null)
    Promise.all([
      loadTransactionsRef.current(),
      loadRecurringRef.current(),
      loadLoansRef.current(),
      loadGoalsRef.current(),
      loadAccountsRef.current(),
      loadSettingsRef.current(),
      (async () => {
        try {
          const docs = await VaultRepository.getAll()
          setVaultDocuments(docs)
        } finally {
          setVaultLoading(false)
        }
      })(),
    ]).catch(() =>
      setLoadError('Failed to load calendar data. Please try again.')
    )
  }, [])

  const isLoading =
    txLoading || recLoading || loanLoading || goalsLoading || accountsLoading || settingsLoading || vaultLoading

  const firstDayOfWeek = (settings?.firstDayOfWeek ?? 0) as Day

  const creditCardAccountIds = useMemo(
    () => accounts.filter((a) => a.type === 'creditCard').map((a) => a.id),
    [accounts]
  )

  const monthEvents = useMemo(
    () =>
      CalendarService.getFinancialMonthEvents(
        anchor.getFullYear(),
        anchor.getMonth(),
        transactions,
        rules,
        loans,
        payments,
        goals,
        vaultDocuments,
        creditCardAccountIds
      ),
    [anchor, transactions, rules, loans, payments, goals, vaultDocuments, creditCardAccountIds]
  )

  const weekStart = useMemo(
    () => startOfWeek(anchor, { weekStartsOn: firstDayOfWeek }),
    [anchor, firstDayOfWeek]
  )

  const weekEvents = useMemo(() => {
    const weekEnd = addDays(weekStart, 6)
    if (weekStart.getMonth() !== anchor.getMonth()) {
      const prev = CalendarService.getFinancialMonthEvents(
        weekStart.getFullYear(),
        weekStart.getMonth(),
        transactions,
        rules,
        loans,
        payments,
        goals,
        vaultDocuments,
        creditCardAccountIds
      )
      return CalendarService.getWeekEvents([...prev, ...monthEvents], weekStart)
    }
    if (weekEnd.getMonth() !== anchor.getMonth()) {
      const next = CalendarService.getFinancialMonthEvents(
        weekEnd.getFullYear(),
        weekEnd.getMonth(),
        transactions,
        rules,
        loans,
        payments,
        goals,
        vaultDocuments,
        creditCardAccountIds
      )
      return CalendarService.getWeekEvents([...monthEvents, ...next], weekStart)
    }
    return CalendarService.getWeekEvents(monthEvents, weekStart)
  }, [weekStart, anchor, monthEvents, transactions, rules, loans, payments, goals, vaultDocuments, creditCardAccountIds])

  const visibleEvents = view === 'week' ? weekEvents : monthEvents
  const filtered = useMemo(
    () => CalendarService.filterEvents(visibleEvents, query, kinds),
    [visibleEvents, query, kinds]
  )

  const dayEvents = useMemo(
    () => CalendarService.getDayEvents(filtered, selectedDate ?? new Date()),
    [filtered, selectedDate]
  )

  const cashFlow = useMemo(() => {
    let income = 0
    let expense = 0
    for (const e of filtered) {
      if (e.amount > 0) income += e.amount
      else expense += -e.amount
    }
    return { income, expense, net: income - expense }
  }, [filtered])

  const dayCashFlow = useMemo(() => {
    let income = 0
    let expense = 0
    for (const e of dayEvents) {
      if (e.amount > 0) income += e.amount
      else expense += -e.amount
    }
    return { income, expense, net: income - expense }
  }, [dayEvents])

  const weatherInfo = useMemo(() => getWeather(cashFlow.net), [cashFlow.net])

  function goPrev() {
    setAnchor((d) =>
      view === 'month' ? addMonths(d, -1) : view === 'week' ? addDays(d, -7) : addDays(d, -1)
    )
  }

  function goNext() {
    setAnchor((d) =>
      view === 'month' ? addMonths(d, 1) : view === 'week' ? addDays(d, 7) : addDays(d, 1)
    )
  }

  function goToday() {
    const now = new Date()
    setAnchor(now)
    setSelectedDate(now)
  }

  function selectDay(date: Date) {
    setSelectedDate(date)
    if (view === 'timeline') setAnchor(date)
  }

  const title =
    view === 'month'
      ? format(anchor, 'MMMM yyyy')
      : view === 'week'
        ? `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM yyyy')}`
        : view === 'agenda'
          ? format(startOfMonth(anchor), 'MMMM yyyy')
          : format(anchor, 'EEEE, d MMM yyyy')

  const timelineGroups = groupByDay(filtered)

  function isKindsActive(f: (typeof KIND_FILTERS)[number]): boolean {
    if (f.kinds.length === 0) return kinds.length === 0
    if (kinds.length === 0) return false
    return f.kinds.every((k) => kinds.includes(k)) && kinds.every((k) => f.kinds.includes(k))
  }

  if (loadError) {
    return (
      <div className="p-16 md:p-24">
        <ErrorState
          title="Could not load calendar"
          message={loadError}
          onRetry={() => {
            setLoadError(null)
            Promise.all([
              loadTransactionsRef.current(),
              loadRecurringRef.current(),
              loadLoansRef.current(),
              loadGoalsRef.current(),
              loadAccountsRef.current(),
              loadSettingsRef.current(),
              (async () => {
                try {
                  const docs = await VaultRepository.getAll()
                  setVaultDocuments(docs)
                } catch (_e) { void _e }
              })(),
            ]).catch(() =>
              setLoadError('Failed to load calendar data. Please try again.')
            )
          }}
        />
      </div>
    )
  }

  if (isLoading) {
    return <SkeletonPage />
  }

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-text-primary">Financial Calendar</h1>
        <div
          role="radiogroup"
          aria-label="Calendar view"
          className="inline-flex self-start rounded-md bg-neutral-100 p-4 dark:bg-neutral-800"
        >
          {(['month', 'week', 'agenda', 'timeline'] as ViewMode[]).map((v) => {
            const Icon = VIEW_ICONS[v]
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={cn(
                  'flex min-h-touch items-center gap-6 rounded-sm px-12 py-6 text-body-sm font-medium capitalize transition-colors duration-fast',
                  view === v
                    ? 'bg-surface-card text-text-primary shadow-card'
                    : 'text-text-secondary'
                )}
              >
                <Icon className="size-14" aria-hidden="true" />
                {v}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <Button variant="tertiary" size="sm" onClick={goPrev} aria-label="Previous period">
          <ChevronLeft className="size-16" aria-hidden="true" />
        </Button>
        <p className="min-w-0 flex-1 truncate text-center text-h3 text-text-primary">{title}</p>
        <Button variant="tertiary" size="sm" onClick={goNext} aria-label="Next period">
          <ChevronRight className="size-16" aria-hidden="true" />
        </Button>
        <Button variant="secondary" size="sm" onClick={goToday}>
          Today
        </Button>
      </div>

      {view !== 'agenda' && view !== 'timeline' && (
        <>
          <div className="flex items-center gap-8">
            <div className="flex min-w-0 flex-1 items-center gap-8">
              <weatherInfo.icon
                className={cn(
                  'size-20 shrink-0',
                  weatherInfo.weather === 'sunny' && 'text-income',
                  weatherInfo.weather === 'cloudy' && 'text-warning',
                  weatherInfo.weather === 'rainy' && 'text-expense'
                )}
                aria-hidden="true"
              />
              <span className="text-body-sm text-text-secondary capitalize">{weatherInfo.label}</span>
            </div>
            <span className="text-body-lg font-semibold text-income tabular-nums">
              +{cashFlow.income.toLocaleString('en-IN')}
            </span>
            <span className="text-body-lg font-semibold text-expense tabular-nums">
              -{cashFlow.expense.toLocaleString('en-IN')}
            </span>
          </div>

          <CashFlowStrip income={cashFlow.income} expense={cashFlow.expense} />

          <SpendingHeatmap transactions={transactions} year={anchor.getFullYear()} />
        </>
      )}

      {view !== 'timeline' && (
        <>
          <SearchBar value={query} onChange={setQuery} placeholder="Search the calendar" />

          <div className="flex flex-wrap gap-8">
            {KIND_FILTERS.map((f) => {
              const active = isKindsActive(f)
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setKinds(f.kinds)}
                  className={cn(
                    'min-h-touch rounded-full border px-16 text-body-sm font-medium transition-colors duration-fast',
                    active
                      ? 'border-income bg-income-subtle text-income'
                      : 'border-border bg-surface-card text-text-secondary'
                  )}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </>
      )}

      {view === 'month' && (
        <CalendarView
          year={anchor.getFullYear()}
          monthIndex={anchor.getMonth()}
          firstDayOfWeek={firstDayOfWeek}
          events={filtered}
          selectedDate={selectedDate}
          onSelectDay={selectDay}
        />
      )}
      {view === 'week' && (
        <WeekStrip
          weekStart={weekStart}
          events={filtered}
          selectedDate={selectedDate}
          onSelectDay={selectDay}
        />
      )}

      {view === 'agenda' && <AgendaView events={filtered} onSelectDay={selectDay} />}

      {view === 'timeline' && (
        <div className="flex flex-col gap-12">
          <h2 className="text-overline text-text-tertiary">
            All events · {format(anchor, 'MMMM yyyy')}
          </h2>
          {timelineGroups.length === 0 ? (
            <EmptyState
              title="No events this month"
              description="Try changing the month or clearing your filters to see more."
            />
          ) : (
            <div className="flex flex-col gap-12">
              {timelineGroups.map((group) => (
                <div key={group.key} className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => selectDay(group.date)}
                    className="px-4 text-left text-body-sm font-medium text-text-secondary hover:text-text-primary"
                  >
                    {format(group.date, 'EEEE, d MMM yyyy')}
                  </button>
                  <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-md border border-border bg-surface-card">
                    {group.events.map((e) => (
                      <CalendarEventRow key={e.id} event={e} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'month' && selectedDate && (
        <section className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-overline text-text-tertiary">
              {format(selectedDate, 'EEEE, d MMMM')}
            </h2>
            {(dayCashFlow.income > 0 || dayCashFlow.expense > 0) && (
              <div className="flex items-center gap-8 text-caption tabular-nums">
                {dayCashFlow.income > 0 && (
                  <span className="text-income">+₹{dayCashFlow.income.toLocaleString('en-IN')}</span>
                )}
                {dayCashFlow.expense > 0 && (
                  <span className="text-expense">−₹{dayCashFlow.expense.toLocaleString('en-IN')}</span>
                )}
                <span
                  className={cn(
                    'font-medium',
                    dayCashFlow.net >= 0 ? 'text-income' : 'text-expense'
                  )}
                >
                  {dayCashFlow.net >= 0 ? '+' : '−'}₹{Math.abs(dayCashFlow.net).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
          {dayEvents.length === 0 ? (
            <EmptyState
              title="No events for this day"
              description="Try selecting a different date or changing the filters."
            />
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-md border border-border bg-surface-card">
              {dayEvents.map((e) => (
                <CalendarEventRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>
      )}

      {view === 'week' && (
        <section className="flex flex-col gap-12">
          <h2 className="text-overline text-text-tertiary">This Week</h2>
          {timelineGroups.length === 0 ? (
            <EmptyState
              title="No events in this period"
              description="Try changing the date range or removing the filter to see more activities."
            />
          ) : (
            <div className="flex flex-col gap-12">
              {timelineGroups.map((group) => (
                <div key={group.key} className="flex flex-col gap-4">
                  <h3 className="px-4 text-body-sm font-medium text-text-secondary">
                    {format(group.date, 'EEEE, d MMM yyyy')}
                  </h3>
                  <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-md border border-border bg-surface-card">
                    {group.events.map((e) => (
                      <CalendarEventRow key={e.id} event={e} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
