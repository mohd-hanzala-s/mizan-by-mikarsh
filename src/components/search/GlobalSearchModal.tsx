import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useGoalsStore } from '@/features/goals/goalsStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { db } from '@/database/db'
import { Receipt, Wallet, Target, PiggyBank, Search, X, ArrowRight } from 'lucide-react'
import type { Category } from '@/types/entities'

interface SearchResult {
  id: string
  type: 'transaction' | 'account' | 'category' | 'goal' | 'budget'
  title: string
  subtitle: string
  url: string
  icon: typeof Receipt
}

const TYPE_CONFIG: Record<SearchResult['type'], { group: string; icon: typeof Receipt }> = {
  transaction: { group: 'Transactions', icon: Receipt },
  account: { group: 'Accounts', icon: Wallet },
  category: { group: 'Categories', icon: PiggyBank },
  goal: { group: 'Goals', icon: Target },
  budget: { group: 'Budgets', icon: PiggyBank },
}

type ResultTypeFilter = 'all' | SearchResult['type']

const TYPE_FILTER_OPTIONS: { value: ResultTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'transaction', label: 'Transactions' },
  { value: 'account', label: 'Accounts' },
  { value: 'category', label: 'Categories' },
  { value: 'goal', label: 'Goals' },
  { value: 'budget', label: 'Budgets' },
]

interface GlobalSearchModalProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [typeFilter, setTypeFilter] = useState<ResultTypeFilter>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const goals = useGoalsStore((s) => s.goals)
  const budgets = useBudgetsStore((s) => s.budgets)

  const debouncedQuery = useDebounce(query.toLowerCase().trim(), 150)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      db.categories.toArray().then((all) => setCategories(all.filter((c) => !c.isArchived)))
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(-1)
  }, [debouncedQuery])

  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery || debouncedQuery.length < 2) return []

    const all: SearchResult[] = []

    for (const t of transactions.filter((t) => !t.isDeleted).slice(-200)) {
      if (
        t.description.toLowerCase().includes(debouncedQuery) ||
        t.notes?.toLowerCase().includes(debouncedQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(debouncedQuery))
      ) {
        const cat = categories.find((c) => c.id === t.categoryId)
        all.push({
          id: t.id,
          type: 'transaction',
          title: t.description,
          subtitle: `${t.type === 'income' ? '+' : '-'}₹${Math.round(t.amount).toLocaleString('en-IN')}${cat ? ` · ${cat.name}` : ''}`,
          url: '/transactions',
          icon: Receipt,
        })
      }
      if (all.length >= 15) break
    }

    for (const a of accounts.filter((a) => !a.isArchived)) {
      if (a.name.toLowerCase().includes(debouncedQuery)) {
        all.push({
          id: a.id,
          type: 'account',
          title: a.name,
          subtitle: `₹${Math.round(a.currentBalance).toLocaleString('en-IN')}`,
          url: `/accounts/${a.id}`,
          icon: Wallet,
        })
      }
      if (all.length >= 20) break
    }

    for (const c of categories) {
      if (c.name.toLowerCase().includes(debouncedQuery)) {
        all.push({
          id: c.id,
          type: 'category',
          title: c.name,
          subtitle: c.icon ?? '',
          url: '/transactions',
          icon: PiggyBank,
        })
      }
    }

    for (const g of goals.filter((g) => g.status !== 'cancelled')) {
      if (g.name.toLowerCase().includes(debouncedQuery)) {
        all.push({
          id: g.id,
          type: 'goal',
          title: g.name,
          subtitle: `${Math.round((g.currentAmount / g.targetAmount) * 100)}% of ₹${Math.round(g.targetAmount).toLocaleString('en-IN')}`,
          url: `/goals/${g.id}`,
          icon: Target,
        })
      }
      if (all.length >= 25) break
    }

    for (const b of budgets.filter((b) => b.active)) {
      const bCat = categories.find((c) => c.id === b.categoryId)
      const bName = bCat?.name ?? 'Overall'
      if (bName.toLowerCase().includes(debouncedQuery)) {
        all.push({
          id: b.id,
          type: 'budget',
          title: bName,
          subtitle: `₹${Math.round(b.monthlyLimit).toLocaleString('en-IN')}`,
          url: '/budgets',
          icon: PiggyBank,
        })
      }
    }

    return all
  }, [debouncedQuery, transactions, accounts, categories, goals, budgets])

  const countsByType = useMemo(() => {
    const counts: Record<SearchResult['type'], number> = {
      transaction: 0,
      account: 0,
      category: 0,
      goal: 0,
      budget: 0,
    }
    for (const r of results) counts[r.type]++
    return counts
  }, [results])

  const filteredResults = useMemo(
    () => (typeFilter === 'all' ? results : results.filter((r) => r.type === typeFilter)),
    [results, typeFilter]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>()
    for (const r of filteredResults) {
      const g = TYPE_CONFIG[r.type].group
      map.set(g, [...(map.get(g) ?? []), r])
    }
    return [...map.entries()]
  }, [filteredResults])

  const flatResults = grouped.flatMap(([, items]) => items)

  function handleSelect(url: string) {
    navigate(url)
    onClose()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((p) => Math.min(p + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((p) => Math.max(p - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(flatResults[activeIndex].url)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    if (flatResults.length > 0 && activeIndex >= 0) {
      const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, flatResults.length])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative mx-auto mt-[10vh] max-h-[70vh] w-full max-w-lg overflow-hidden rounded-md border border-border bg-surface-card shadow-elevated">
        <div className="flex items-center gap-12 border-b border-border px-16 py-12">
          <Search className="size-20 text-text-tertiary shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search transactions, accounts, goals..."
            aria-label="Global search"
            className="flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="flex size-32 items-center justify-center rounded-full text-text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="size-20" aria-hidden="true" />
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="flex gap-6 overflow-x-auto border-b border-border px-16 py-8">
            {TYPE_FILTER_OPTIONS.filter(
              (opt) => opt.value === 'all' || countsByType[opt.value] > 0
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={typeFilter === opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`shrink-0 rounded-full border px-12 py-4 text-caption font-medium transition-colors ${
                  typeFilter === opt.value
                    ? 'border-brand-teal900 bg-brand-teal900/10 text-brand-teal900'
                    : 'border-border text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {opt.label}
                {opt.value !== 'all' && ` (${countsByType[opt.value]})`}
              </button>
            ))}
          </div>
        )}

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto" role="listbox">
          {!debouncedQuery || debouncedQuery.length < 2 ? (
            <div className="flex flex-col items-center gap-8 px-16 py-48 text-text-tertiary">
              <Search className="size-48 opacity-30" aria-hidden="true" />
              <p className="text-body-sm">
                Type at least 2 characters to search across transactions, accounts, goals, and
                budgets.
              </p>
            </div>
          ) : flatResults.length === 0 ? (
            <p className="px-16 py-32 text-center text-body-sm text-text-tertiary">
              No results found.
            </p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group}>
                <div className="px-16 py-8 text-caption font-medium text-text-tertiary">
                  {group}
                </div>
                {items.map((item) => {
                  const isActive = flatResults.indexOf(item) === activeIndex
                  const Icon = item.icon
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleSelect(item.url)}
                      onMouseEnter={() => setActiveIndex(flatResults.indexOf(item))}
                      className={`flex w-full items-center gap-12 px-16 py-12 text-left transition-colors ${
                        isActive
                          ? 'bg-neutral-100 dark:bg-neutral-800'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Icon className="size-20 shrink-0 text-text-secondary" aria-hidden="true" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-body-sm font-medium text-text-primary">
                          {item.title}
                        </span>
                        <span className="truncate text-caption text-text-tertiary">
                          {item.subtitle}
                        </span>
                      </span>
                      <ArrowRight
                        className="size-16 shrink-0 text-text-tertiary"
                        aria-hidden="true"
                      />
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
