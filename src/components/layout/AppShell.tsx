import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import { NavigationRail } from './NavigationRail'
import { BottomNavigation } from './BottomNavigation'
import { TopAppBar } from './TopAppBar'
import { FloatingActionButton } from './FloatingActionButton'
import { BottomSheet } from './BottomSheet'
import { Toast } from '@/components/common/Toast'
import { useToast } from '@/hooks/useToast'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useTransactionsStore } from '@/features/transactions/transactionsStore'
import { TransactionEntrySheet } from '@/features/transactions/TransactionEntrySheet'
import { RecurringService } from '@/services/RecurringService'
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal'

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false)
  const { message, show } = useToast()
  const { isInstallable, promptInstall } = useInstallPrompt()
  const navigate = useNavigate()

  const sheetOpen = useTransactionsStore((s) => s.sheetOpen)
  const editingTransaction = useTransactionsStore((s) => s.editingTransaction)
  const openAddSheet = useTransactionsStore((s) => s.openAddSheet)
  const closeSheet = useTransactionsStore((s) => s.closeSheet)
  const pendingUndo = useTransactionsStore((s) => s.pendingUndo)
  const dismissUndo = useTransactionsStore((s) => s.dismissUndo)
  const loadRef = useRef(useTransactionsStore.getState().load)

  useEffect(() => {
    loadRef.current()
    RecurringService.generateDue().then(() => loadRef.current())
  }, [])

  return (
    <div className="flex h-dvh w-full bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-16 focus:top-16 focus:z-50 focus:rounded-2xl focus:bg-accent focus:px-16 focus:py-12 focus:text-white"
      >
        Skip to content
      </a>

      <NavigationRail />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopAppBar
          onScaffoldAction={show}
          onNotificationsClick={() => navigate('/notifications')}
          onSearchClick={() => setSearchOpen(true)}
        />

        <main id="main-content" className="flex flex-1 flex-col overflow-y-auto">
          <Outlet />
        </main>

        <FloatingActionButton
          onClick={openAddSheet}
          className="absolute bottom-24 right-16 md:bottom-20 md:right-20"
        />

        <BottomNavigation />
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={closeSheet}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionEntrySheet />
      </BottomSheet>

      {pendingUndo && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-16 md:bottom-20"
        >
          <div className="card flex items-center gap-12 px-16 py-12 text-body-sm text-text-primary">
            <span>{pendingUndo.message}</span>
            <button
              type="button"
              onClick={() => {
                pendingUndo.onUndo()
                dismissUndo()
              }}
              className="font-semibold text-accent underline decoration-accent/50 underline-offset-2"
            >
              Undo
            </button>
          </div>
        </div>
      )}

      <Toast message={message} />

      <GlobalSearchModal
        key={searchOpen ? 'open' : 'closed'}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {isInstallable && (
        <div className="card-nav fixed inset-x-0 bottom-0 z-40 md:bottom-0 border-t border-brand-teal900/5 dark:border-brand-teal400/8">
          <div className="mx-auto flex max-w-md items-center gap-12 px-16 py-12">
            <Download className="size-20 shrink-0 text-accent" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-text-primary">Install Mizan</p>
              <p className="text-caption text-text-secondary">
                Add to your home screen for quick access
              </p>
            </div>
            <button
              type="button"
              onClick={() => promptInstall()}
              className="card-sm bg-accent px-16 py-8 text-body-sm font-semibold text-white transition-all duration-fast hover:brightness-110"
            >
              Install
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
