import { useState } from 'react'
import { InvestmentService } from '@/services/InvestmentService'
import { AccountSelector } from '@/components/forms/AccountSelector'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { Investment, InvestmentType } from '@/types/entities'

interface InvestmentFormProps {
  editing?: Investment
  onSaved: () => void
  onCancel: () => void
}

const TYPE_OPTIONS: { value: InvestmentType; label: string }[] = [
  { value: 'stock', label: 'Stock' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
  { value: 'other', label: 'Other' },
]

const numberInputClass =
  'min-h-touch w-full rounded-md border border-border bg-surface-card px-12 text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-income'

export function InvestmentForm({ editing, onSaved, onCancel }: InvestmentFormProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [type, setType] = useState<InvestmentType>(editing?.type ?? 'mutual_fund')
  const [units, setUnits] = useState<number | null>(editing?.units ?? null)
  const [avgCostPerUnit, setAvgCostPerUnit] = useState<number | null>(
    editing?.avgCostPerUnit ?? null
  )
  const [currentPricePerUnit, setCurrentPricePerUnit] = useState<number | null>(
    editing?.currentPricePerUnit ?? null
  )
  const [accountId, setAccountId] = useState<string | null>(editing?.accountId ?? null)
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = Boolean(name.trim() && units && units > 0 && avgCostPerUnit && avgCostPerUnit > 0)

  async function handleSave() {
    if (!canSave || !units || !avgCostPerUnit) return
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await InvestmentService.update(editing.id, {
          name,
          units,
          avgCostPerUnit,
          accountId,
          notes,
        })
      } else {
        await InvestmentService.create({
          name,
          type,
          units,
          avgCostPerUnit,
          currentPricePerUnit: currentPricePerUnit ?? avgCostPerUnit,
          accountId,
          notes,
        })
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this holding.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-20">
      <div className="flex flex-col gap-8">
        <span className="text-overline text-text-tertiary">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Nifty 50 Index Fund"
          aria-label="Investment name"
          autoFocus={!editing}
          className={numberInputClass}
        />
      </div>

      {!editing && (
        <div className="flex flex-col gap-8">
          <span className="text-overline text-text-tertiary">Type</span>
          <div role="radiogroup" aria-label="Investment type" className="flex flex-wrap gap-8">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={type === opt.value}
                onClick={() => setType(opt.value)}
                className={cn(
                  'min-h-touch rounded-full border px-16 text-body-sm font-medium transition-colors duration-fast',
                  type === opt.value
                    ? 'border-income bg-income-subtle text-income'
                    : 'border-border bg-surface-card text-text-secondary'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-12">
        <div className="flex flex-col gap-8">
          <span className="text-overline text-text-tertiary">
            {type === 'fixed_deposit' ? 'Units (use 1)' : 'Units'}
          </span>
          <input
            type="number"
            min={0}
            step="0.001"
            value={units ?? ''}
            onChange={(e) => setUnits(e.target.value ? Number(e.target.value) : null)}
            aria-label="Units"
            className={numberInputClass}
          />
        </div>
        <div className="flex flex-col gap-8">
          <span className="text-overline text-text-tertiary">Avg. cost / unit</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={avgCostPerUnit ?? ''}
            onChange={(e) => setAvgCostPerUnit(e.target.value ? Number(e.target.value) : null)}
            aria-label="Average cost per unit"
            className={numberInputClass}
          />
        </div>
      </div>

      {!editing && (
        <div className="flex flex-col gap-8">
          <span className="text-overline text-text-tertiary">
            Current price / unit (optional — defaults to cost)
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={currentPricePerUnit ?? ''}
            onChange={(e) => setCurrentPricePerUnit(e.target.value ? Number(e.target.value) : null)}
            aria-label="Current price per unit"
            className={numberInputClass}
          />
        </div>
      )}

      <div className="flex flex-col gap-8">
        <span className="text-overline text-text-tertiary">Linked account (optional)</span>
        <AccountSelector value={accountId} onChange={setAccountId} />
      </div>

      <div className="flex flex-col gap-8">
        <span className="text-overline text-text-tertiary">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          aria-label="Notes"
          className={cn(numberInputClass, 'py-8')}
        />
      </div>

      {error && <p className="text-body-sm text-expense">{error}</p>}

      <div className="flex justify-end gap-8">
        <Button variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!canSave} loading={saving}>
          {editing ? 'Save Changes' : 'Add Holding'}
        </Button>
      </div>
    </div>
  )
}
