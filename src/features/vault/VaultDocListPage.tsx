import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Star,
  ChevronRight,
  ReceiptText,
  FileText,
  ShieldCheck,
  Shield,
  FileSpreadsheet,
  Car,
  HeartPulse,
  Building2,
  FolderOpen,
  X,
} from 'lucide-react'
import { VaultService } from '@/services/VaultService'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SkeletonList } from '@/components/common/Skeleton'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils/cn'
import type { VaultDocument, VaultDocumentType } from '@/types/entities'

const DOC_TYPE_META: Record<
  VaultDocumentType,
  {
    label: string
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
    color: string
  }
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
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

export function VaultDocListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeFilter = searchParams.get('type') as VaultDocumentType | null

  const [documents, setDocuments] = useState<VaultDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      let docs: VaultDocument[]
      if (debouncedSearch) {
        docs = await VaultService.searchDocuments(debouncedSearch)
      } else if (typeFilter) {
        docs = await VaultService.getDocumentsByType(typeFilter)
      } else {
        docs = await VaultService.getVaultDocuments()
      }

      if (typeFilter && !debouncedSearch) {
        docs = docs.filter((d) => d.type === typeFilter)
      }

      setDocuments(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, debouncedSearch])

  const headerLabel = typeFilter
    ? (DOC_TYPE_META[typeFilter]?.label ?? 'Documents')
    : 'All Documents'
  const headerIcon = typeFilter ? DOC_TYPE_META[typeFilter]?.icon : FileText
  const HeaderIcon = headerIcon

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
        <div className="flex items-center gap-8">
          <HeaderIcon
            className={cn(
              'size-20',
              typeFilter ? DOC_TYPE_META[typeFilter].color : 'text-text-secondary'
            )}
            aria-hidden="true"
          />
          <h1 className="text-h2 text-text-primary">{headerLabel}</h1>
        </div>
      </div>

      <div className="relative">
        <Search
          className="absolute left-12 top-1/2 size-16 -translate-y-1/2 text-text-tertiary pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
          className="card-input min-h-touch w-full rounded-xl pl-40 pr-36 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-teal900/20"
          aria-label="Search documents"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-10 top-1/2 flex size-24 -translate-y-1/2 items-center justify-center rounded-md text-text-tertiary hover:text-text-primary"
            aria-label="Clear search"
          >
            <X className="size-14" aria-hidden="true" />
          </button>
        )}
      </div>

      {loading ? (
        <SkeletonList count={5} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={typeFilter ? DOC_TYPE_META[typeFilter].icon : FolderOpen}
          title={
            debouncedSearch
              ? 'No results found'
              : typeFilter
                ? `No ${headerLabel.toLowerCase()} yet`
                : 'No documents yet'
          }
          description={
            debouncedSearch
              ? `No documents matching "${debouncedSearch}". Try a different search term.`
              : typeFilter
                ? `Tap + on the Vault page to add ${headerLabel.toLowerCase()}.`
                : 'Tap + on the Vault page to add your first document.'
          }
          actionLabel={!debouncedSearch ? undefined : 'Clear search'}
          onAction={!debouncedSearch ? undefined : () => setSearchQuery('')}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-body-sm text-text-tertiary">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
          {documents.map((doc) => {
            const meta = DOC_TYPE_META[doc.type]
            const Icon = meta.icon
            const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
            const expiringSoon = !isExpired && doc.expiryDate && daysUntil(doc.expiryDate) <= 30
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
                  <p className="text-caption text-text-tertiary">
                    {meta.label}
                    {doc.documentDate && ` · ${formatDate(doc.documentDate)}`}
                  </p>
                  {doc.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-4">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-border-subtle px-6 py-1 text-caption text-text-tertiary"
                        >
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-caption text-text-tertiary">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  {doc.isFavorite && (
                    <Star className="size-14 fill-accent text-accent" aria-hidden="true" />
                  )}
                  {isExpired && (
                    <span className="rounded-full bg-expense-subtle px-6 py-2 text-caption font-medium text-expense">
                      Expired
                    </span>
                  )}
                  {expiringSoon && (
                    <span className="rounded-full bg-warning-subtle px-6 py-2 text-caption font-medium text-warning">
                      {daysUntil(doc.expiryDate!)}d
                    </span>
                  )}
                  <ChevronRight className="size-16 text-text-tertiary" aria-hidden="true" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
