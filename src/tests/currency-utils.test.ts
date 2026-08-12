import { describe, it, expect } from 'vitest'
import { formatAmount, currencySymbol, haveSameCurrency } from '@/utils/currency'

describe('currency utils', () => {
  describe('currencySymbol', () => {
    it('returns known symbols', () => {
      expect(currencySymbol('INR')).toBe('₹')
      expect(currencySymbol('USD')).toBe('$')
      expect(currencySymbol('EUR')).toBe('€')
    })

    it('falls back to the ISO code for unknown currencies', () => {
      expect(currencySymbol('XYZ')).toBe('XYZ ')
    })
  })

  describe('formatAmount', () => {
    it('formats INR with en-IN grouping by default', () => {
      expect(formatAmount(1234567)).toBe('₹12,34,567')
    })

    it('formats USD with en-US (thousands) grouping', () => {
      expect(formatAmount(1234567, 'USD')).toBe('$1,234,567')
    })

    it('rounds to whole units', () => {
      expect(formatAmount(99.6, 'USD')).toBe('$100')
    })
  })

  describe('haveSameCurrency', () => {
    it('is true for an empty list', () => {
      expect(haveSameCurrency([])).toBe(true)
    })

    it('is true when every currency matches', () => {
      expect(haveSameCurrency(['INR', 'INR', 'INR'])).toBe(true)
    })

    it('is false when currencies differ', () => {
      expect(haveSameCurrency(['INR', 'USD'])).toBe(false)
    })
  })
})
