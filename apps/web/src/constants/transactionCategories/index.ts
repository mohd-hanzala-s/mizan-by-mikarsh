import type { Category, CategoryKind } from '@/types/entities'
import { EXPENSE_CATEGORY_DEFS } from './expense'
import { INCOME_CATEGORY_DEFS } from './income'
import type { CategoryDef } from './types'

/**
 * Shared category taxonomy — the single source of truth for every place the
 * app needs a category: IndexedDB seeding (`DEFAULT_CATEGORIES`), Smart
 * Entry parsing, categorization, the Command Center, budgets/recurring and
 * reports/imports. Adding or editing a category is a one-file change here;
 * everything else reads from the flattened `DEFAULT_CATEGORIES` or the
 * derived `CATEGORY_KEYWORDS` / `CATEGORY_KIND_BY_ID` maps.
 */

const TRANSFER_CATEGORY_DEF: CategoryDef = {
  id: 'cat-transfers',
  name: 'Transfers',
  icon: 'ArrowLeftRight',
  color: '#3B82F6',
  kind: 'transfer',
  keywords: ['transfer', 'sent to', 'received from'],
}

const ALL_TOP_LEVEL_DEFS: CategoryDef[] = [
  ...EXPENSE_CATEGORY_DEFS,
  ...INCOME_CATEGORY_DEFS,
  TRANSFER_CATEGORY_DEF,
]

const now = () => new Date().toISOString()

function toCategory(
  def: CategoryDef,
  parentCategory: string | null,
  displayOrder: number
): Category {
  return {
    id: def.id,
    name: def.name,
    icon: def.icon,
    color: def.color,
    kind: def.kind,
    parentCategory,
    displayOrder,
    isDefault: true,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
  }
}

/** Flattened seed rows: all top-level categories first (expense, then
 * income, then the transfer sentinel), then every subcategory after — so any
 * flat sort keeps subcategories out of the top-level group. */
export const DEFAULT_CATEGORIES: Category[] = (() => {
  const rows: Category[] = []
  let order = 0
  for (const def of ALL_TOP_LEVEL_DEFS) rows.push(toCategory(def, null, order++))
  for (const def of ALL_TOP_LEVEL_DEFS) {
    for (const sub of def.subcategories ?? []) rows.push(toCategory(sub, def.id, order++))
  }
  return rows
})()

/** categoryId → kind, for every row (top-level and subcategory). Used by the
 * migration to backfill `kind` on pre-existing rows, by `CategorizationService`
 * to keep suggestions within the requested transaction type, and defensively
 * by `resolveCategoryKind`. */
export const CATEGORY_KIND_BY_ID: Record<string, CategoryKind> = (() => {
  const map: Record<string, CategoryKind> = {}
  for (const cat of DEFAULT_CATEGORIES) map[cat.id] = cat.kind
  return map
})()

/** subcategoryId → immediate parentId. Feeds `rollupCategoryId` so
 * subcategory transactions roll up into their parent for reports, budgets
 * and insights. */
const CATEGORY_PARENT_BY_ID: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const cat of DEFAULT_CATEGORIES) {
    if (cat.parentCategory) map[cat.id] = cat.parentCategory
  }
  return map
})()

/** Resolves a category id to its top-level ancestor (or itself when it is
 * already top-level / unknown), so subcategory spend aggregates under the
 * parent in analysis. */
export function rollupCategoryId(categoryId: string): string {
  const seen = new Set<string>()
  let cur = categoryId
  while (CATEGORY_PARENT_BY_ID[cur] && !seen.has(cur)) {
    seen.add(cur)
    cur = CATEGORY_PARENT_BY_ID[cur]
  }
  return cur
}

/** The category's kind, falling back to the static taxonomy map when a row
 * predates the `kind` field. */
export function resolveCategoryKind(category: Category): CategoryKind {
  return category.kind ?? CATEGORY_KIND_BY_ID[category.id] ?? 'expense'
}

/** Description → category keyword dictionary for `CategorizationService`
 * (top-level categories only — subcategories are never auto-suggested). */
export const CATEGORY_KEYWORDS: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {}
  for (const def of [...EXPENSE_CATEGORY_DEFS, ...INCOME_CATEGORY_DEFS]) {
    if (def.keywords.length > 0) map[def.id] = def.keywords
  }
  return map
})()

/** Words that flip the inferred transaction type from expense to income in
 * Smart Entry free text (e.g. "5000 salary received"). A curated superset of
 * the income taxonomy's vocabulary — signals that read unambiguously as
 * money coming in. */
export const INCOME_KEYWORDS = [
  'salary',
  'received',
  'credited',
  'income',
  'bonus',
  'cashback',
  'dividend',
  'interest',
  'pension',
  'refund',
  'stipend',
  'reimbursement',
  'freelance',
]
