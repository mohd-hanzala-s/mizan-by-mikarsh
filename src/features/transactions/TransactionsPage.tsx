import { useEffect, useMemo, useState } from 'react'
import { Upload, Bookmark, BookmarkCheck, X, Receipt } from 'lucide-react'
import { useTransactionsStore } from './transactionsStore'
import { TransactionCard } from './TransactionCard'
import { SearchBar } from '@/components/forms/SearchBar'
import { FilterBar, type TypeFilter } from '@/components/forms/FilterBar'
import { DateRangeFilter, type DateRange } from '@/components/forms/DateRangeFilter'
import { SortControl, type SortState } from '@/components/forms/SortControl'
import { CSVImportModal } from '@/components/forms/CSVImportModal'
import { EmptyState } from '@/components/common/EmptyState'
import { SkeletonPage } from '@/components/common/Skeleton'
import { Button } from '@/components/ui/button'
import { db } from '@/database/db'
import { TransactionService } from '@/services/TransactionService'
import { isTransferCreditLeg } from '@/utils/transactions'
import { startOfStoredDate } from '@/utils/dates'
import { useSavedFilters } from './savedFilters'
import { EmptyTransactionsIllustration } from '@/components/common/Illustrations'
import type { Account, Category, Transaction } from '@/types/entities'

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const key = startOfStoredDate(t.transactionDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    groups.set(key, [...(groups.get(key) ?? []), t])
  }
  return [...groups.entries()]
}

function matchesSearch(
  t: Transaction,
  query: string,
  category: Category | undefined,
  account: Account | undefined
): boolean {
  if (!query) return true
  const haystack = [
    t.description,
    t.notes,
    String(t.amount),
    category?.name,
    account?.name,
    ...t.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export function TransactionsPage() {
  const transactions = useTransactionsStore((s) => s.transactions)
  const isLoading = useTransactionsStore((s) => s.isLoading)
  const load = useTransactionsStore((s) => s.load)
  const openAddSheet = useTransactionsStore((s) => s.openAddSheet)
  const openEditSheet = useTransactionsStore((s) => s.openEditSheet)
  const deleteTransaction = useTransactionsStore((s) => s.deleteTransaction)
  const duplicateTransaction = useTransactionsStore((s) => s.duplicateTransaction)

  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null, preset: null })
  const [sort, setSort] = useState<SortState>({ field: 'date', direction: 'desc' })
  const [showImport, setShowImport] = useState(false)

  const {
    savedFilters,
    showSaveDialog,
    setShowSaveDialog,
    newName,
    setNewName,
    handleSave,
    handleDelete,
    handleApply,
  } = useSavedFilters(
    { query, typeFilter, categoryIds: [...selectedCategoryIds], dateRange, sort },
    (filter) => {
      setQuery(filter.query)
      setTypeFilter(filter.typeFilter)
      setSelectedCategoryIds(new Set(filter.categoryIds))
      setDateRange(filter.dateRange)
      setSort(filter.sort)
    }
  )

  useEffect(() => {
    load()
    db.categories.toArray().then(setCategories)
    db.accounts.toArray().then(setAccounts)
  }, [load])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const filterableCategories = useMemo(
    () => categories.filter((c) => c.id !== 'cat-transfers'),
    [categories]
  )
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const t of transactions) {
      for (const tag of t.tags) set.add(tag)
    }
    return [...set].sort()
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => !isTransferCreditLeg(t))
      .filter((t) => (typeFilter === 'all' ? true : t.type === typeFilter))
      .filter((t) =>
        selectedCategoryIds.size === 0 ? true : selectedCategoryIds.has(t.categoryId)
      )
      .filter((t) =>
        selectedTags.size === 0 ? true : t.tags.some((tag) => selectedTags.has(tag))
      )
      .filter((t) =>
        matchesSearch(t, query, categoryById.get(t.categoryId), accountById.get(t.accountId))
      )
      .filter((t) => {
        if (!dateRange.start && !dateRange.end) return true
        const txDate = t.transactionDate
        if (dateRange.start && txDate < dateRange.start) return false
        if (dateRange.end && txDate > dateRange.end) return false
        return true
      })
      .sort((a, b) => {
        if (sort.field === 'amount') {
          return sort.direction === 'desc' ? b.amount - a.amount : a.amount - b.amount
        }
        return sort.direction === 'desc'
          ? b.transactionDate.localeCompare(a.transactionDate)
          : a.transactionDate.localeCompare(b.transactionDate)
      })
  }, [
    transactions,
    typeFilter,
    selectedCategoryIds,
    selectedTags,
    query,
    dateRange,
    sort,
    categoryById,
    accountById,
  ])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  async function handleImport(
    rows: Array<{
      date: string
      type: 'income' | 'expense' | 'transfer'
      amount: number
      description: string
      categoryId?: string
      accountId?: string
      tags?: string[]
      notes?: string
    }>
  ) {
    const result = await TransactionService.bulkImport(rows)
    await load()
    return result
  }

  if (isLoading) return <SkeletonPage />

  if (transactions.length === 0) {
    return (
      <>
        <EmptyState
          illustration={<EmptyTransactionsIllustration size={140} />}
          title="No transactions yet"
          description='Tap the + button and try something like "250 tea" to log your first one.'
          actionLabel="Add a transaction"
          onAction={openAddSheet}
          secondaryLabel="Import from CSV"
          onSecondaryAction={() => setShowImport(true)}
        />
        <CSVImportModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex items-center gap-8">
        <div className="flex-1">
          <SearchBar value={query} onChange={setQuery} />
        </div>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => setShowImport(true)}
          aria-label="Import CSV"
        >
          <Upload className="size-16" aria-hidden="true" />
        </Button>
      </div>
      <FilterBar
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        categories={filterableCategories}
        selectedCategoryIds={selectedCategoryIds}
        onToggleCategory={toggleCategory}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
      />
      <DateRangeFilter value={dateRange} onChange={setDateRange} />
      <SortControl value={sort} onChange={setSort} />

      <div className="flex items-center gap-8">
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          aria-label="Save current filters"
        >
          <Bookmark className="size-14" aria-hidden="true" />
          Save filters
        </Button>
        {savedFilters.slice(0, 5).map((sf) => (
          <button
            key={sf.id}
            type="button"
            onClick={() => handleApply(sf)}
              className="flex min-h-touch items-center gap-4 rounded-full border border-border bg-surface-card px-12 text-body-sm text-info hover:bg-neutral-50 dark:hover:bg-neutral-900"
          >
            <BookmarkCheck className="size-12 text-info" aria-hidden="true" />
            {sf.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(sf.id)
              }}
              className="ml-4 flex size-20 items-center justify-center rounded-full text-text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label={`Delete saved filter ${sf.name}`}
            >
              <X className="size-10" />
            </button>
          </button>
        ))}
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-16">
          <div className="flex w-full max-w-sm flex-col gap-16 rounded-modal bg-surface-card p-16 shadow-modal">
            <h2 className="text-h3 text-text-primary">Save Filter</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Filter name (e.g., July Food)"
              className="rounded-md border border-border bg-surface-card px-12 py-8 text-body text-text-primary outline-none focus:ring-2 focus:ring-info"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              aria-label="Filter name"
            />
            <div className="flex justify-end gap-8">
              <Button variant="secondary" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!newName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No matches"
          description="Try a different search term, date range, or filter."
        />
      ) : (
        <div className="flex flex-col gap-24">
          {grouped.map(([dateLabel, items]) => (
            <div key={dateLabel} className="flex flex-col gap-8">
              <h2 className="text-overline text-text-tertiary">{dateLabel}</h2>
              <div className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-lg border border-border">
                {items.map((t) => (
                  <TransactionCard
                    key={t.id}
                    transaction={t}
                    category={categoryById.get(t.categoryId)}
                    onDelete={() => deleteTransaction(t)}
                    onEdit={() => openEditSheet(t)}
                    onDuplicate={() => duplicateTransaction(t)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CSVImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  )
}
