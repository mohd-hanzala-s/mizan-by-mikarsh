import type { Category } from '@/types/entities'
import { cn } from '@/utils/cn'

export type TypeFilter = 'all' | 'expense' | 'income' | 'transfer'

interface FilterBarProps {
  typeFilter: TypeFilter
  onTypeFilterChange: (value: TypeFilter) => void
  categories: Category[]
  selectedCategoryIds: Set<string>
  onToggleCategory: (categoryId: string) => void
  availableTags?: string[]
  selectedTags?: Set<string>
  onToggleTag?: (tag: string) => void
}

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
]

export function FilterBar({
  typeFilter,
  onTypeFilterChange,
  categories,
  selectedCategoryIds,
  onToggleCategory,
  availableTags = [],
  selectedTags = new Set(),
  onToggleTag,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6 overflow-x-auto">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={typeFilter === opt.value}
            onClick={() => onTypeFilterChange(opt.value)}
            className={cn(
              'min-h-touch shrink-0 rounded-full px-14 text-body-sm font-medium transition-all duration-fast',
              typeFilter === opt.value
                ? 'bg-income-subtle text-income shadow-pressed'
                : 'bg-surface text-text-secondary shadow-sm hover:shadow-pressed'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex gap-6 overflow-x-auto">
        {categories.map((category) => {
          const selected = selectedCategoryIds.has(category.id)
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggleCategory(category.id)}
              className={cn(
                'min-h-touch shrink-0 rounded-full px-14 text-body-sm font-medium transition-all duration-fast',
                selected
                  ? 'bg-income-subtle text-income shadow-pressed'
                  : 'bg-surface text-text-secondary shadow-sm hover:shadow-pressed'
              )}
            >
              {category.name}
            </button>
          )
        })}
      </div>
      {availableTags.length > 0 && onToggleTag && (
        <div className="flex gap-6 overflow-x-auto" aria-label="Filter by tag">
          {availableTags.map((tag) => {
            const selected = selectedTags.has(tag)
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggleTag(tag)}
                className={cn(
                  'min-h-touch shrink-0 rounded-full px-14 text-body-sm font-medium transition-all duration-fast',
                  selected
                    ? 'bg-accent-muted text-accent shadow-pressed'
                    : 'bg-surface text-text-secondary shadow-sm hover:shadow-pressed'
                )}
              >
                #{tag}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
