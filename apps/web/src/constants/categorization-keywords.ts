/**
 * §6 Smart categorization priority: exact description match → favorite
 * match → learned historical match → keyword dictionary → AI suggestion →
 * manual selection.
 *
 * The keyword dictionary and income-signal words now live in the shared
 * category taxonomy (`@/constants/transactionCategories`), which is the
 * single source of truth for categories. This module re-exports them so
 * existing importers keep working unchanged.
 */
export { CATEGORY_KEYWORDS, INCOME_KEYWORDS } from '@/constants/transactionCategories'
