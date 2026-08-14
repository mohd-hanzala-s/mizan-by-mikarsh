import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { BillSplitService, splitEqually } from '@/services/BillSplitService'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

interface BillSplitFormProps {
  onSaved: () => void
  onCancel: () => void
}

const inputClass =
  'min-h-touch w-full rounded-md border border-border bg-surface-card px-12 text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-income'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export function BillSplitForm({ onSaved, onCancel }: BillSplitFormProps) {
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState<number | null>(null)
  const [participantNames, setParticipantNames] = useState<string[]>([''])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedNames = participantNames.map((n) => n.trim()).filter(Boolean)
  const canSave = Boolean(
    description.trim() && totalAmount && totalAmount > 0 && trimmedNames.length > 0
  )
  const preview =
    totalAmount && trimmedNames.length > 0 ? splitEqually(totalAmount, trimmedNames) : []
  const payerShare = totalAmount ? totalAmount - preview.reduce((s, p) => s + p.shareAmount, 0) : 0

  function updateName(index: number, value: string) {
    setParticipantNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  function addParticipant() {
    setParticipantNames((prev) => [...prev, ''])
  }

  function removeParticipant(index: number) {
    setParticipantNames((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!canSave || !totalAmount) return
    setSaving(true)
    setError(null)
    try {
      await BillSplitService.create({
        description,
        totalAmount,
        participantNames: trimmedNames,
        notes,
      })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this split.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-20">
      <div className="flex flex-col gap-8">
        <span className="text-overline text-text-tertiary">What was it for?</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Dinner at Cafe Blue"
          aria-label="Description"
          autoFocus
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-8">
        <span className="text-overline text-text-tertiary">Total bill amount</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={totalAmount ?? ''}
          onChange={(e) => setTotalAmount(e.target.value ? Number(e.target.value) : null)}
          aria-label="Total amount"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <span className="text-overline text-text-tertiary">
            Split with (you&rsquo;re already counted)
          </span>
          <button
            type="button"
            onClick={addParticipant}
            aria-label="Add another person"
            className="flex items-center gap-4 text-body-sm font-medium text-brand-teal900"
          >
            <Plus className="size-14" aria-hidden="true" /> Add person
          </button>
        </div>
        {participantNames.map((name, i) => (
          <div key={i} className="flex items-center gap-8">
            <input
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder={`Person ${i + 1}`}
              aria-label={`Participant ${i + 1} name`}
              className={inputClass}
            />
            {participantNames.length > 1 && (
              <button
                type="button"
                onClick={() => removeParticipant(i)}
                aria-label={`Remove person ${i + 1}`}
                className="flex size-32 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="size-16" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>

      {preview.length > 0 && totalAmount && (
        <div className="flex flex-col gap-6 rounded-md border border-border-subtle bg-surface p-12">
          <p className="text-caption text-text-tertiary">Split preview (equal shares)</p>
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-text-secondary">You</span>
            <span className={cn('tabular-nums font-medium text-text-primary')}>
              {fmt(payerShare)}
            </span>
          </div>
          {preview.map((p) => (
            <div key={p.name} className="flex items-center justify-between text-body-sm">
              <span className="text-text-secondary">{p.name}</span>
              <span className="tabular-nums font-medium text-text-primary">
                {fmt(p.shareAmount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-8">
        <span className="text-overline text-text-tertiary">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          aria-label="Notes"
          className={cn(inputClass, 'py-8')}
        />
      </div>

      {error && <p className="text-body-sm text-expense">{error}</p>}

      <div className="flex justify-end gap-8">
        <Button variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!canSave} loading={saving}>
          Save Split
        </Button>
      </div>
    </div>
  )
}
