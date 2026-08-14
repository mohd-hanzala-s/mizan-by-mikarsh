import { useMemo } from 'react'
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay } from 'date-fns'
import type { Transaction } from '@/types/entities'
import { isTransferCreditLeg } from '@/utils/transactions'

interface SpendingHeatmapProps {
  transactions: Transaction[]
  year: number
}

interface DayCell {
  date: Date
  total: number
  count: number
  intensity: number
}

const INTENSITY_CLASSES = [
  'bg-neutral-100 dark:bg-neutral-800',
  'bg-info/20 dark:bg-info/15',
  'bg-info/40 dark:bg-info/30',
  'bg-info/60 dark:bg-info/50',
  'bg-info dark:bg-info/60',
]

function getIntensity(amount: number, max: number): number {
  if (max === 0 || amount === 0) return 0
  if (amount <= max * 0.25) return 1
  if (amount <= max * 0.5) return 2
  if (amount <= max * 0.75) return 3
  return 4
}

export function SpendingHeatmap({ transactions, year }: SpendingHeatmapProps) {
  const today = new Date()

  const cells = useMemo(() => {
    const start = startOfYear(new Date(year, 0, 1))
    const end = endOfYear(new Date(year, 0, 1))

    const dayMap = new Map<string, { total: number; count: number }>()

    for (const t of transactions) {
      if (t.isDeleted || t.type !== 'expense' || isTransferCreditLeg(t)) continue
      const key = t.transactionDate
      const existing = dayMap.get(key) ?? { total: 0, count: 0 }
      existing.total += t.amount
      existing.count++
      dayMap.set(key, existing)
    }

    let maxTotal = 0
    for (const { total } of dayMap.values()) {
      if (total > maxTotal) maxTotal = total
    }

    const days = eachDayOfInterval({ start, end })
    return days.map((date): DayCell => {
      const key = format(date, 'yyyy-MM-dd')
      const dayData = dayMap.get(key)
      const total = dayData?.total ?? 0
      const count = dayData?.count ?? 0
      return {
        date,
        total,
        count,
        intensity: getIntensity(total, maxTotal),
      }
    })
  }, [transactions, year])

  const months = useMemo(() => {
    const result: { label: string; startIdx: number; days: DayCell[] }[] = []
    let currentMonth = -1
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      if (cell.date.getMonth() !== currentMonth) {
        currentMonth = cell.date.getMonth()
        result.push({
          label: format(cell.date, 'MMM'),
          startIdx: i,
          days: [],
        })
      }
      result[result.length - 1].days.push(cell)
    }
    return result
  }, [cells])

  const totalSpending = useMemo(() => cells.reduce((sum, c) => sum + c.total, 0), [cells])

  if (cells.length === 0) return null

  return (
    <div className="flex flex-col gap-8 rounded-md border border-border bg-surface-card p-16">
      <div className="flex items-center justify-between">
        <h3 className="text-overline text-text-tertiary">Spending Heatmap</h3>
        <span className="text-caption text-text-tertiary tabular-nums">
          {year}: {totalSpending.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {months.map((month) => (
          <div key={month.label} className="flex items-center gap-4">
            <span className="w-24 text-right text-caption text-text-tertiary">{month.label}</span>
            <div className="flex gap-2">
              {month.days.map((cell) => {
                const isToday = isSameDay(cell.date, today)
                const isFuture = cell.date > today
                return (
                  <div
                    key={cell.date.toISOString()}
                    className={`size-12 rounded-sm ${
                      isFuture ? 'bg-transparent' : INTENSITY_CLASSES[cell.intensity]
                    } ${isToday ? 'ring-1 ring-text-primary' : ''}`}
                    title={`${format(cell.date, 'MMM d')}: ${cell.count > 0 ? `${cell.total.toLocaleString('en-IN')} in ${cell.count} transactions` : 'No spending'}`}
                    role="img"
                    aria-label={`${format(cell.date, 'MMMM d, yyyy')}: ${cell.total > 0 ? `${cell.total.toLocaleString('en-IN')} spent` : 'No spending'}`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-8">
        <span className="text-caption text-text-tertiary">Less</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <div key={i} className={`size-12 rounded-sm ${cls}`} aria-hidden="true" />
        ))}
        <span className="text-caption text-text-tertiary">More</span>
      </div>
    </div>
  )
}
