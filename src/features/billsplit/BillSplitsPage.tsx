import { useEffect, useMemo, useState } from 'react'
import { Users, Plus } from 'lucide-react'
import { useBillSplitsStore } from './billSplitsStore'
import { BillSplitService, computeSummary } from '@/services/BillSplitService'
import { BillSplitCard } from '@/components/finance/BillSplitCard'
import { BillSplitForm } from './BillSplitForm'
import { BottomSheet } from '@/components/layout/BottomSheet'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import type { BillSplit } from '@/types/entities'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export function BillSplitsPage() {
  const splits = useBillSplitsStore((s) => s.splits)
  const load = useBillSplitsStore((s) => s.load)

  const [showAdd, setShowAdd] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<BillSplit | null>(null)
  const { show } = useToast()

  useEffect(() => {
    load()
  }, [load])

  const totalOutstanding = useMemo(
    () => splits.reduce((sum, s) => sum + computeSummary(s).totalOutstanding, 0),
    [splits]
  )

  async function refresh() {
    await load()
  }

  async function handleSaved() {
    setShowAdd(false)
    await refresh()
    show('Split saved')
  }

  async function handleToggleSettled(splitId: string, participantId: string) {
    await BillSplitService.toggleSettled(splitId, participantId)
    await refresh()
  }

  async function handleDelete() {
    if (!confirmingDelete) return
    await BillSplitService.delete(confirmingDelete.id)
    setConfirmingDelete(null)
    await refresh()
    show('Split deleted')
  }

  if (splits.length === 0) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="No shared bills yet"
          description="Log an expense you paid for a group — split it evenly and track who's paid you back."
          actionLabel="Add a split"
          onAction={() => setShowAdd(true)}
        />
        <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="New Split">
          <BillSplitForm onSaved={handleSaved} onCancel={() => setShowAdd(false)} />
        </BottomSheet>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-text-primary">Bill Splits</h1>
        <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="size-16" aria-hidden="true" />
          Add
        </Button>
      </div>

      {totalOutstanding > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning-subtle p-16">
          <p className="text-caption text-text-tertiary">Total still owed to you</p>
          <p className="text-h2 font-semibold tabular-nums text-text-primary">
            {fmt(totalOutstanding)}
          </p>
        </div>
      )}

      <section className="flex flex-col gap-12">
        {splits.map((split) => (
          <BillSplitCard
            key={split.id}
            split={split}
            onToggleSettled={(participantId) => handleToggleSettled(split.id, participantId)}
            onDelete={() => setConfirmingDelete(split)}
          />
        ))}
      </section>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="New Split">
        <BillSplitForm onSaved={handleSaved} onCancel={() => setShowAdd(false)} />
      </BottomSheet>

      <ConfirmationDialog
        open={confirmingDelete !== null}
        title="Delete this split?"
        description="This removes the split and its settlement history — it won't affect any linked transaction."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(null)}
      />
    </div>
  )
}
