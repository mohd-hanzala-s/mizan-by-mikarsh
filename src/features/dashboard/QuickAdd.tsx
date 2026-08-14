import { PlusCircle, ArrowDownCircle, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { cn } from '@/utils/cn'

const ACTIONS = [
  {
    key: 'add-expense',
    label: 'Add Expense',
    icon: ArrowDownCircle,
    bg: 'bg-expense-subtle',
    fg: 'text-expense',
    action: 'add-sheet',
  },
  {
    key: 'add-income',
    label: 'Add Income',
    icon: PlusCircle,
    bg: 'bg-income-subtle',
    fg: 'text-income',
    action: 'add-sheet',
  },
  {
    key: 'set-goal',
    label: 'Set Goal',
    icon: Target,
    bg: 'bg-warning-subtle',
    fg: 'text-warning',
    action: 'goals',
  },
  {
    key: 'invest-now',
    label: 'Invest Now',
    icon: TrendingUp,
    bg: 'bg-brand-teal900/8',
    fg: 'text-brand-teal400',
    action: 'accounts',
  },
] as const

export function QuickAdd() {
  const openAddSheet = useTransactionsStore((s) => s.openAddSheet)
  const navigate = useNavigate()

  function handleAction(action: (typeof ACTIONS)[number]) {
    if (action.action === 'add-sheet') {
      openAddSheet()
    } else if (action.action === 'goals') {
      navigate('/goals')
    } else if (action.action === 'accounts') {
      navigate('/accounts')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-overline text-text-tertiary uppercase">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-8">
        {ACTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => handleAction(item)}
            className={cn(
              'group flex min-h-touch items-center gap-10 rounded-xl px-16 py-14 transition-all duration-fast active:scale-[0.97]',
              item.bg
            )}
          >
            <span
              className={cn(
                'flex size-28 items-center justify-center rounded-lg transition-transform duration-fast group-hover:scale-110',
                item.fg
              )}
            >
              <item.icon className="size-16" aria-hidden="true" />
            </span>
            <span className="text-body-sm font-semibold text-text-primary">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
