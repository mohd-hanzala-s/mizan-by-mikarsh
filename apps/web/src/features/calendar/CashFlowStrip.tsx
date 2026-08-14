import { cn } from '@/utils/cn'

interface CashFlowStripProps {
  income: number
  expense: number
}

export function CashFlowStrip({ income, expense }: CashFlowStripProps) {
  const total = income + expense
  if (total === 0) return null

  const incomePercent = total > 0 ? (income / total) * 100 : 0
  const expensePercent = total > 0 ? (expense / total) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-8 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        {incomePercent > 0 && (
          <div
            className="bg-income h-full transition-all duration-slow"
            style={{ width: `${incomePercent}%` }}
            aria-label={`Income: ${incomePercent.toFixed(0)}%`}
          />
        )}
        {expensePercent > 0 && (
          <div
            className="bg-expense h-full transition-all duration-slow"
            style={{ width: `${expensePercent}%` }}
            aria-label={`Expense: ${expensePercent.toFixed(0)}%`}
          />
        )}
      </div>
      <div className="flex items-center gap-8 text-caption text-text-tertiary">
        <span className="flex items-center gap-4">
          <span className={cn('size-8 rounded-full', income > 0 ? 'bg-income' : 'bg-border')} />
          Income
        </span>
        <span className="flex items-center gap-4">
          <span className={cn('size-8 rounded-full', expense > 0 ? 'bg-expense' : 'bg-border')} />
          Expense
        </span>
      </div>
    </div>
  )
}
