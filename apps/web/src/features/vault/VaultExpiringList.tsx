import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { VaultRepository } from '@/repositories/VaultRepository'
import { ErrorState } from '@/components/common/ErrorState'
import { SkeletonList } from '@/components/common/Skeleton'
import { cn } from '@/utils/cn'
import type { VaultDocument } from '@/types/entities'
import { DOC_TYPE_META, formatDate, daysUntil } from './utils'

type Tab = 'expiring' | 'expired'

function urgencyColor(days: number): string {
  if (days <= 7) return 'text-expense'
  if (days <= 14) return 'text-warning'
  return 'text-info'
}

function urgencyBg(days: number): string {
  if (days <= 7) return 'bg-expense-subtle'
  if (days <= 14) return 'bg-warning-subtle'
  return 'bg-info-subtle'
}

export function VaultExpiringList() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('expiring')

  const [expiringDocs, setExpiringDocs] = useState<VaultDocument[]>([])
  const [expiredDocs, setExpiredDocs] = useState<VaultDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [expiring, expired] = await Promise.all([
        VaultRepository.getExpiringSoon(30),
        VaultRepository.getExpired(),
      ])
      setExpiringDocs(expiring)
      setExpiredDocs(expired)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const documents = activeTab === 'expiring' ? expiringDocs : expiredDocs

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

  return (
    <div className="flex flex-col gap-16 p-16 md:p-24">
      <div className="flex items-center gap-12">
        <button
          onClick={() => navigate('/vault')}
          className="flex size-40 items-center justify-center rounded-2xl text-text-secondary transition-colors hover:shadow-glass-pressed hover:text-text-primary"
          aria-label="Back to Vault"
        >
          <ArrowLeft className="size-20" aria-hidden="true" />
        </button>
        <h1 className="text-h2 text-text-primary">Expiring Documents</h1>
      </div>

      <div className="flex rounded-xl bg-border-subtle p-4">
        <button
          onClick={() => setActiveTab('expiring')}
          className={cn(
            'flex-1 rounded-lg py-8 text-body-sm font-medium transition-all',
            activeTab === 'expiring'
              ? 'bg-surface-card text-text-primary shadow-glass-sm'
              : 'text-text-tertiary'
          )}
        >
          Expiring Soon
          {!loading && expiringDocs.length > 0 && (
            <span className="ml-4 rounded-full bg-warning-subtle px-6 py-1 text-caption text-warning">
              {expiringDocs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={cn(
            'flex-1 rounded-lg py-8 text-body-sm font-medium transition-all',
            activeTab === 'expired'
              ? 'bg-surface-card text-text-primary shadow-glass-sm'
              : 'text-text-tertiary'
          )}
        >
          Expired
          {!loading && expiredDocs.length > 0 && (
            <span className="ml-4 rounded-full bg-expense-subtle px-6 py-1 text-caption text-expense">
              {expiredDocs.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : documents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-12 py-48 text-center">
          <div className="card-input flex size-80 items-center justify-center rounded-3xl">
            <div className="flex size-56 items-center justify-center rounded-2xl shadow-glass-pressed bg-surface">
              <AlertTriangle
                className={cn('size-28', activeTab === 'expired' ? 'text-expense' : 'text-warning')}
                aria-hidden="true"
              />
            </div>
          </div>
          <h2 className="text-h3 text-text-primary">
            {activeTab === 'expired' ? 'No expired documents' : 'No documents expiring soon'}
          </h2>
          <p className="text-body-sm text-text-secondary max-w-xs">
            {activeTab === 'expired'
              ? 'All your documents are up to date. Great job keeping things organized.'
              : 'None of your documents expire in the next 30 days.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {documents.map((doc) => {
            const meta = DOC_TYPE_META[doc.type]
            const Icon = meta.icon
            const days = doc.expiryDate ? daysUntil(doc.expiryDate) : 0
            const isExpired = days < 0

            return (
              <button
                key={doc.id}
                onClick={() => navigate(`/vault/documents/${doc.id}`)}
                className="card-sm flex items-center gap-12 rounded-xl p-12 transition-all duration-fast active:scale-[0.98]"
              >
                <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-border-subtle">
                  {doc.thumbnailData ? (
                    <img src={doc.thumbnailData} alt="" className="size-full object-cover" />
                  ) : (
                    <Icon className={cn('size-18', meta.color)} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-body-sm font-medium text-text-primary">{doc.title}</p>
                  <p className="text-caption text-text-tertiary">{meta.label}</p>
                </div>
                <div
                  className={cn(
                    'flex shrink-0 items-center gap-6 rounded-full px-8 py-4',
                    isExpired ? 'bg-expense-subtle' : urgencyBg(days)
                  )}
                >
                  <Clock
                    className={cn('size-14', isExpired ? 'text-expense' : urgencyColor(days))}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'text-caption font-medium',
                      isExpired ? 'text-expense' : urgencyColor(days)
                    )}
                  >
                    {isExpired
                      ? `Expired ${formatDate(doc.expiryDate!)}`
                      : `${days} day${days !== 1 ? 's' : ''} left`}
                  </span>
                </div>
                <ChevronRight className="size-16 text-text-tertiary shrink-0" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
