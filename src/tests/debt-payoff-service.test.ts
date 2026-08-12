import { describe, it, expect } from 'vitest'
import { simulate, compareStrategies, type DebtPayoffLoanInput } from '@/services/DebtPayoffService'

describe('DebtPayoffService', () => {
  describe('simulate — snowball, no interest', () => {
    // Hand-verified scenario:
    // Loan A: balance 1000, min payment 100
    // Loan B: balance 2000, min payment 100
    // Extra: 50/mo. Snowball orders A first (smaller balance).
    // A clears in month 7 (needs 100+50=150/mo except the final month,
    // where only 100 is needed and the unused 50 cascades to B that same
    // month). B then gets its own min payment plus the regular extra
    // (50) plus A's freed min payment (100) = 250/mo from month 8 on,
    // clearing in month 12.
    const loans: DebtPayoffLoanInput[] = [
      { id: 'a', name: 'Loan A', balance: 1000, interestRate: 0, minPayment: 100 },
      { id: 'b', name: 'Loan B', balance: 2000, interestRate: 0, minPayment: 100 },
    ]

    it('orders loans smallest-balance-first', () => {
      const result = simulate(loans, 50, 'snowball')
      expect(result.order).toEqual(['a', 'b'])
    })

    it('pays off the smaller loan first, cascading freed payments', () => {
      const result = simulate(loans, 50, 'snowball')
      const a = result.perLoan.find((l) => l.id === 'a')!
      const b = result.perLoan.find((l) => l.id === 'b')!
      expect(a.payoffMonth).toBe(7)
      expect(b.payoffMonth).toBe(12)
      expect(result.monthsToDebtFree).toBe(12)
    })

    it('accrues no interest when rate is 0', () => {
      const result = simulate(loans, 50, 'snowball')
      expect(result.totalInterestPaid).toBe(0)
    })

    it('never reports neverPaysOff for a solvable schedule', () => {
      const result = simulate(loans, 50, 'snowball')
      expect(result.neverPaysOff).toBe(false)
    })
  })

  describe('simulate — avalanche prioritizes rate over balance', () => {
    const loans: DebtPayoffLoanInput[] = [
      { id: 'small-low-rate', name: 'Small, low rate', balance: 500, interestRate: 5, minPayment: 50 },
      { id: 'big-high-rate', name: 'Big, high rate', balance: 5000, interestRate: 24, minPayment: 100 },
    ]

    it('orders by highest interest rate first, regardless of balance', () => {
      const result = simulate(loans, 100, 'avalanche')
      expect(result.order).toEqual(['big-high-rate', 'small-low-rate'])
    })

    it('snowball orders the same loans by balance instead', () => {
      const result = simulate(loans, 100, 'snowball')
      expect(result.order).toEqual(['small-low-rate', 'big-high-rate'])
    })
  })

  describe('simulate — a loan whose minimum payment cannot cover interest', () => {
    it('reports neverPaysOff when no extra payment is applied', () => {
      // 24% APR = 2%/mo on a 10,000 balance is 200/mo interest — a 150/mo
      // minimum payment can never even cover the interest, let alone
      // reduce principal.
      const loans: DebtPayoffLoanInput[] = [
        { id: 'stuck', name: 'Stuck loan', balance: 10000, interestRate: 24, minPayment: 150 },
      ]
      const result = simulate(loans, 0, 'avalanche')
      expect(result.neverPaysOff).toBe(true)
    })

    it('resolves once enough extra payment is added', () => {
      const loans: DebtPayoffLoanInput[] = [
        { id: 'stuck', name: 'Stuck loan', balance: 10000, interestRate: 24, minPayment: 150 },
      ]
      const result = simulate(loans, 500, 'avalanche')
      expect(result.neverPaysOff).toBe(false)
      expect(result.monthsToDebtFree).toBeGreaterThan(0)
    })
  })

  describe('compareStrategies', () => {
    it('runs both strategies and returns comparable results', () => {
      const loans: DebtPayoffLoanInput[] = [
        { id: 'a', name: 'A', balance: 500, interestRate: 18, minPayment: 50 },
        { id: 'b', name: 'B', balance: 3000, interestRate: 8, minPayment: 100 },
      ]
      const { snowball, avalanche } = compareStrategies(loans, 100)
      expect(snowball.strategy).toBe('snowball')
      expect(avalanche.strategy).toBe('avalanche')
      // Avalanche should never pay strictly more total interest than
      // snowball for the same extra payment — that's the entire premise
      // of interest-first ordering.
      expect(avalanche.totalInterestPaid).toBeLessThanOrEqual(snowball.totalInterestPaid)
    })
  })
})
