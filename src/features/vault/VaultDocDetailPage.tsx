import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Trash2,
  Pencil,
  FileText,
  ReceiptText,
  ShieldCheck,
  Shield,
  FileSpreadsheet,
  Car,
  HeartPulse,
  Building2,
  FolderOpen,
  Calendar,
  Clock,
  Tag,
  File,
} from 'lucide-react'
import { VaultRepository } from '@/repositories/VaultRepository'
import { VaultService } from '@/services/VaultService'
import { ErrorState } from '@/components/common/ErrorState'
import { SkeletonPage } from '@/components/common/Skeleton'
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/utils/cn'
import type { VaultDocument, VaultDocumentType } from '@/types/entities'
import { VaultDocForm } from './VaultDocForm'

const DOC_TYPE_META: Record<
  VaultDocumentType,
  {
    label: string
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
    color: string
  }
> = {
  receipt: { label: 'Receipt', icon: ReceiptText, color: 'text-income' },
  bill: { label: 'Bill', icon: FileText, color: 'text-expense' },
  warranty: { label: 'Warranty', icon: ShieldCheck, color: 'text-info' },
  insurance: { label: 'Insurance', icon: Shield, color: 'text-brand-teal900' },
  tax: { label: 'Tax', icon: FileSpreadsheet, color: 'text-liability' },
  vehicle: { label: 'Vehicle', icon: Car, color: 'text-accent' },
  medical: { label: 'Medical', icon: HeartPulse, color: 'text-expense' },
  bank_statement: { label: 'Bank Statement', icon: Building2, color: 'text-brand-teal900' },
  other: { label: 'Other', icon: FolderOpen, color: 'text-tertiary' },
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
}

const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
]

export function VaultDocDetailPage() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id') ?? ''
  const navigate = useNavigate()
  const { show } = useToast()

  const [doc, setDoc] = useState<VaultDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [togglingFav, setTogglingFav] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const found = await VaultRepository.getById(id)
      if (!found) {
        setError('Document not found')
        return
      }
      setDoc(found)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleToggleFavorite = async () => {
    if (!doc || togglingFav) return
    setTogglingFav(true)
    try {
      const updated = await VaultService.toggleFavorite(doc.id)
      setDoc(updated)
    } catch {
      show('Failed to update favorite')
    } finally {
      setTogglingFav(false)
    }
  }

  const handleDelete = async () => {
    if (!doc) return
    try {
      await VaultService.deleteDocument(doc.id)
      setConfirmingDelete(false)
      show('Document deleted')
      navigate('/vault', { replace: true })
    } catch {
      show('Failed to delete document')
    }
  }

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
        <SkeletonPage sections={2} />
      </div>
    )
  }

  if (!doc) return null

  const meta = DOC_TYPE_META[doc.type]
  const Icon = meta.icon
  const isImage = IMAGE_TYPES.includes(doc.fileType)
  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date()
  const isExpiringSoon = !isExpired && doc.expiryDate && daysUntil(doc.expiryDate) <= 30

  return (
    <div className="flex flex-col gap-20 p-16 pb-80 md:p-24 md:pb-32">
      <div className="flex items-center gap-12">
        <button
          onClick={() => navigate(-1)}
          className="flex size-40 items-center justify-center rounded-2xl text-text-secondary transition-colors hover:shadow-glass-pressed hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="size-20" aria-hidden="true" />
        </button>
        <h1 className="text-h2 text-text-primary truncate">{doc.title}</h1>
      </div>

      {isImage && doc.fileData ? (
        <div className="card overflow-hidden rounded-xl">
          <img
            src={doc.fileData}
            alt={doc.title}
            className="w-full object-contain"
            style={{ maxHeight: '60vh' }}
          />
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-12 rounded-xl p-32">
          <div className="flex size-80 items-center justify-center rounded-3xl bg-brand-teal900/8">
            <Icon className={cn('size-36', meta.color)} aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-body-sm font-medium text-text-primary">{doc.fileName}</p>
            <p className="text-caption text-text-tertiary">{formatFileSize(doc.fileSize)}</p>
          </div>
        </div>
      )}

      <div className="card-sm flex flex-col gap-16 rounded-xl p-16">
        <div className="flex items-center gap-8">
          <Icon className={cn('size-18', meta.color)} aria-hidden="true" />
          <span className="text-body-sm font-medium text-text-primary">{meta.label}</span>
        </div>

        <div className="flex flex-col gap-10">
          {doc.documentDate && (
            <div className="flex items-center gap-8">
              <Calendar className="size-16 text-text-tertiary" aria-hidden="true" />
              <span className="text-body-sm text-text-secondary">
                {formatDate(doc.documentDate)}
              </span>
            </div>
          )}

          {doc.expiryDate && (
            <div className="flex items-center gap-8">
              <Clock
                className={cn(
                  'size-16',
                  isExpired
                    ? 'text-expense'
                    : isExpiringSoon
                      ? 'text-warning'
                      : 'text-text-tertiary'
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'text-body-sm',
                  isExpired
                    ? 'text-expense font-medium'
                    : isExpiringSoon
                      ? 'text-warning font-medium'
                      : 'text-text-secondary'
                )}
              >
                {isExpired
                  ? `Expired on ${formatDate(doc.expiryDate)}`
                  : isExpiringSoon
                    ? `Expires in ${daysUntil(doc.expiryDate)} days (${formatDate(doc.expiryDate)})`
                    : `Expires ${formatDate(doc.expiryDate)}`}
              </span>
            </div>
          )}

          {doc.createdAt && (
            <div className="flex items-center gap-8">
              <Clock className="size-16 text-text-tertiary" aria-hidden="true" />
              <span className="text-body-sm text-text-tertiary">
                Added {formatDate(doc.createdAt)}
              </span>
            </div>
          )}
        </div>

        {doc.tags.length > 0 && (
          <div>
            <div className="mb-6 flex items-center gap-6">
              <Tag className="size-14 text-text-tertiary" aria-hidden="true" />
              <span className="text-caption font-medium text-text-tertiary">Tags</span>
            </div>
            <div className="flex flex-wrap gap-6">
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-border-subtle px-8 py-4 text-caption text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {doc.notes && (
          <div>
            <p className="mb-4 text-caption font-medium text-text-tertiary">Notes</p>
            <p className="text-body-sm text-text-secondary whitespace-pre-wrap">{doc.notes}</p>
          </div>
        )}

        {doc.description && !doc.notes && (
          <div>
            <p className="text-body-sm text-text-secondary">{doc.description}</p>
          </div>
        )}
      </div>

      <div className="card-sm rounded-xl p-12">
        <div className="flex items-center gap-8">
          <File className="size-16 text-text-tertiary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm text-text-primary">{doc.fileName}</p>
            <p className="text-caption text-text-tertiary">
              {doc.fileType} · {formatFileSize(doc.fileSize)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <button
          onClick={handleToggleFavorite}
          disabled={togglingFav}
          className={cn(
            'flex flex-1 items-center justify-center gap-8 rounded-2xl py-12 text-body-sm font-medium transition-all duration-fast active:scale-[0.97]',
            doc.isFavorite ? 'bg-accent-muted text-accent' : 'card-sm text-text-secondary'
          )}
        >
          <Star className={cn('size-18', doc.isFavorite && 'fill-accent')} aria-hidden="true" />
          {doc.isFavorite ? 'Favorited' : 'Favorite'}
        </button>

        <button
          onClick={() => setShowEditForm(true)}
          className="flex flex-1 items-center justify-center gap-8 rounded-2xl py-12 text-body-sm font-medium text-text-secondary card-sm transition-all duration-fast active:scale-[0.97]"
        >
          <Pencil className="size-18" aria-hidden="true" />
          Edit
        </button>

        <button
          onClick={() => setConfirmingDelete(true)}
          className="flex flex-1 items-center justify-center gap-8 rounded-2xl py-12 text-body-sm font-medium text-expense card-sm transition-all duration-fast active:scale-[0.97]"
        >
          <Trash2 className="size-18" aria-hidden="true" />
          Delete
        </button>
      </div>

      <ConfirmationDialog
        open={confirmingDelete}
        title="Delete document?"
        description={`"${doc.title}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />

      {showEditForm && (
        <VaultDocForm
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          editing={doc}
          onSaved={(updatedDoc) => {
            setShowEditForm(false)
            if (updatedDoc) {
              setDoc(updatedDoc)
            } else {
              void load()
            }
            show('Document updated')
          }}
        />
      )}
    </div>
  )
}
