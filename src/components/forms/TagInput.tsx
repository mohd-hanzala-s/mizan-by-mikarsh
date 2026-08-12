import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { TagRepository } from '@/repositories/TagRepository'
import { cn } from '@/utils/cn'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
}

/** Chip-style tag input backed by TagRepository — reuses/dedupes existing
 * tag names case-insensitively (see TagRepository.findOrCreate) and
 * suggests existing tags as you type, but doesn't create anything in the
 * DB until the transaction itself is saved (this component just manages
 * the `tags: string[]` field's local value). */
export function TagInput({ value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    TagRepository.getAll().then((tags) => setAllTags(tags.map((t) => t.name)))
  }, [])

  const suggestions = useMemo(() => {
    if (!draft.trim()) return []
    const lower = draft.trim().toLowerCase()
    return allTags
      .filter((name) => name.toLowerCase().includes(lower))
      .filter((name) => !value.some((v) => v.toLowerCase() === name.toLowerCase()))
      .slice(0, 5)
  }, [draft, allTags, value])

  function commit(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, trimmed])
    setDraft('')
  }

  function remove(name: string) {
    onChange(value.filter((v) => v !== name))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-6 rounded-md border border-border bg-surface px-8 py-6">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-4 rounded-full bg-accent-muted px-10 py-4 text-body-sm font-medium text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full hover:bg-accent-muted"
            >
              <X className="size-12" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? 'Add a tag…' : ''}
          aria-label="Add a tag"
          className="min-w-[80px] flex-1 bg-transparent py-4 text-body-sm text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => commit(name)}
              className={cn(
                'rounded-full border border-border px-10 py-4 text-caption text-text-secondary',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
