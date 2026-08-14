import type { CategoryDef } from './types'

/**
 * Expense taxonomy — preserved exactly from the original Phase 0 seed
 * (same ids, names, icons, colors, ordering) so existing transactions and
 * the categorization keyword dictionary keep resolving identically. Two
 * illustrative subcategories (Food → Groceries/Restaurants) demonstrate the
 * optional two-level selection.
 */
export const EXPENSE_CATEGORY_DEFS: CategoryDef[] = [
  {
    id: 'cat-food',
    name: 'Food',
    icon: 'UtensilsCrossed',
    color: '#EA580C',
    kind: 'expense',
    keywords: [
      'tea',
      'coffee',
      'lunch',
      'dinner',
      'breakfast',
      'restaurant',
      'cafe',
      'snack',
      'chai',
    ],
    subcategories: [
      {
        id: 'cat-food-groceries',
        name: 'Groceries',
        icon: 'ShoppingBasket',
        color: '#EA580C',
        kind: 'expense',
        keywords: [],
      },
      {
        id: 'cat-food-restaurants',
        name: 'Restaurants',
        icon: 'UtensilsCrossed',
        color: '#EA580C',
        kind: 'expense',
        keywords: [],
      },
    ],
  },
  {
    id: 'cat-fuel',
    name: 'Fuel',
    icon: 'Fuel',
    color: '#0891B2',
    kind: 'expense',
    keywords: ['petrol', 'diesel', 'fuel', 'gas station', 'cng'],
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#DB2777',
    kind: 'expense',
    keywords: ['amazon', 'flipkart', 'myntra', 'mall', 'clothes', 'shoes', 'shopping'],
  },
  {
    id: 'cat-utilities',
    name: 'Utilities',
    icon: 'Zap',
    color: '#65A30D',
    kind: 'expense',
    keywords: ['electricity', 'water bill', 'gas bill', 'wifi', 'broadband', 'recharge', 'dth'],
  },
  {
    id: 'cat-food-delivery',
    name: 'Food Delivery',
    icon: 'Bike',
    color: '#C026D3',
    kind: 'expense',
    keywords: ['zomato', 'swiggy', 'food delivery', 'delivery'],
  },
  {
    id: 'cat-health',
    name: 'Health',
    icon: 'HeartPulse',
    color: '#DC2626',
    kind: 'expense',
    keywords: ['pharmacy', 'medicine', 'doctor', 'hospital', 'clinic', 'medical'],
  },
  {
    id: 'cat-entertainment',
    name: 'Entertainment',
    icon: 'Film',
    color: '#4F46E5',
    kind: 'expense',
    keywords: ['movie', 'netflix', 'spotify', 'prime video', 'concert', 'game'],
  },
  {
    id: 'cat-emi-loans',
    name: 'EMI/Loans',
    icon: 'Landmark',
    color: '#8B5CF6',
    kind: 'expense',
    keywords: ['emi', 'loan', 'installment'],
  },
  {
    id: 'cat-other',
    name: 'Other',
    icon: 'MoreHorizontal',
    color: '#78716C',
    kind: 'expense',
    keywords: [],
  },
]
