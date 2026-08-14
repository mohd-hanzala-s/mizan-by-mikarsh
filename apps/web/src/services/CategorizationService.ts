import { db } from '@/database/db'
import { CATEGORY_KEYWORDS, CATEGORY_KIND_BY_ID } from '@/constants/transactionCategories'
import { FavoriteRepository } from '@/repositories/FavoriteRepository'

export interface CategorySuggestion {
  categoryId: string
  /** 0–1. UI bands per §7: >0.9 auto-assign, 0.7–0.89 assign + confirm,
   * <0.7 ask the user outright. */
  confidence: number
  source: 'exact' | 'favorite' | 'historical' | 'keyword' | 'none'
}

/** The transaction type a suggestion should stay within. Pass it so an
 * income entry never suggests an expense category (and vice versa). */
type CategorySuggestionKind = 'income' | 'expense'

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2)
}

export const CategorizationService = {
  /**
   * Suggests a category for free-text `description`. Reads transaction
   * history directly (not through TransactionRepository) since it needs
   * every past description, not just the currently-visible list.
   */
  async suggest(description: string, kind?: CategorySuggestionKind): Promise<CategorySuggestion> {
    const target = normalize(description)
    if (!target) return { categoryId: '', confidence: 0, source: 'none' }

    const history = (await db.transactions.toArray()).filter((t) => !t.isDeleted)
    // When a type is requested, only history of that type can inform the
    // suggestion — an income entry must not be categorized from expense rows.
    const historyFor = kind ? history.filter((t) => t.type === kind) : history

    // 1. Exact description match — confidence reflects how consistently
    //    this exact text has mapped to one category historically.
    const exactMatches = historyFor.filter((t) => normalize(t.description) === target)
    if (exactMatches.length > 0) {
      const suggestion = topCategoryByFrequency(exactMatches)
      return { ...suggestion, source: 'exact' }
    }

    // 2. Favorite match.
    const favorite = await FavoriteRepository.findByTitle(description)
    if (favorite) {
      const favoriteKind = CATEGORY_KIND_BY_ID[favorite.categoryId]
      if (!kind || favoriteKind === kind) {
        return { categoryId: favorite.categoryId, confidence: 0.95, source: 'favorite' }
      }
    }

    // 3. Learned historical match — past transactions sharing at least one
    //    significant token with this description.
    const targetTokens = new Set(tokenize(description))
    if (targetTokens.size > 0) {
      const related = historyFor.filter((t) =>
        tokenize(t.description).some((tok) => targetTokens.has(tok))
      )
      if (related.length > 0) {
        const suggestion = topCategoryByFrequency(related)
        // Historical matches are fuzzier than exact ones — cap confidence
        // so they land in the "assign + confirm" band unless overwhelming.
        return {
          ...suggestion,
          confidence: Math.min(suggestion.confidence, 0.88),
          source: 'historical',
        }
      }
    }

    // 4. Keyword dictionary, filtered to the requested type so an expense
    //    term can never suggest an income category (or vice versa).
    for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (kind && CATEGORY_KIND_BY_ID[categoryId] !== kind) continue
      if (keywords.some((kw) => target.includes(kw))) {
        return { categoryId, confidence: 0.65, source: 'keyword' }
      }
    }

    // 5. No match — manual selection (§6's "AI suggestion" tier is
    //    intentionally not implemented; see file header).
    return { categoryId: '', confidence: 0, source: 'none' }
  },
}

function topCategoryByFrequency(matches: { categoryId: string }[]): {
  categoryId: string
  confidence: number
} {
  const counts = new Map<string, number>()
  for (const m of matches) counts.set(m.categoryId, (counts.get(m.categoryId) ?? 0) + 1)
  const [topCategoryId, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return { categoryId: topCategoryId, confidence: topCount / matches.length }
}
