import { GoalRepository } from '@/repositories/GoalRepository'
import type { Goal, GoalContribution, GoalType } from '@/types/entities'

function generateId(): string {
  return `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export interface GoalProgress {
  goal: Goal
  percentage: number
  remaining: number
  isOverdue: boolean
  daysLeft: number | null
  monthlyTarget: number | null
  probability: 'on_track' | 'at_risk' | 'off_track' | null
}

export interface GoalAlert {
  id: string
  goalId: string
  type: 'on_track' | 'at_risk' | 'overdue' | 'completed'
  message: string
  priority: 'low' | 'medium' | 'high'
}

const ICONS_BY_TYPE: Record<GoalType, string> = {
  emergency_fund: 'Shield',
  house: 'Home',
  vehicle: 'Car',
  education: 'GraduationCap',
  retirement: 'Umbrella',
  travel: 'Plane',
  investment: 'TrendingUp',
  gadget: 'Smartphone',
  wedding: 'Heart',
  custom: 'Target',
}

const COLORS_BY_TYPE: Record<GoalType, string> = {
  emergency_fund: '#0F4D45',
  house: '#D9A441',
  vehicle: '#1E7F72',
  education: '#62C3A7',
  retirement: '#0F4D45',
  travel: '#D9A441',
  investment: '#62C3A7',
  gadget: '#D9A441',
  wedding: '#D9534F',
  custom: '#0F4D45',
}

const CATEGORY_LABELS: Record<GoalType, string> = {
  emergency_fund: 'Emergency Fund',
  house: 'House',
  vehicle: 'Vehicle',
  education: 'Education',
  retirement: 'Retirement',
  travel: 'Travel',
  investment: 'Investment',
  gadget: 'Gadget',
  wedding: 'Wedding',
  custom: 'Custom',
}

export const GoalService = {
  create(params: {
    name: string
    type: GoalType
    targetAmount: number
    deadline: string | null
    categoryId: string | null
    notes?: string
  }): Promise<Goal> {
    const now = new Date().toISOString()
    let monthlyContribution = 0
    if (params.deadline && params.targetAmount > 0) {
      const monthsRemaining = Math.max(
        1,
        (new Date(params.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
      )
      monthlyContribution = Math.ceil(params.targetAmount / monthsRemaining)
    }
    const goal: Goal = {
      id: generateId(),
      name: params.name,
      type: params.type,
      targetAmount: params.targetAmount,
      currentAmount: 0,
      monthlyContribution,
      deadline: params.deadline,
      categoryId: params.categoryId ?? null,
      icon: ICONS_BY_TYPE[params.type],
      status: 'active',
      notes: params.notes ?? '',
      createdAt: now,
      updatedAt: now,
    }
    return GoalRepository.add(goal)
  },

  update(id: string, patch: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<Goal> {
    return GoalRepository.update(id, patch)
  },

  async contribute(goalId: string, amount: number, date?: string, notes?: string): Promise<Goal> {
    const goal = await GoalRepository.getById(goalId)
    if (!goal) throw new Error(`Goal ${goalId} not found`)
    if (goal.status !== 'active') throw new Error('Cannot contribute to a non-active goal')

    const now = new Date().toISOString()
    const contribution: GoalContribution = {
      id: `gc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      goalId,
      amount,
      date: date ?? now,
      notes: notes ?? '',
      createdAt: now,
    }
    await GoalRepository.addContribution(contribution)

    const newAmount = goal.currentAmount + amount
    const completed = newAmount >= goal.targetAmount
    return GoalRepository.update(goalId, {
      currentAmount: newAmount,
      status: completed ? 'completed' : 'active',
    })
  },

  async cancel(id: string): Promise<Goal> {
    return GoalRepository.update(id, { status: 'cancelled' })
  },

  async remove(id: string): Promise<void> {
    await GoalRepository.remove(id)
  },

  computeProgress(goal: Goal): GoalProgress {
    const percentage =
      goal.targetAmount > 0
        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
        : 0
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
    const isOverdue =
      goal.deadline !== null && new Date(goal.deadline) < new Date() && goal.status === 'active'

    let daysLeft: number | null = null
    if (goal.deadline) {
      daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }

    let monthlyTarget: number | null = null
    if (goal.deadline && remaining > 0) {
      const monthsRemaining = Math.max(
        1,
        (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
      )
      monthlyTarget = Math.ceil(remaining / monthsRemaining)
    }

    let probability: GoalProgress['probability'] = null
    if (goal.deadline && goal.targetAmount > 0 && goal.status === 'active') {
      const startDate = new Date(goal.createdAt).getTime()
      const endDate = new Date(goal.deadline).getTime()
      const now = Date.now()
      const totalDuration = endDate - startDate
      if (totalDuration > 0) {
        const timeElapsedPct = Math.min(100, Math.round(((now - startDate) / totalDuration) * 100))
        if (percentage >= timeElapsedPct) {
          probability = 'on_track'
        } else if (percentage >= timeElapsedPct * 0.8) {
          probability = 'at_risk'
        } else {
          probability = 'off_track'
        }
      }
    }

    return { goal, percentage, remaining, isOverdue, daysLeft, monthlyTarget, probability }
  },

  getAlerts(goals: Goal[]): GoalAlert[] {
    const alerts: GoalAlert[] = []
    for (const goal of goals) {
      if (goal.status !== 'active') continue
      const progress = this.computeProgress(goal)

      if (progress.isOverdue) {
        alerts.push({
          id: `alert-overdue-${goal.id}`,
          goalId: goal.id,
          type: 'overdue',
          message: `"${goal.name}" is past its deadline`,
          priority: 'high',
        })
      } else if (progress.percentage >= 90) {
        alerts.push({
          id: `alert-complete-${goal.id}`,
          goalId: goal.id,
          type: 'on_track',
          message: `"${goal.name}" is almost complete!`,
          priority: 'low',
        })
      } else if (progress.daysLeft !== null && progress.daysLeft < 14 && progress.percentage < 50) {
        alerts.push({
          id: `alert-risk-${goal.id}`,
          goalId: goal.id,
          type: 'at_risk',
          message: `"${goal.name}" may not be reached in time`,
          priority: 'medium',
        })
      }
    }
    return alerts
  },

  recommendGoalAmount(monthlyExpense: number): number {
    return Math.round(monthlyExpense * 3)
  },

  predictCompletionDate(goal: Goal, monthlyRate: number): string | null {
    if (monthlyRate <= 0) return null
    const remaining = goal.targetAmount - goal.currentAmount
    const months = Math.ceil(remaining / monthlyRate)
    const date = new Date()
    date.setMonth(date.getMonth() + months)
    return date.toISOString()
  },

  getIcon(goal: Goal): string {
    return goal.icon
  },

  getColor(goal: Goal): string {
    return COLORS_BY_TYPE[goal.type]
  },

  getCategoryLabel(type: GoalType): string {
    return CATEGORY_LABELS[type]
  },
}
