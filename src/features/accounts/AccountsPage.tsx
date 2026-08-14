import { useEffect, useState } from 'react'
import { useNavigate, useParams, Outlet } from 'react-router-dom'
import { Plus, ArchiveRestore, Wallet } from 'lucide-react'
import { useAccountsStore } from './accountsStore'
import { AccountForm } from './AccountForm'
import { AccountCard } from '@/components/finance/AccountCard'
import { BottomSheet } from '@/components/layout/BottomSheet'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { AccountService } from '@/services/AccountService'
import { EmptyAccountsIllustration } from '@/components/common/Illustrations'
import { cn } from '@/utils/cn'

export function AccountsPage() {
  const accounts = useAccountsStore((s) => s.accounts)
  const archivedAccounts = useAccountsStore((s) => s.archivedAccounts)
  const load = useAccountsStore((s) => s.load)
  const [addOpen, setAddOpen] = useState(false)
  const navigate = useNavigate()
  // Nested route (see routes/router.tsx: /accounts/:id renders under
  // /accounts) — React Router v6 merges descendant route params into the
  // parent's useParams(), so this picks up the child's :id without any
  // extra plumbing.
  const { id: selectedId } = useParams<{ id?: string }>()

  useEffect(() => {
    load()
  }, [load])

  async function handleUnarchive(id: string) {
    await AccountService.unarchive(id)
    load()
  }

  const listColumn = (
    <div
      className={cn(
        'flex flex-col gap-24 p-16 md:p-24 lg:w-[380px] lg:shrink-0 lg:border-r lg:border-border lg:p-24',
        // On phone/tablet widths, viewing a specific account replaces the
        // list entirely (standard mobile drill-down). At lg+ (see the
        // master-detail layout below) both columns show at once, so the
        // list never hides there regardless of selection.
        selectedId && 'hidden lg:flex'
      )}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-h2 text-text-primary">Accounts</h1>
        <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-16" aria-hidden="true" /> Add
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          illustration={<EmptyAccountsIllustration size={140} />}
          title="No accounts yet"
          description="Add an account to start tracking balances."
          actionLabel="Add an account"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => navigate(`/accounts/${account.id}`)}
            />
          ))}
        </div>
      )}

      {archivedAccounts.length > 0 && (
        <div className="flex flex-col gap-8">
          <h2 className="text-overline text-text-tertiary">Archived</h2>
          {archivedAccounts.map((account) => (
            <div
              key={account.id}
              className="flex min-h-touch items-center gap-12 rounded-md border border-border-subtle bg-surface px-16 py-12 opacity-70"
            >
              <span className="min-w-0 flex-1 truncate text-body text-text-secondary">
                {account.name}
              </span>
              <button
                type="button"
                onClick={() => handleUnarchive(account.id)}
                className="flex min-h-touch items-center gap-4 text-body-sm font-medium text-income"
              >
                <ArchiveRestore className="size-16" aria-hidden="true" /> Restore
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add Account">
        <AccountForm
          onSaved={() => {
            setAddOpen(false)
            load()
          }}
          onCancel={() => setAddOpen(false)}
        />
      </BottomSheet>
    </div>
  )

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {listColumn}

      {/* Detail column. At lg+, this sits beside the list (master-detail).
          Below lg, there's no room for both — so it only renders when a
          specific account is selected (drill-down replaces the list, full
          width), and stays hidden otherwise since there'd be nothing
          meaningful to show next to a list that's already visible. */}
      <div className={cn('flex-1', selectedId ? 'flex' : 'hidden lg:flex')}>
        {selectedId ? (
          <Outlet />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-8 p-24 text-center">
            <Wallet className="size-40 text-text-tertiary/50" aria-hidden="true" />
            <p className="text-body-sm text-text-tertiary">
              Select an account to see its balance and transaction history.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
