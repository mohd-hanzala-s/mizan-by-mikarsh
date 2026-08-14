import { useEffect, useMemo, useState } from 'react'
import { db } from '@/database/db'
import type { Category } from '@/types/entities'
import { resolveCategoryKind } from '@/constants/transactionCategories'
import { DynamicIcon } from '@/components/common/DynamicIcon'
import { cn } from '@/utils/cn'

interface CategorySelectorProps {
  value: string | null
  onChange: (categoryId: string) => void
  /** Category the categorization engine suggested, if any — shown with a
   * subtle "Suggested" badge so the user can see and correct it (§3
   * SmartEntryInput: "live parsing feedback and manual correction"). */
  suggestedCategoryId?: string | null
  /** Transaction type being entered — only categories of this kind (and
   * their subcategories) are offered, so an expense entry can never select
   * an income category and vice versa. */
  type: 'income' | 'expense'
}

export function CategorySelector({
  value,
  onChange,
  suggestedCategoryId,
  type,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    db.categories
      .toArray()
      .then((all) =>
        setCategories(
          all.filter((c) => !c.isArchived).sort((a, b) => a.displayOrder - b.displayOrder)
        )
      )
  }, [])

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  // Top-level categories matching the requested type, plus their children.
  const topLevels = useMemo(
    () => categories.filter((c) => !c.parentCategory && resolveCategoryKind(c) === type),
    [categories, type]
  )

  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parentCategory === parentId && !c.isArchived)

  // Which top-level category is currently active (either selected directly,
  // or the parent of the selected subcategory).
  const activeTopId = useMemo(() => {
    if (!value) return null
    const seen = new Set<string>()
    let cur = byId.get(value)
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id)
      if (!cur.parentCategory) return cur.id
      cur = byId.get(cur.parentCategory)
    }
    return null
  }, [value, byId])

  const activeSubcategories = activeTopId ? childrenOf(activeTopId) : []

  return (
    <div className="flex flex-col gap-12">
      <div role="radiogroup" aria-label="Category" className="grid grid-cols-4 gap-8">
        {topLevels.map((category) => {
          const selected = value === category.id
          const suggested = !selected && suggestedCategoryId === category.id

          return (
            <button
              key={category.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(category.id)}
              className={cn(
                'flex min-h-touch flex-col items-center gap-4 rounded-md border p-8 text-center transition-colors duration-fast',
                selected
                  ? 'border-income bg-income-subtle'
                  : suggested
                    ? 'border-dashed border-income/60'
                    : 'border-border bg-surface-card hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              <span
                className="flex size-40 items-center justify-center rounded-full"
                style={{ backgroundColor: `${category.color}1A`, color: category.color }}
              >
                <DynamicIcon name={category.icon} className="size-20" />
              </span>
              <span className="text-caption text-text-secondary">{category.name}</span>
            </button>
          )
        })}
      </div>

      {activeSubcategories.length > 0 && (
        <div role="radiogroup" aria-label="Subcategory" className="flex flex-wrap gap-8">
          <SubcategoryChip
            name={byId.get(activeTopId!)?.name ?? 'General'}
            selected={value === activeTopId}
            onClick={() => onChange(activeTopId!)}
          />
          {activeSubcategories.map((sub) => (
            <SubcategoryChip
              key={sub.id}
              name={sub.name}
              selected={value === sub.id}
              onClick={() => onChange(sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubcategoryChip({
  name,
  selected,
  onClick,
}: {
  name: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'min-h-touch rounded-full border px-16 py-8 text-body-sm font-medium transition-colors duration-fast',
        selected
          ? 'border-income bg-income-subtle text-income'
          : 'border-border bg-surface-card text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800'
      )}
    >
      {name}
    </button>
  )
}
