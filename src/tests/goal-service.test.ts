import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/database/db'
import { GoalService } from '@/services/GoalService'
import { GoalRepository } from '@/repositories/GoalRepository'

describe('GoalService', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('creates a goal with default values', async () => {
    const goal = await GoalService.create({
      name: 'Emergency Fund',
      type: 'emergency_fund',
      targetAmount: 50000,
      deadline: null,
      categoryId: null,
    })

    expect(goal.name).toBe('Emergency Fund')
    expect(goal.type).toBe('emergency_fund')
    expect(goal.targetAmount).toBe(50000)
    expect(goal.currentAmount).toBe(0)
    expect(goal.status).toBe('active')
    expect(goal.icon).toBe('Shield')
    expect(goal.monthlyContribution).toBe(0)
  })

  it('computes progress correctly', () => {
    const progress = GoalService.computeProgress({
      id: 'goal-1',
      name: 'Test',
      type: 'emergency_fund',
      targetAmount: 10000,
      currentAmount: 4000,
      monthlyContribution: 0,
      deadline: null,
      categoryId: null,
      icon: 'Shield',
      status: 'active',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    expect(progress.percentage).toBe(40)
    expect(progress.remaining).toBe(6000)
    expect(progress.isOverdue).toBe(false)
    expect(progress.daysLeft).toBe(null)
    expect(progress.probability).toBe(null)
  })

  it('computes 100% progress when goal is met', () => {
    const progress = GoalService.computeProgress({
      id: 'goal-1',
      name: 'Test',
      type: 'emergency_fund',
      targetAmount: 10000,
      currentAmount: 15000,
      monthlyContribution: 0,
      deadline: null,
      categoryId: null,
      icon: 'Shield',
      status: 'active',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    expect(progress.percentage).toBe(100)
    expect(progress.remaining).toBe(0)
  })

  it('detects overdue goals', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)

    const progress = GoalService.computeProgress({
      id: 'goal-1',
      name: 'Test',
      type: 'emergency_fund',
      targetAmount: 10000,
      currentAmount: 2000,
      monthlyContribution: 0,
      deadline: pastDate.toISOString(),
      categoryId: null,
      icon: 'Shield',
      status: 'active',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    expect(progress.isOverdue).toBe(true)
  })

  it('generates alerts for overdue goals', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)

    const alerts = GoalService.getAlerts([
      {
        id: 'goal-1',
        name: 'Test',
        type: 'emergency_fund',
        targetAmount: 10000,
        currentAmount: 2000,
        monthlyContribution: 0,
        deadline: pastDate.toISOString(),
        categoryId: null,
        icon: 'Shield',
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    expect(alerts).toHaveLength(1)
    expect(alerts[0].type).toBe('overdue')
    expect(alerts[0].priority).toBe('high')
  })

  it('generates alerts for nearly complete goals', () => {
    const alerts = GoalService.getAlerts([
      {
        id: 'goal-1',
        name: 'Test',
        type: 'emergency_fund',
        targetAmount: 10000,
        currentAmount: 9500,
        monthlyContribution: 0,
        deadline: null,
        categoryId: null,
        icon: 'Shield',
        status: 'active',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    expect(alerts).toHaveLength(1)
    expect(alerts[0].type).toBe('on_track')
  })

  it('contributes to a goal and updates amount', async () => {
    const goal = await GoalService.create({
      name: 'New Laptop',
      type: 'gadget',
      targetAmount: 80000,
      deadline: null,
      categoryId: null,
    })

    const updated = await GoalService.contribute(goal.id, 30000)
    expect(updated.currentAmount).toBe(30000)
    expect(updated.status).toBe('active')

    const updated2 = await GoalService.contribute(goal.id, 50000)
    expect(updated2.currentAmount).toBe(80000)
    expect(updated2.status).toBe('completed')
  })

  it('retrieves contributions for a goal', async () => {
    const goal = await GoalService.create({
      name: 'Vacation',
      type: 'travel',
      targetAmount: 100000,
      deadline: null,
      categoryId: null,
    })

    await GoalService.contribute(goal.id, 20000)
    await GoalService.contribute(goal.id, 15000)

    const contributions = await GoalRepository.getContributions(goal.id)
    expect(contributions).toHaveLength(2)
    expect(contributions.reduce((sum, c) => sum + c.amount, 0)).toBe(35000)
  })

  it('removes a goal and its contributions', async () => {
    const goal = await GoalService.create({
      name: 'Test',
      type: 'emergency_fund',
      targetAmount: 10000,
      deadline: null,
      categoryId: null,
    })

    await GoalService.contribute(goal.id, 5000)
    await GoalService.remove(goal.id)

    const found = await GoalRepository.getById(goal.id)
    expect(found).toBeUndefined()

    const contributions = await GoalRepository.getContributions(goal.id)
    expect(contributions).toHaveLength(0)
  })

  it('cancels a goal', async () => {
    const goal = await GoalService.create({
      name: 'Test',
      type: 'emergency_fund',
      targetAmount: 10000,
      deadline: null,
      categoryId: null,
    })

    const updated = await GoalService.cancel(goal.id)
    expect(updated.status).toBe('cancelled')
  })

  it('does not generate alerts for completed or cancelled goals', () => {
    const alerts = GoalService.getAlerts([
      {
        id: 'goal-1',
        name: 'Completed',
        type: 'emergency_fund',
        targetAmount: 10000,
        currentAmount: 10000,
        monthlyContribution: 0,
        deadline: null,
        categoryId: null,
        icon: 'Shield',
        status: 'completed',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    expect(alerts).toHaveLength(0)
  })

  it('computes monthly target for goals with deadline', () => {
    const future = new Date()
    future.setMonth(future.getMonth() + 3)

    const progress = GoalService.computeProgress({
      id: 'goal-1',
      name: 'Test',
      type: 'emergency_fund',
      targetAmount: 30000,
      currentAmount: 0,
      monthlyContribution: 0,
      deadline: future.toISOString(),
      categoryId: null,
      icon: 'Shield',
      status: 'active',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    expect(progress.monthlyTarget).toBeGreaterThan(0)
    expect(progress.daysLeft).toBeGreaterThan(0)
  })

  it('creates different goal types with correct icons', async () => {
    const houseGoal = await GoalService.create({
      name: 'Buy house',
      type: 'house',
      targetAmount: 50000,
      deadline: null,
      categoryId: null,
    })

    expect(houseGoal.icon).toBe('Home')

    const weddingGoal = await GoalService.create({
      name: 'Wedding fund',
      type: 'wedding',
      targetAmount: 300000,
      deadline: null,
      categoryId: null,
    })

    expect(weddingGoal.icon).toBe('Heart')
  })

  it('handles zero target amount gracefully', () => {
    const progress = GoalService.computeProgress({
      id: 'goal-1',
      name: 'Test',
      type: 'emergency_fund',
      targetAmount: 0,
      currentAmount: 0,
      monthlyContribution: 0,
      deadline: null,
      categoryId: null,
      icon: 'Shield',
      status: 'active',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    expect(progress.percentage).toBe(0)
    expect(progress.remaining).toBe(0)
  })

  it('computes probability for goals with deadlines', () => {
    const past = new Date()
    past.setMonth(past.getMonth() - 3)
    const future = new Date()
    future.setMonth(future.getMonth() + 3)

    const progress = GoalService.computeProgress({
      id: 'goal-1',
      name: 'Test',
      type: 'emergency_fund',
      targetAmount: 100000,
      currentAmount: 40000,
      monthlyContribution: 0,
      deadline: future.toISOString(),
      categoryId: null,
      icon: 'Shield',
      status: 'active',
      notes: '',
      createdAt: past.toISOString(),
      updatedAt: new Date().toISOString(),
    })

    expect(progress.probability).toBeDefined()
  })

  it('returns category colors by type', () => {
    expect(GoalService.getColor({ type: 'emergency_fund' } as Parameters<typeof GoalService.getColor>[0])).toBe('#0F4D45')
    expect(GoalService.getColor({ type: 'wedding' } as Parameters<typeof GoalService.getColor>[0])).toBe('#D9534F')
  })

  it('returns category labels', () => {
    expect(GoalService.getCategoryLabel('emergency_fund')).toBe('Emergency Fund')
    expect(GoalService.getCategoryLabel('gadget')).toBe('Gadget')
    expect(GoalService.getCategoryLabel('wedding')).toBe('Wedding')
  })

  it('creates goal with computed monthly contribution when deadline is set', async () => {
    const future = new Date()
    future.setMonth(future.getMonth() + 6)

    const goal = await GoalService.create({
      name: 'Vacation',
      type: 'travel',
      targetAmount: 60000,
      deadline: future.toISOString(),
      categoryId: null,
    })

    expect(goal.monthlyContribution).toBeGreaterThan(0)
  })
})
