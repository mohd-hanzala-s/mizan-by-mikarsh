import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  ReceiptText,
  FileText,
  ShieldCheck,
  Shield,
  FileSpreadsheet,
  Car,
  HeartPulse,
  Building2,
  FolderOpen,
  AlertTriangle,
  Star,
  ChevronRight,
} from 'lucide-react'
import { VaultService } from '@/services/VaultService'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SkeletonList } from '@/components/common/Skeleton'
import { cn } from '@/utils/cn'
import type { VaultDocument, VaultDocumentType } from '@/types/entities'
import { VaultDocForm } from './VaultDocForm'

const DOC_TYPE_META: Record<
  VaultDocumentType,
  { label: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>; color: string }
> = {
  receipt: { label: 'Receipts', icon: ReceiptText, color: 'text-income' },
  bill: { label: 'Bills', icon: FileText, color: 'text-expense' },
  warranty: { label: 'Warranties', icon: ShieldCheck, color: 'text-info' },
  insurance: { label: 'Insurance', icon: Shield, color: 'text-brand-teal900' },
  tax: { label: 'Tax', icon: FileSpreadsheet, color: 'text-liability' },
  vehicle: { label: 'Vehicle', icon: Car, color: 'text-accent' },
  medical: { label: 'Medical', icon: HeartPulse, color: 'text-expense' },
  bank_statement: { label: 'Bank Statements', icon: Building2, color: 'text-brand-teal900' },
  other: { label: 'Other', icon: FolderOpen, color: 'text-tertiary' },
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

export function VaultPage() {
  const navigate = useNavigate()

  const [documents, setDocuments] = useState<VaultDocument[]>([])
  const [stats, setStats] = useState<{ total: number; byType: Record<VaultDocumentType, number>; expiringSoon: number; expired: number; totalSize: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [docs, st] = await Promise.all([VaultService.getVaultDocuments(), VaultService.getStats()])
      setDocuments(docs)
      setStats(st)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const recentDocs = documents.slice(0, 5)


  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null)
          void load()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="p-16">
        <SkeletonList count={5} />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <>
        <EmptyState
          icon={ShieldCheck}
          title="No documents yet"
          description="Securely store receipts, bills, warranties, and other important documents. Everything stays on-device."
          actionLabel="Add your first document"
          onAction={() => setShowForm(true)}
        />
        {showForm && (
          <VaultDocForm
            open={showForm}
            onClose={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false)
              void load()
            }}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-16 p-16 pb-80 md:p-24 md:pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-text-primary">Vault</h1>
          <p className="text-body-sm text-text-secondary">
            {stats ? `${stats.total} document${stats.total !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex size-40 items-center justify-center rounded-2xl bg-brand-teal900 text-white shadow-glass-sm transition-all duration-fast active:scale-95"
          aria-label="Add document"
        >
          <Plus className="size-20" aria-hidden="true" />
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-8">
          <div className="card-sm rounded-xl p-12 text-center">
            <p className="text-caption text-text-tertiary">Total</p>
            <p className="text-h3 font-semibold text-text-primary">{stats.total}</p>
          </div>
          <div className="card-sm rounded-xl p-12 text-center">
            <p className="text-caption text-text-tertiary">Expiring Soon</p>
            <p className={cn('text-h3 font-semibold', stats.expiringSoon > 0 ? 'text-warning' : 'text-text-primary')}>
              {stats.expiringSoon}
            </p>
          </div>
          <div className="card-sm rounded-xl p-12 text-center">
            <p className="text-caption text-text-tertiary">Expired</p>
            <p className={cn('text-h3 font-semibold', stats.expired > 0 ? 'text-expense' : 'text-text-primary')}>
              {stats.expired}
            </p>
          </div>
        </div>
      )}

      {stats && (stats.expiringSoon > 0 || stats.expired > 0) && (
        <button
          onClick={() => navigate('/vault/expiring')}
          className="card-sm flex items-center gap-12 rounded-xl p-12 transition-all duration-fast active:scale-[0.98]"
        >
          <div className="flex size-36 items-center justify-center rounded-xl bg-warning-subtle">
            <AlertTriangle className="size-16 text-warning" aria-hidden="true" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-body-sm font-medium text-text-primary">
              {stats.expired > 0 && `${stats.expired} expired`}
              {stats.expired > 0 && stats.expiringSoon > 0 && ' & '}
              {stats.expiringSoon > 0 && `${stats.expiringSoon} expiring soon`}
            </p>
            <p className="text-caption text-text-tertiary">Review documents needing attention</p>
          </div>
          <ChevronRight className="size-18 text-text-tertiary" aria-hidden="true" />
        </button>
      )}

      <section>
        <h2 className="mb-10 text-overline text-text-tertiary">Categories</h2>
        <div className="grid grid-cols-3 gap-8">
          {(Object.keys(DOC_TYPE_META) as VaultDocumentType[]).map((type) => {
            const meta = DOC_TYPE_META[type]
            const Icon = meta.icon
            const count = stats?.byType[type] ?? 0
            return (
              <button
                key={type}
                onClick={() => navigate(`/vault/documents?type=${type}`)}
                className="card-sm flex flex-col items-center gap-8 rounded-xl p-14 transition-all duration-fast active:scale-[0.97]"
              >
                <div className="flex size-40 items-center justify-center rounded-xl bg-brand-teal900/8">
                  <Icon className={cn('size-20', meta.color)} aria-hidden="true" />
                </div>
                <span className="text-caption font-medium text-text-primary">{meta.label}</span>
                <span className="text-caption text-text-tertiary">{count}</span>
              </button>
            )
          })}
        </div>
      </section>

      {recentDocs.length > 0 && (
        <section>
          <h2 className="mb-10 text-overline text-text-tertiary">Recent</h2>
          <div className="flex flex-col gap-6">
            {recentDocs.map((doc) => {
              const meta = DOC_TYPE_META[doc.type]
              const Icon = meta.icon
              const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
              return (
                <button
                  key={doc.id}
                  onClick={() => navigate(`/vault/documents/${doc.id}`)}
                  className="card-sm flex items-center gap-12 rounded-xl p-12 transition-all duration-fast active:scale-[0.98]"
                >
                  <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-border-subtle">
                    {doc.thumbnailData ? (
                      <img
                        src={doc.thumbnailData}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <Icon className={cn('size-18', meta.color)} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-body-sm font-medium text-text-primary">{doc.title}</p>
                    <p className="text-caption text-text-tertiary">
                      {meta.label}
                      {doc.documentDate && ` · ${formatDate(doc.documentDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {doc.isFavorite && <Star className="size-14 fill-accent text-accent" aria-hidden="true" />}
                    {isExpired && (
                      <span className="rounded-full bg-expense-subtle px-6 py-2 text-caption font-medium text-expense">
                        Expired
                      </span>
                    )}
                    {!isExpired && doc.expiryDate && daysUntil(doc.expiryDate) <= 30 && (
                      <span className="rounded-full bg-warning-subtle px-6 py-2 text-caption font-medium text-warning">
                        {daysUntil(doc.expiryDate)}d
                      </span>
                    )}
                    <ChevronRight className="size-16 text-text-tertiary shrink-0" aria-hidden="true" />
                  </div>
                </button>
              )
            })}
          </div>
          {documents.length > 5 && (
            <button
              onClick={() => navigate('/vault/documents')}
              className="mt-8 w-full rounded-xl py-10 text-center text-body-sm font-medium text-brand-teal900 transition-colors hover:bg-brand-teal900/4"
            >
              View all {documents.length} documents
            </button>
          )}
        </section>
      )}

      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-96 right-16 z-40 flex size-56 items-center justify-center rounded-full bg-brand-teal900 text-white shadow-floating transition-transform duration-fast active:scale-95 md:bottom-24"
        aria-label="Add document"
      >
        <Plus className="size-24" aria-hidden="true" />
      </button>

      {showForm && (
        <VaultDocForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false)
            void load()
          }}
        />
      )}
    </div>
  )
}
