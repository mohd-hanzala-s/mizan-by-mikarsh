import type { Account } from '@/types/entities'
import { DynamicIcon } from '@/components/common/DynamicIcon'
import { cn } from '@/utils/cn'
import { formatAmount } from '@/utils/currency'

interface AccountCardProps {
  account: Account
  onClick?: () => void
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const isNegative = account.currentBalance < 0

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const } : {})}
      onClick={onClick}
      className={cn(
        'group card-sm flex min-h-touch items-center gap-12 px-16 py-12 transition-all duration-fast',
        onClick && 'w-full text-left hover:shadow-md'
      )}
    >
      <span
        className="flex size-40 shrink-0 items-center justify-center rounded-xl transition-transform duration-fast group-hover:scale-105 shadow-sm"
        style={{ backgroundColor: `${account.color}18`, color: account.color }}
      >
        <DynamicIcon name={account.icon} className="size-20" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-body font-semibold text-text-primary">
          {account.name}
        </span>
        <span className="block text-caption font-medium capitalize text-text-tertiary">
          {account.type.replace('_', ' ')}
        </span>
      </div>
      <span
        className={cn(
          'shrink-0 font-heading tabular-nums text-body-lg font-bold tracking-tight',
          isNegative ? 'text-expense' : 'text-text-primary'
        )}
      >
        {isNegative ? '\u2212' : ''}
        {formatAmount(Math.abs(account.currentBalance), account.currency)}
      </span>
    </Wrapper>
  )
}
