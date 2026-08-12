import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/database/db'
import {
  InvestmentService,
  computeGainLoss,
  computePortfolioSummary,
} from '@/services/InvestmentService'
import type { Investment } from '@/types/entities'

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: 'Test Fund',
    type: 'mutual_fund',
    units: 10,
    avgCostPerUnit: 100,
    currentPricePerUnit: 120,
    priceUpdatedAt: now,
    accountId: null,
    status: 'active',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('computeGainLoss', () => {
  it('computes invested value, current value, and gain', () => {
    const inv = makeInvestment({ units: 10, avgCostPerUnit: 100, currentPricePerUnit: 120 })
    const result = computeGainLoss(inv)
    expect(result.investedValue).toBe(1000)
    expect(result.currentValue).toBe(1200)
    expect(result.gainLoss).toBe(200)
    expect(result.gainLossPercent).toBe(20)
  })

  it('computes a loss when current price is below cost', () => {
    const inv = makeInvestment({ units: 10, avgCostPerUnit: 100, currentPricePerUnit: 80 })
    const result = computeGainLoss(inv)
    expect(result.gainLoss).toBe(-200)
    expect(result.gainLossPercent).toBe(-20)
  })

  it('returns null percent when invested value is 0', () => {
    const inv = makeInvestment({ units: 0, avgCostPerUnit: 100 })
    const result = computeGainLoss(inv)
    expect(result.gainLossPercent).toBeNull()
  })
})

describe('computePortfolioSummary', () => {
  it('sums absolute values across holdings before deriving a percent', () => {
    const holdings = [
      makeInvestment({ units: 10, avgCostPerUnit: 100, currentPricePerUnit: 120 }), // +200 on 1000
      makeInvestment({ units: 5, avgCostPerUnit: 1000, currentPricePerUnit: 900 }), // -500 on 5000
    ]
    const summary = computePortfolioSummary(holdings)
    expect(summary.investedValue).toBe(6000)
    expect(summary.currentValue).toBe(5700)
    expect(summary.gainLoss).toBe(-300)
    // -300 / 6000 = -5%, NOT the average of +20% and -10% (+5%) — the
    // blended percent must be weighted by size, not averaged naively.
    expect(summary.gainLossPercent).toBe(-5)
  })

  it('returns zero totals and null percent for an empty portfolio', () => {
    const summary = computePortfolioSummary([])
    expect(summary.investedValue).toBe(0)
    expect(summary.currentValue).toBe(0)
    expect(summary.gainLossPercent).toBeNull()
  })
})

describe('InvestmentService CRUD', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('creates a holding, defaulting currentPricePerUnit to avgCostPerUnit if unset', async () => {
    const inv = await InvestmentService.create({
      name: 'Nifty Index Fund',
      type: 'mutual_fund',
      units: 50,
      avgCostPerUnit: 200,
      currentPricePerUnit: 0,
      accountId: null,
    })
    expect(inv.currentPricePerUnit).toBe(200)
    expect(inv.status).toBe('active')
  })

  it('rejects zero or negative units', async () => {
    await expect(
      InvestmentService.create({
        name: 'Bad Fund',
        type: 'stock',
        units: 0,
        avgCostPerUnit: 100,
        currentPricePerUnit: 100,
        accountId: null,
      })
    ).rejects.toThrow()
  })

  it('updatePrice records a new price and timestamp', async () => {
    const inv = await InvestmentService.create({
      name: 'Growth Fund',
      type: 'mutual_fund',
      units: 10,
      avgCostPerUnit: 100,
      currentPricePerUnit: 100,
      accountId: null,
    })
    await InvestmentService.updatePrice(inv.id, 150)
    const updated = await db.investments.get(inv.id)
    expect(updated?.currentPricePerUnit).toBe(150)
  })

  it('markSold moves a holding out of the active list', async () => {
    const inv = await InvestmentService.create({
      name: 'Sold Fund',
      type: 'stock',
      units: 5,
      avgCostPerUnit: 50,
      currentPricePerUnit: 60,
      accountId: null,
    })
    await InvestmentService.markSold(inv.id)
    const { InvestmentRepository } = await import('@/repositories/InvestmentRepository')
    const active = await InvestmentRepository.getAll()
    expect(active.find((i) => i.id === inv.id)).toBeUndefined()
    const all = await InvestmentRepository.getAllIncludingSold()
    expect(all.find((i) => i.id === inv.id)?.status).toBe('sold')
  })
})
