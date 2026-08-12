import { cn } from '@/utils/cn'
import {
  Shield,
  Home,
  Car,
  GraduationCap,
  Umbrella,
  Plane,
  TrendingUp,
  Smartphone,
  Heart,
  Target,
} from 'lucide-react'
import { GoalService } from '@/services/GoalService'
import type { GoalProgress } from '@/services/GoalService'

interface GoalCardProps {
  progress: GoalProgress
  onClick?: () => void
  compact?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const CATEGORY_ICONS = {
  emergency_fund: Shield,
  house: Home,
  vehicle: Car,
  education: GraduationCap,
  retirement: Umbrella,
  travel: Plane,
  investment: TrendingUp,
  gadget: Smartphone,
  wedding: Heart,
  custom: Target,
}

export function GoalCard({ progress, onClick, compact = false }: GoalCardProps) {
  const { goal, percentage, remaining, isOverdue, daysLeft, monthlyTarget, probability } = progress
  const isCompleted = goal.status === 'completed'
  const CategoryIcon = CATEGORY_ICONS[goal.type] ?? Target
  const color = GoalService.getColor(goal)

  const barColor = isCompleted
    ? '#62C3A7'
    : isOverdue
      ? '#D9534F'
      : probability === 'at_risk'
        ? '#D9A441'
        : '#62C3A7'

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'group card-sm flex w-full flex-col gap-12 p-16 text-left transition-all duration-fast',
        onClick ? 'hover:shadow-md' : 'cursor-default'
      )}
    >
      <div className="flex items-start gap-12 w-full">
        <div
          className="flex size-40 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          <CategoryIcon className="size-20" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-8">
            <p className="truncate font-heading text-body font-bold text-text-primary">
              {goal.name}
            </p>
            <div className="flex shrink-0 items-center gap-6">
              {goal.status !== 'active' && (
                <span
                  className={cn(
                    'rounded-full px-8 py-2 text-caption font-semibold shadow-pressed',
                    isCompleted
                      ? 'bg-income-subtle text-income'
                      : 'bg-surface text-text-tertiary'
                  )}
                >
                  {STATUS_LABELS[goal.status]}
                </span>
              )}
              {goal.status === 'active' && (
                <span
                  className={cn(
                    'rounded-full px-8 py-2 text-caption font-semibold',
                    probability === 'on_track' && 'bg-income-subtle text-income',
                    probability === 'at_risk' && 'bg-warning-subtle text-warning',
                    probability === 'off_track' && 'bg-expense-subtle text-expense',
                    probability === null && 'bg-border-subtle text-text-tertiary',
                  )}
                >
                  {probability === 'on_track'
                    ? 'On Track'
                    : probability === 'at_risk'
                      ? 'At Risk'
                      : probability === 'off_track'
                        ? 'Off Track'
                        : 'Active'}
                </span>
              )}
            </div>
          </div>
          {!compact && (
            <p className="text-body-sm font-medium text-text-secondary mt-2">{'\u20B9'}
              {goal.currentAmount.toLocaleString('en-IN')}{' '}
              <span className="text-text-tertiary font-normal">
                of {'\u20B9'}{goal.targetAmount.toLocaleString('en-IN')}
              </span>
            </p>
          )}
          <div className="card-input mt-6 h-8 w-full overflow-hidden rounded-full p-0.5">
            <div
              className="h-full rounded-full transition-all duration-slow"
              style={{ width: `${percentage}%`, backgroundColor: barColor }}
            />
          </div>
          {!compact && (
            <div className="mt-6 flex items-center justify-between text-body-sm font-medium tabular-nums">
              <span
                className={isCompleted ? 'text-income font-semibold' : 'text-text-secondary'}
              >
                {isCompleted
                  ? 'Goal Reached!'
                  : `\u20B9${remaining.toLocaleString('en-IN')} remaining`}
              </span>
              {monthlyTarget !== null && monthlyTarget > 0 && !isCompleted && (
                <span className="text-caption text-text-tertiary tabular-nums">
                  {'\u20B9'}
                  {monthlyTarget.toLocaleString('en-IN')}/mo
                </span>
              )}
              {daysLeft !== null && !isCompleted && (
                <span
                  className={cn(
                    'text-caption font-medium',
                    isOverdue
                      ? 'text-expense font-bold'
                      : daysLeft <= 7
                        ? 'text-warning font-semibold'
                        : 'text-text-tertiary'
                  )}
                >
                  {isOverdue ? 'Overdue' : `${daysLeft}d left`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
