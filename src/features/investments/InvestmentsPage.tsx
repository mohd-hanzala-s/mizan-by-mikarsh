import { useEffect, useState } from 'react'
import { TrendingUp, Plus } from 'lucide-react'
import { useInvestmentsStore } from './investmentsStore'
import { InvestmentService, computePortfolioSummary } from '@/services/InvestmentService'
import { InvestmentCard } from '@/components/finance/InvestmentCard'
import { InvestmentForm } from './InvestmentForm'
import { BottomSheet } from '@/components/layout/BottomSheet'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import type { Investment } from '@/types/entities'

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

type Sheet = { kind: 'add' } | { kind: 'edit'; investment: Investment }

export function InvestmentsPage() {
  const investments = useInvestmentsStore((s) => s.investments)
  const load = useInvestmentsStore((s) => s.load)

  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [priceEditing, setPriceEditing] = useState<Investment | null>(null)
  const [priceDraft, setPriceDraft] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState<Investment | null>(null)
  const { show } = useToast()

  useEffect(() => {
    load()
  }, [load])

  const activeHoldings = investments.filter((i) => i.status === 'active')
  const soldHoldings = investments.filter((i) => i.status === 'sold')
  const summary = computePortfolioSummary(activeHoldings)

  async function refresh() {
    await load()
  }

  async function handleSaved() {
    setSheet(null)
    await refresh()
    show(sheet?.kind === 'edit' ? 'Holding updated' : 'Holding added')
  }

  async function handleDelete() {
    if (!confirmingDelete) return
    await InvestmentService.delete(confirmingDelete.id)
    setConfirmingDelete(null)
    await refresh()
    show('Holding deleted')
  }

  async function handleSavePrice() {
    if (!priceEditing) return
    const price = Number(priceDraft)
    if (!(price > 0)) return
    await InvestmentService.updatePrice(priceEditing.id, price)
    setPriceEditing(null)
    setPriceDraft('')
    await refresh()
    show('Price updated')
  }

  if (investments.length === 0) {
    return (
      <>
        <EmptyState
          icon={TrendingUp}
          title="No investments yet"
          description="Track stocks, mutual funds, and fixed deposits — log what you paid and what they're worth now to see gains and losses at a glance."
          actionLabel="Add a holding"
          onAction={() => setSheet({ kind: 'add' })}
        />
        <BottomSheet open={sheet !== null} onClose={() => setSheet(null)} title="New Holding">
          {sheet?.kind === 'add' && (
            <InvestmentForm onSaved={handleSaved} onCancel={() => setSheet(null)} />
          )}
        </BottomSheet>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-text-primary">Investments</h1>
        <Button variant="secondary" size="sm" onClick={() => setSheet({ kind: 'add' })}>
          <Plus className="size-16" aria-hidden="true" />
          Add
        </Button>
      </div>

      {activeHoldings.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-card p-16">
          <p className="text-overline text-text-tertiary">Portfolio</p>
          <div className="mt-8 grid grid-cols-3 gap-12">
            <div>
              <p className="text-caption text-text-tertiary">Invested</p>
              <p className="text-h3 font-semibold tabular-nums text-text-primary">
                {fmt(summary.investedValue)}
              </p>
            </div>
            <div>
              <p className="text-caption text-text-tertiary">Current</p>
              <p className="text-h3 font-semibold tabular-nums text-text-primary">
                {fmt(summary.currentValue)}
              </p>
            </div>
            <div>
              <p className="text-caption text-text-tertiary">Gain/Loss</p>
              <p
                className={cn(
                  'text-h3 font-semibold tabular-nums',
                  summary.gainLoss >= 0 ? 'text-income' : 'text-expense'
                )}
              >
                {summary.gainLoss >= 0 ? '+' : '−'}
                {fmt(Math.abs(summary.gainLoss))}
                {summary.gainLossPercent !== null &&
                  ` (${summary.gainLossPercent >= 0 ? '+' : ''}${summary.gainLossPercent.toFixed(1)}%)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeHoldings.length > 0 && (
        <section className="flex flex-col gap-12">
          <h2 className="text-overline text-text-tertiary">Holdings</h2>
          {activeHoldings.map((inv) => (
            <InvestmentCard
              key={inv.id}
              investment={inv}
              onEdit={() => setSheet({ kind: 'edit', investment: inv })}
              onUpdatePrice={() => {
                setPriceEditing(inv)
                setPriceDraft(String(inv.currentPricePerUnit))
              }}
              onDelete={() => setConfirmingDelete(inv)}
            />
          ))}
        </section>
      )}

      {soldHoldings.length > 0 && (
        <section className="flex flex-col gap-12">
          <h2 className="text-overline text-text-tertiary">Sold</h2>
          {soldHoldings.map((inv) => (
            <InvestmentCard
              key={inv.id}
              investment={inv}
              onEdit={() => setSheet({ kind: 'edit', investment: inv })}
              onUpdatePrice={() => {
                setPriceEditing(inv)
                setPriceDraft(String(inv.currentPricePerUnit))
              }}
              onDelete={() => setConfirmingDelete(inv)}
            />
          ))}
        </section>
      )}

      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.kind === 'edit' ? 'Edit Holding' : 'New Holding'}
      >
        {sheet?.kind === 'add' && (
          <InvestmentForm onSaved={handleSaved} onCancel={() => setSheet(null)} />
        )}
        {sheet?.kind === 'edit' && (
          <InvestmentForm
            editing={sheet.investment}
            onSaved={handleSaved}
            onCancel={() => setSheet(null)}
          />
        )}
      </BottomSheet>

      <BottomSheet
        open={priceEditing !== null}
        onClose={() => setPriceEditing(null)}
        title="Update Price"
      >
        {priceEditing && (
          <div className="flex flex-col gap-16">
            <p className="text-body-sm text-text-secondary">
              Current price per unit for {priceEditing.name}
            </p>
            <input
              type="number"
              min={0}
              step="0.01"
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              autoFocus
              aria-label="Current price per unit"
              className="min-h-touch w-full rounded-md border border-border bg-surface-card px-12 text-body text-text-primary outline-none focus:border-income"
            />
            <div className="flex justify-end gap-8">
              <Button variant="tertiary" onClick={() => setPriceEditing(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSavePrice}
                disabled={!(Number(priceDraft) > 0)}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      <ConfirmationDialog
        open={confirmingDelete !== null}
        title="Delete this holding?"
        description="This permanently removes the holding and its cost/price history."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(null)}
      />
    </div>
  )
}
