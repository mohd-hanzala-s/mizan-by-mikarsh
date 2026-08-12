import type { Loan } from '@/types/entities'

/** Safety bound mirroring LoanService's MAX_FORECAST_MONTHS — 50 years of
 * monthly payments is far beyond any real payoff plan, and a strategy that
 * hasn't cleared all debts by then means the minimum payments don't cover
 * interest (the simulation would otherwise spin forever). */
const MAX_SIMULATION_MONTHS = 600

export type PayoffStrategy = 'snowball' | 'avalanche'

export interface DebtPayoffLoanInput {
  id: string
  name: string
  balance: number
  /** Annual percentage rate, or 0 when interest isn't tracked. */
  interestRate: number
  minPayment: number
}

export interface DebtPayoffLoanResult {
  id: string
  name: string
  /** 1-indexed month this loan's balance reaches zero. */
  payoffMonth: number
  totalInterestPaid: number
}

export interface DebtPayoffResult {
  strategy: PayoffStrategy
  /** Loan IDs in the order this strategy pays them off, fastest-priority
   * first — snowball: smallest balance; avalanche: highest rate. */
  order: string[]
  monthsToDebtFree: number
  totalInterestPaid: number
  perLoan: DebtPayoffLoanResult[]
  /** True if MAX_SIMULATION_MONTHS was hit before every balance reached
   * zero — the minimum payments (even with the extra applied) don't cover
   * the accruing interest on every loan. */
  neverPaysOff: boolean
}

function priorityOrder(
  loans: DebtPayoffLoanInput[],
  strategy: PayoffStrategy
): DebtPayoffLoanInput[] {
  const sorted = [...loans]
  if (strategy === 'snowball') {
    sorted.sort((a, b) => a.balance - b.balance)
  } else {
    sorted.sort((a, b) => b.interestRate - a.interestRate || a.balance - b.balance)
  }
  return sorted
}

/**
 * Simulates paying off all of `loans` in parallel: every active loan gets
 * its own minimum payment each month, and `extraMonthlyPayment` (plus the
 * minimum payments freed up by loans already paid off) is applied to
 * whichever active loan is highest-priority under `strategy`. This is the
 * standard snowball/avalanche definition — the "extra" cascades onto the
 * next loan the moment one is cleared, it doesn't wait for the whole debt
 * to be repaid loan-by-loan in sequence.
 */
export function simulate(
  loans: DebtPayoffLoanInput[],
  extraMonthlyPayment: number,
  strategy: PayoffStrategy
): DebtPayoffResult {
  const order = priorityOrder(loans, strategy)
  const balances = new Map(loans.map((l) => [l.id, l.balance]))
  const interestPaid = new Map(loans.map((l) => [l.id, 0]))
  const payoffMonth = new Map<string, number>()

  let month = 0
  let cumulativeFreedMinimums = 0
  const activeIds = new Set(loans.map((l) => l.id))

  while (activeIds.size > 0 && month < MAX_SIMULATION_MONTHS) {
    month++

    // Interest accrues on every active loan before payments are applied.
    for (const loan of order) {
      if (!activeIds.has(loan.id)) continue
      const monthlyRate = loan.interestRate / 12 / 100
      const balance = balances.get(loan.id)!
      const interest = balance * monthlyRate
      balances.set(loan.id, balance + interest)
      interestPaid.set(loan.id, interestPaid.get(loan.id)! + interest)
    }

    // The extra pool (manual extra + every previously-freed minimum
    // payment) cascades down the priority order within the same month:
    // whatever's left after clearing one loan rolls straight to the next
    // still-active loan, rather than being capped to "one loan per month."
    let remainingExtra = extraMonthlyPayment + cumulativeFreedMinimums

    for (const loan of order) {
      if (!activeIds.has(loan.id)) continue
      const balanceAfterInterest = balances.get(loan.id)!
      const minPayment = Math.min(balanceAfterInterest, loan.minPayment)
      let remainingBalance = balanceAfterInterest - minPayment

      if (remainingBalance > 0 && remainingExtra > 0) {
        const extraApplied = Math.min(remainingBalance, remainingExtra)
        remainingBalance -= extraApplied
        remainingExtra -= extraApplied
      }

      balances.set(loan.id, remainingBalance)

      if (remainingBalance <= 0) {
        activeIds.delete(loan.id)
        payoffMonth.set(loan.id, month)
        // This loan's minimum payment joins the pool starting next month —
        // it already contributed everything it could this month.
        cumulativeFreedMinimums += loan.minPayment
      }
    }
  }

  const neverPaysOff = activeIds.size > 0
  const perLoan: DebtPayoffLoanResult[] = order.map((loan) => ({
    id: loan.id,
    name: loan.name,
    payoffMonth: payoffMonth.get(loan.id) ?? month,
    totalInterestPaid: interestPaid.get(loan.id) ?? 0,
  }))

  return {
    strategy,
    order: order.map((l) => l.id),
    monthsToDebtFree: month,
    totalInterestPaid: perLoan.reduce((sum, l) => sum + l.totalInterestPaid, 0),
    perLoan,
    neverPaysOff,
  }
}

/** Builds simulation input from real Loan records — active loans only,
 * loans with no tracked interest rate simulate at 0%. */
export function toSimulationInput(loans: Loan[]): DebtPayoffLoanInput[] {
  return loans
    .filter((l) => l.status === 'active' && l.currentBalance > 0)
    .map((l) => ({
      id: l.id,
      name: l.loanName,
      balance: l.currentBalance,
      interestRate: l.interestRate ?? 0,
      minPayment: l.monthlyEMI,
    }))
}

/** Convenience: runs both strategies so callers can show a side-by-side
 * comparison without simulating twice manually. */
export function compareStrategies(
  loans: DebtPayoffLoanInput[],
  extraMonthlyPayment: number
): { snowball: DebtPayoffResult; avalanche: DebtPayoffResult } {
  return {
    snowball: simulate(loans, extraMonthlyPayment, 'snowball'),
    avalanche: simulate(loans, extraMonthlyPayment, 'avalanche'),
  }
}

export const DebtPayoffService = {
  simulate,
  toSimulationInput,
  compareStrategies,
}
