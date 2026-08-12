import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FolderUp,
  Printer,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { db } from '@/database/db'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { useAccountsStore } from '@/features/accounts/accountsStore'
import { useBudgetsStore } from '@/features/budgets/budgetsStore'
import { useSettingsStore } from '@/app/settingsStore'
import { ReportService, type ReportPeriodType } from '@/services/ReportService'
import { BackupService, backupToBlob, downloadBlob, readFileAsText } from '@/services/BackupService'
import { DonutChart } from '@/components/charts/DonutChart'
import { TrendIndicator } from '@/components/charts/TrendIndicator'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import type { Category } from '@/types/entities'

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

function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string
  value: string
  sub?: ReactNode
  tone?: 'default' | 'income' | 'expense' | 'info'
}) {
  const toneClass =
    tone === 'income'
      ? 'text-brand-teal400'
      : tone === 'expense'
        ? 'text-expense'
        : tone === 'info'
          ? 'text-brand-teal600'
          : 'text-text-primary'
  return (
    <div className="card-sm flex flex-col gap-8 p-12">
      <span className="text-caption font-medium text-text-secondary">{label}</span>
      <span className={cn('text-h3 tabular-nums', toneClass)}>{value}</span>
      {sub}
    </div>
  )
}

const PERIOD_OPTIONS: { value: ReportPeriodType; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export function ReportsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const transactions = useTransactionsStore((s) => s.transactions)
  const accounts = useAccountsStore((s) => s.accounts)
  const budgets = useBudgetsStore((s) => s.budgets)
  const updateSettings = useSettingsStore((s) => s.update)
  const { show } = useToast()

  const loadsRef = useRef({
    tx: useTransactionsStore.getState().load,
    acct: useAccountsStore.getState().load,
    budgets: useBudgetsStore.getState().load,
    settings: useSettingsStore.getState().load,
  })

  const [periodType, setPeriodType] = useState<ReportPeriodType>('monthly')
  const [reference, setReference] = useState<Date>(new Date())
  const [categories, setCategories] = useState<Category[]>([])
  const [passphrase, setPassphrase] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [restorePassphrase, setRestorePassphrase] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadsRef.current.tx()
    loadsRef.current.acct()
    loadsRef.current.budgets()
    loadsRef.current.settings()
    db.categories.toArray().then((all) => setCategories(all.filter((c) => !c.isArchived)))
  }, [])

  const report = useMemo(
    () =>
      ReportService.getPeriodReport(
        transactions,
        categories,
        accounts,
        budgets,
        periodType,
        reference
      ),
    [transactions, categories, accounts, budgets, periodType, reference]
  )

  const availablePeriods = useMemo(
    () => ReportService.listReportPeriods(periodType, transactions),
    [periodType, transactions]
  )

  function navigate(delta: number) {
    setReference(ReportService.shiftPeriod(periodType, reference, delta).start)
  }

  function jumpTo(periodStart: Date) {
    setReference(periodStart)
  }

  async function exportCsv() {
    const csv = BackupService.transactionsToCsv(transactions)
    downloadBlob(
      new Blob([csv], { type: 'text/csv' }),
      `mizan-transactions-${new Date().toISOString().slice(0, 10)}.csv`
    )
    show('Transactions exported as CSV.')
  }

  async function exportBackup() {
    setBusy(true)
    try {
      const data = await BackupService.captureBackupData()
      const { json, encrypted } = await BackupService.serializeBackup(data, {
        passphrase: passphrase || undefined,
      })
      downloadBlob(
        backupToBlob(json, encrypted),
        `mizan-backup-${new Date().toISOString().slice(0, 10)}${encrypted ? '-encrypted' : ''}.json`
      )
      await updateSettings({ lastBackupAt: new Date().toISOString() })
      show(encrypted ? 'Encrypted backup downloaded.' : 'Backup downloaded.')
    } catch (error) {
      show(error instanceof Error ? error.message : 'Backup failed.')
    } finally {
      setBusy(false)
    }
  }

  function pickRestoreFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setRestoreFile(file)
    setConfirmOpen(true)
  }

  async function confirmRestore() {
    setConfirmOpen(false)
    if (!restoreFile) return
    setBusy(true)
    try {
      const json = await readFileAsText(restoreFile)
      const data = await BackupService.parseBackup(json, {
        passphrase: restorePassphrase || undefined,
      })
      await BackupService.restoreBackup(data)
      show('Backup restored. Reloading data…')
      await Promise.all([
        loadsRef.current.tx(),
        loadsRef.current.acct(),
        loadsRef.current.budgets(),
        loadsRef.current.settings(),
      ])
    } catch (error) {
      show(error instanceof Error ? error.message : 'Restore failed.')
    } finally {
      setBusy(false)
      setRestoreFile(null)
      setRestorePassphrase('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (transactions.length === 0) {
    return (
      <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
        {!embedded && <h1 className="text-h2 text-text-primary">Reports</h1>}
        <EmptyState
          icon={FileSpreadsheet}
          title="No reports yet"
          description="Add a few transactions and monthly, quarterly, and yearly reports with export and backup will light up here."
        />
      </div>
    )
  }

  const summary = report.summary
  const expenseTotal = summary.expense

  return (
    <div className={cn('flex flex-col gap-16', !embedded && 'p-16 md:p-24')}>
      <div className="flex flex-col gap-12">
        <div className="flex flex-wrap items-center justify-between gap-12 print-hide">
          {!embedded && <h1 className="text-h2 text-text-primary">Reports</h1>}
          <div className="flex items-center gap-8">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="size-16" aria-hidden="true" />
              Print
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-12 print-hide">
          <div role="radiogroup" aria-label="Report period" className="card-sm inline-flex p-4">
            {PERIOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={periodType === value}
                onClick={() => {
                  setPeriodType(value)
                  setReference(new Date())
                }}
                className={cn(
                  'flex min-h-touch items-center rounded-sm px-16 text-body-sm font-medium transition-colors duration-fast',
                  periodType === value
                    ? 'bg-brand-teal900/10 text-accent font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-8">
            <select
              aria-label="Jump to period"
              value={report.period.key}
              onChange={(e) => {
                const period = availablePeriods.find((p) => p.key === e.target.value)
                if (period) jumpTo(period.start)
              }}
              className="h-40 rounded-md border border-border bg-surface-card px-12 text-body-sm text-text-primary"
            >
              {availablePeriods.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
              aria-label="Previous period"
            >
              <ChevronLeft className="size-16" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(1)}
              aria-label="Next period"
            >
              <ChevronRight className="size-16" aria-hidden="true" />
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => setReference(new Date())}>
              Today
            </Button>
          </div>
        </div>
      </div>

      <div className="print-report">
        <p className="text-body text-text-secondary">{report.period.label} · Mizan</p>

        <div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
          <Stat
            label="Income"
            value={fmt(summary.income)}
            tone="income"
            sub={
              <span className="text-caption text-text-tertiary">
                <TrendIndicator value={report.vsPrevious.incomeChange} positiveDirection="up" />
                {report.vsPrevious.incomeChange !== null
                  ? ' vs previous period'
                  : ' no previous period'}
              </span>
            }
          />
          <Stat
            label="Expense"
            value={fmt(summary.expense)}
            tone="expense"
            sub={
              <span className="text-caption text-text-tertiary">
                <TrendIndicator value={report.vsPrevious.expenseChange} positiveDirection="down" />
                {report.vsPrevious.expenseChange !== null
                  ? ' vs previous period'
                  : ' no previous period'}
              </span>
            }
          />
          <Stat
            label="Net"
            value={fmt(summary.net)}
            tone={summary.net >= 0 ? 'income' : 'expense'}
          />
          <Stat
            label="Savings rate"
            value={summary.savingsRate === null ? '—' : `${Math.round(summary.savingsRate)}%`}
            sub={
              <span className="text-caption text-text-tertiary">
                {summary.transactionCount} transactions
              </span>
            }
          />
        </div>
      </div>

      <div className="grid gap-16 lg:grid-cols-2">
        <Card title="Spending by category">
          {report.categoryBreakdown.length === 0 ? (
            <p className="text-body-sm text-text-tertiary">No expenses in this period.</p>
          ) : (
            <div className="flex flex-col items-center gap-16 sm:flex-row sm:items-start">
              <DonutChart
                segments={report.categoryBreakdown.map((c) => ({
                  label: c.name,
                  value: c.amount,
                  color: c.color,
                }))}
                centerLabel="Total"
                centerValue={fmt(expenseTotal)}
                ariaLabel="Share of expenses by category"
                className="shrink-0"
              />
              <ul className="flex min-w-0 flex-1 flex-col divide-y divide-border-subtle">
                {report.categoryBreakdown.map((c) => (
                  <li key={c.categoryId} className="flex items-center justify-between gap-8 py-8">
                    <span className="flex min-w-0 items-center gap-8">
                      <span
                        className="size-16 shrink-0 rounded-sm"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="truncate text-body-sm text-text-secondary">{c.name}</span>
                    </span>
                    <span className="shrink-0 text-body-sm font-medium tabular-nums text-text-primary">
                      {fmt(c.amount)}
                    </span>
                    <span className="w-40 shrink-0 text-right text-caption tabular-nums text-text-tertiary">
                      {c.percent.toFixed(0)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title="By account">
          {report.accountBreakdown.length === 0 ? (
            <p className="text-body-sm text-text-tertiary">No activity in this period.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {report.accountBreakdown.map((a) => (
                <div
                  key={`${a.accountId}-${a.type}`}
                  className="flex items-center justify-between gap-8 py-8"
                >
                  <span className="flex min-w-0 items-center gap-8">
                    <span
                      className={cn(
                        'size-8 shrink-0 rounded-full',
                        a.type === 'income' ? 'bg-brand-teal400' : 'bg-expense'
                      )}
                    />
                    <span className="truncate text-body-sm text-text-secondary">
                      {a.name} · {a.type === 'income' ? 'income' : 'expense'}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-body-sm font-medium tabular-nums',
                      a.type === 'income' ? 'text-brand-teal400' : 'text-expense'
                    )}
                  >
                    {fmt(a.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-16 lg:grid-cols-2">
        <Card title="Budget vs actual">
          {report.budgetRows.length === 0 ? (
            <p className="text-body-sm text-text-tertiary">
              No active budgets. Set one up on the Budgets screen.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {report.budgetRows.map((b) => {
                const barPercent = Math.min(100, b.percentUsed)
                return (
                  <div key={b.budgetId} className="flex flex-col gap-8 py-8">
                    <div className="flex items-center justify-between gap-8">
                      <span className="truncate text-body-sm font-medium text-text-primary">
                        {b.categoryName}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-8 py-4 text-caption font-medium',
                          b.severity === 'over'
                            ? 'bg-expense-subtle text-expense'
                            : b.severity === 'warning'
                              ? 'bg-gold-500/15 text-gold-500'
                              : 'bg-brand-teal400/15 text-brand-teal400'
                        )}
                      >
                        {b.severity === 'over'
                          ? 'Over'
                          : b.severity === 'warning'
                            ? 'Near limit'
                            : 'Healthy'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-8 text-caption tabular-nums text-text-secondary">
                      <span>
                        {fmt(b.spent)} of {fmt(b.allocated)}
                      </span>
                      <span>{b.percentUsed.toFixed(0)}% used</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          b.severity === 'over'
                            ? 'bg-expense'
                            : b.severity === 'warning'
                              ? 'bg-gold-500'
                              : 'bg-brand-teal400'
                        )}
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Top merchants">
          {report.topMerchants.length === 0 ? (
            <p className="text-body-sm text-text-tertiary">No named expenses in this period.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {report.topMerchants.map((m) => (
                <div key={m.description} className="flex items-center justify-between gap-8 py-8">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-body-sm text-text-secondary">
                      {m.description}
                    </span>
                    <span className="text-caption text-text-tertiary">
                      {m.count} {m.count === 1 ? 'transaction' : 'transactions'}
                    </span>
                  </div>
                  <span className="shrink-0 text-body-sm font-medium tabular-nums text-text-primary">
                    {fmt(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Export & backup">
        <div className="flex flex-col gap-16 print-hide">
          <div className="flex flex-col gap-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4">
              <span className="text-body-sm font-medium text-text-primary">
                Export transactions
              </span>
              <span className="text-body-sm text-text-tertiary">
                CSV of all transactions (the default export format).
              </span>
            </div>
            <Button variant="secondary" onClick={exportCsv}>
              <FileSpreadsheet className="size-16" aria-hidden="true" />
              Export CSV
            </Button>
          </div>

          <div className="h-px bg-border-subtle" />

          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-4">
              <span className="text-body-sm font-medium text-text-primary">Backup everything</span>
              <span className="text-body-sm text-text-tertiary">
                Complete JSON snapshot of every table. Optionally encrypt it with a passphrase —
                keep it safe, it can&apos;t be recovered.
              </span>
            </div>
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
              <div className="relative flex min-w-0 flex-1 items-center">
                <Lock
                  className="pointer-events-none absolute left-12 size-16 text-text-tertiary"
                  aria-hidden="true"
                />
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Passphrase (optional)"
                  aria-label="Optional backup passphrase"
                  className="min-h-touch w-full rounded-md border border-border bg-surface-card pl-40 pr-12 text-body-sm text-text-primary placeholder:text-text-tertiary"
                />
              </div>
              <Button variant="primary" onClick={exportBackup} loading={busy}>
                <Download className="size-16" aria-hidden="true" />
                Download backup
              </Button>
            </div>
          </div>

          <div className="h-px bg-border-subtle" />

          <div className="flex flex-col gap-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4">
              <span className="text-body-sm font-medium text-text-primary">
                Restore from backup
              </span>
              <span className="text-body-sm text-text-tertiary">
                Replaces current data with the backup. Use the passphrase if the backup is
                encrypted.
              </span>
              <div className="relative mt-4 flex max-w-xs items-center">
                <Lock
                  className="pointer-events-none absolute left-12 size-16 text-text-tertiary"
                  aria-hidden="true"
                />
                <input
                  type="password"
                  value={restorePassphrase}
                  onChange={(e) => setRestorePassphrase(e.target.value)}
                  placeholder="Passphrase if encrypted"
                  aria-label="Passphrase for restoring an encrypted backup"
                  className="min-h-touch w-full rounded-md border border-border bg-surface-card pl-40 pr-12 text-body-sm text-text-primary placeholder:text-text-tertiary"
                />
              </div>
            </div>
            <div className="flex flex-col gap-8">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                loading={busy}
              >
                <FolderUp className="size-16" aria-hidden="true" />
                Choose backup file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={pickRestoreFile}
                aria-label="Choose a backup file"
              />
            </div>
          </div>

          <p className="text-caption text-text-tertiary">
            <RefreshCw className="mr-4 inline size-12" aria-hidden="true" />
            Backups are stored locally in this browser only — download regularly to keep your data
            safe.
          </p>
        </div>
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        title="Restore this backup?"
        description="This will replace all current data in Mizan with the backup contents. This cannot be undone."
        confirmLabel="Restore"
        destructive
        onConfirm={confirmRestore}
        onCancel={() => {
          setConfirmOpen(false)
          setRestoreFile(null)
          setRestorePassphrase('')
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
      />
    </div>
  )
}
