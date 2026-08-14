import { useState } from 'react'
import type { DateRange } from '@/components/forms/DateRangeFilter'
import type { SortState } from '@/components/forms/SortControl'
import type { TypeFilter } from '@/components/forms/FilterBar'

export interface SavedFilter {
  id: string
  name: string
  query: string
  typeFilter: TypeFilter
  categoryIds: string[]
  dateRange: DateRange
  sort: SortState
  createdAt: string
}

const STORAGE_KEY = 'mizan-saved-filters'
const MAX_SAVED = 10

export function loadSavedFilters(): SavedFilter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveFilter(filter: SavedFilter): void {
  try {
    const existing = loadSavedFilters()
    const updated = [filter, ...existing.filter((f) => f.name !== filter.name)].slice(0, MAX_SAVED)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage not available
  }
}

export function deleteSavedFilter(id: string): void {
  try {
    const existing = loadSavedFilters()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((f) => f.id !== id)))
  } catch {
    // localStorage not available
  }
}

interface FilterState {
  query: string
  typeFilter: TypeFilter
  categoryIds: string[]
  dateRange: DateRange
  sort: SortState
}

export function useSavedFilters(
  currentFilters: FilterState,
  onApply: (filter: SavedFilter) => void
) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(loadSavedFilters)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newName, setNewName] = useState('')

  function handleSave() {
    if (!newName.trim()) return
    const filter: SavedFilter = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      query: currentFilters.query,
      typeFilter: currentFilters.typeFilter,
      categoryIds: [...currentFilters.categoryIds],
      dateRange: { ...currentFilters.dateRange },
      sort: { ...currentFilters.sort },
      createdAt: new Date().toISOString(),
    }
    saveFilter(filter)
    setSavedFilters(loadSavedFilters())
    setNewName('')
    setShowSaveDialog(false)
  }

  function handleDelete(id: string) {
    deleteSavedFilter(id)
    setSavedFilters(loadSavedFilters())
  }

  function handleApply(filter: SavedFilter) {
    onApply(filter)
  }

  return {
    savedFilters,
    showSaveDialog,
    setShowSaveDialog,
    newName,
    setNewName,
    handleSave,
    handleDelete,
    handleApply,
  }
}
