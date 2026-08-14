import type { CategoryKind } from '@/types/entities'

/**
 * The single source of truth for the category taxonomy (§ latest category
 * spec): manual entry, Smart Entry, Command Center, budgets, recurring
 * rules, reports and imports all derive their options from these defs.
 *
 * A `CategoryDef` is a top-level category plus optional subcategories. The
 * flattened `Category[]` (see `./index.ts`) seeds IndexedDB; `kind` is
 * carried on every row so the UI can filter by transaction type.
 */
export interface CategoryDef {
  id: string
  name: string
  icon: string
  color: string
  kind: CategoryKind
  /** Keyword-dictionary terms for `CategorizationService` (top-level only —
   * subcategories are chosen manually, never auto-suggested). */
  keywords: string[]
  subcategories?: CategoryDef[]
}
