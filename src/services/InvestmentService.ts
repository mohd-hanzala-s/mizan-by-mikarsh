import { InvestmentRepository } from '@/repositories/InvestmentRepository'
import type { Investment, InvestmentType } from '@/types/entities'

export interface CreateInvestmentInput {
  name: string
  type: InvestmentType
  units: number
  avgCostPerUnit: number
  currentPricePerUnit: number
  accountId: string | null
  notes?: string
}

export interface UpdateInvestmentInput {
  name: string
  units: number
  avgCostPerUnit: number
  accountId: string | null
  notes: string
}

export interface InvestmentGainLoss {
  investedValue: number
  currentValue: number
  gainLoss: number
  /** Percent gain/loss, or null when investedValue is 0 (can't divide). */
  gainLossPercent: number | null
}

function validate(input: Pick<CreateInvestmentInput, 'name' | 'units' | 'avgCostPerUnit'>): void {
  if (!input.name.trim()) throw new Error('Investment name is required.')
  if (!(input.units > 0)) throw new Error('Units must be greater than 0.')
  if (!(input.avgCostPerUnit > 0)) throw new Error('Average cost must be greater than 0.')
}

/** Pure gain/loss math — no DB access, so it's usable both by the service
 * layer and directly in tests/UI without an async round-trip. */
export function computeGainLoss(investment: Investment): InvestmentGainLoss {
  const investedValue = investment.units * investment.avgCostPerUnit
  const currentValue = investment.units * investment.currentPricePerUnit
  const gainLoss = currentValue - investedValue
  const gainLossPercent = investedValue > 0 ? (gainLoss / investedValue) * 100 : null
  return { investedValue, currentValue, gainLoss, gainLossPercent }
}

/** Aggregate gain/loss across a list of holdings — sums the absolute
 * values, then derives one blended percentage (not an average of
 * percentages, which would misweight small holdings). */
export function computePortfolioSummary(investments: Investment[]): InvestmentGainLoss {
  const totals = investments.reduce(
    (acc, inv) => {
      const { investedValue, currentValue } = computeGainLoss(inv)
      return {
        investedValue: acc.investedValue + investedValue,
        currentValue: acc.currentValue + currentValue,
      }
    },
    { investedValue: 0, currentValue: 0 }
  )
  const gainLoss = totals.currentValue - totals.investedValue
  const gainLossPercent = totals.investedValue > 0 ? (gainLoss / totals.investedValue) * 100 : null
  return { ...totals, gainLoss, gainLossPercent }
}

export const InvestmentService = {
  async create(input: CreateInvestmentInput): Promise<Investment> {
    validate(input)
    const now = new Date().toISOString()
    const investment: Investment = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      type: input.type,
      units: input.units,
      avgCostPerUnit: input.avgCostPerUnit,
      currentPricePerUnit: input.currentPricePerUnit || input.avgCostPerUnit,
      priceUpdatedAt: now,
      accountId: input.accountId,
      status: 'active',
      notes: input.notes?.trim() ?? '',
      createdAt: now,
      updatedAt: now,
    }
    await InvestmentRepository.add(investment)
    return investment
  },

  async update(id: string, input: UpdateInvestmentInput): Promise<void> {
    validate(input)
    await InvestmentRepository.update(id, {
      name: input.name.trim(),
      units: input.units,
      avgCostPerUnit: input.avgCostPerUnit,
      accountId: input.accountId,
      notes: input.notes.trim(),
    })
  },

  /** Updates just the manual price mark — separate from the full edit form
   * since this is the action a user takes far more often (checking a
   * quote and typing it in) than editing units/cost. */
  async updatePrice(id: string, currentPricePerUnit: number): Promise<void> {
    if (!(currentPricePerUnit > 0)) throw new Error('Price must be greater than 0.')
    await InvestmentRepository.update(id, {
      currentPricePerUnit,
      priceUpdatedAt: new Date().toISOString(),
    })
  },

  async markSold(id: string): Promise<void> {
    await InvestmentRepository.update(id, { status: 'sold' })
  },

  async delete(id: string): Promise<void> {
    await InvestmentRepository.delete(id)
  },

  computeGainLoss,
  computePortfolioSummary,
}
