import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/database/db'
import { CategorizationService } from '@/services/CategorizationService'
import {
  CATEGORY_KEYWORDS,
  CATEGORY_KIND_BY_ID,
  DEFAULT_CATEGORIES,
  INCOME_KEYWORDS,
  resolveCategoryKind,
  rollupCategoryId,
} from '@/constants/transactionCategories'

describe('category taxonomy', () => {
  it('preserves every original expense category id and marks salary as income', () => {
    const ids = new Set(DEFAULT_CATEGORIES.map((c) => c.id))
    for (const original of [
      'cat-food',
      'cat-fuel',
      'cat-shopping',
      'cat-utilities',
      'cat-food-delivery',
      'cat-health',
      'cat-entertainment',
      'cat-emi-loans',
      'cat-salary',
      'cat-transfers',
      'cat-other',
    ]) {
      expect(ids.has(original)).toBe(true)
    }
    expect(CATEGORY_KIND_BY_ID['cat-salary']).toBe('income')
    expect(CATEGORY_KIND_BY_ID['cat-food']).toBe('expense')
    expect(CATEGORY_KIND_BY_ID['cat-transfers']).toBe('transfer')
  })

  it('seeds the income taxonomy (Salary → … → Other Income)', () => {
    for (const id of [
      'cat-salary',
      'cat-bonus',
      'cat-freelance',
      'cat-business',
      'cat-investment',
      'cat-interest',
      'cat-dividend',
      'cat-rental',
      'cat-cashback',
      'cat-refund',
      'cat-gift',
      'cat-pension',
      'cat-gov-benefits',
      'cat-tax-refund',
      'cat-other-income',
    ]) {
      expect(CATEGORY_KIND_BY_ID[id]).toBe('income')
    }
  })

  it('attaches subcategories to their parent', () => {
    const foodRestaurants = DEFAULT_CATEGORIES.find((c) => c.id === 'cat-food-restaurants')
    expect(foodRestaurants?.parentCategory).toBe('cat-food')
    expect(foodRestaurants?.kind).toBe('expense')

    const salaryMonthly = DEFAULT_CATEGORIES.find((c) => c.id === 'cat-salary-monthly')
    expect(salaryMonthly?.parentCategory).toBe('cat-salary')
    expect(salaryMonthly?.kind).toBe('income')
  })

  it('rolls subcategory ids up to their top-level parent', () => {
    expect(rollupCategoryId('cat-food-restaurants')).toBe('cat-food')
    expect(rollupCategoryId('cat-food-groceries')).toBe('cat-food')
    expect(rollupCategoryId('cat-salary-monthly')).toBe('cat-salary')
    expect(rollupCategoryId('cat-investment-fd-interest')).toBe('cat-investment')
    expect(rollupCategoryId('cat-food')).toBe('cat-food')
    expect(rollupCategoryId('unknown-id')).toBe('unknown-id')
  })

  it('resolves kind defensively from the taxonomy map when the field is missing', () => {
    const legacyFood = { ...DEFAULT_CATEGORIES.find((c) => c.id === 'cat-food')!, kind: undefined }
    expect(resolveCategoryKind(legacyFood as never)).toBe('expense')
  })

  it('derives keywords and income signals from the shared taxonomy', () => {
    expect(CATEGORY_KEYWORDS['cat-food']).toContain('tea')
    expect(CATEGORY_KEYWORDS['cat-salary']).toContain('salary')
    expect(CATEGORY_KEYWORDS['cat-dividend']).toContain('dividend')
    expect(INCOME_KEYWORDS).toContain('salary')
    expect(INCOME_KEYWORDS).toContain('dividend')
  })
})

describe('type-aware CategorizationService', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('suggests an income category for an income kind', async () => {
    const suggestion = await CategorizationService.suggest('monthly salary', 'income')
    expect(suggestion.categoryId).toBe('cat-salary')
    expect(suggestion.source).toBe('keyword')
  })

  it('refuses to suggest an income category for an expense kind', async () => {
    const suggestion = await CategorizationService.suggest('monthly salary', 'expense')
    expect(suggestion.source).toBe('none')
  })

  it('still suggests expense categories for expense kind', async () => {
    const suggestion = await CategorizationService.suggest('evening tea', 'expense')
    expect(suggestion.categoryId).toBe('cat-food')
  })

  it('maps dividend to the standalone Dividend income category', async () => {
    const suggestion = await CategorizationService.suggest('quarterly dividend', 'income')
    expect(suggestion.categoryId).toBe('cat-dividend')
  })
})
