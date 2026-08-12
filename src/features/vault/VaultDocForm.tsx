import { useEffect, useState, useRef } from 'react'
import { X, Upload, ReceiptText, FileText, ShieldCheck, Shield, FileSpreadsheet, Car, HeartPulse, Building2, FolderOpen } from 'lucide-react'
import { VaultService } from '@/services/VaultService'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { VaultDocument, VaultDocumentType } from '@/types/entities'

const DOC_TYPES: { value: VaultDocumentType; label: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }> }[] = [
  { value: 'receipt', label: 'Receipt', icon: ReceiptText },
  { value: 'bill', label: 'Bill', icon: FileText },
  { value: 'warranty', label: 'Warranty', icon: ShieldCheck },
  { value: 'insurance', label: 'Insurance', icon: Shield },
  { value: 'tax', label: 'Tax', icon: FileSpreadsheet },
  { value: 'vehicle', label: 'Vehicle', icon: Car },
  { value: 'medical', label: 'Medical', icon: HeartPulse },
  { value: 'bank_statement', label: 'Bank Statement', icon: Building2 },
  { value: 'other', label: 'Other', icon: FolderOpen },
]

interface VaultDocFormProps {
  open: boolean
  onClose: () => void
  onSaved: (doc?: VaultDocument) => void
  editing?: VaultDocument
}

function readFileAsBase64(file: File): Promise<{ data: string; name: string; type: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        data: reader.result as string,
        name: file.name,
        type: file.type,
        size: file.size,
      })
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function generateThumbnail(fileData: string, fileType: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!fileType.startsWith('image/')) {
      resolve(null)
      return
    }
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxSize = 200
      let w = img.width
      let h = img.height
      if (w > h) {
        if (w > maxSize) {
          h *= maxSize / w
          w = maxSize
        }
      } else {
        if (h > maxSize) {
          w *= maxSize / h
          h = maxSize
        }
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => resolve(null)
    img.src = fileData
  })
}

export function VaultDocForm({ open, onClose, onSaved, editing }: VaultDocFormProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<VaultDocumentType>('other')
  const [documentDate, setDocumentDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [fileData, setFileData] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [thumbnailData, setThumbnailData] = useState<string | null>(null)
  const [tagsInput, setTagsInput] = useState('')
  const [notes, setNotes] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setTitle(editing.title)
      setType(editing.type)
      setDocumentDate(editing.documentDate ? editing.documentDate.slice(0, 10) : '')
      setExpiryDate(editing.expiryDate ? editing.expiryDate.slice(0, 10) : '')
      setFileData(editing.fileData)
      setFileName(editing.fileName)
      setFileType(editing.fileType)
      setFileSize(editing.fileSize)
      setThumbnailData(editing.thumbnailData)
      setTagsInput(editing.tags.join(', '))
      setNotes(editing.notes)
      setDescription(editing.description)
    } else {
      setTitle('')
      setType('other')
      setDocumentDate(new Date().toISOString().slice(0, 10))
      setExpiryDate('')
      setFileData('')
      setFileName('')
      setFileType('')
      setFileSize(0)
      setThumbnailData(null)
      setTagsInput('')
      setNotes('')
      setDescription('')
    }
    setFormError(null)
  }, [open, editing])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await readFileAsBase64(file)
      setFileData(result.data)
      setFileName(result.name)
      setFileType(result.type)
      setFileSize(result.size)
      const thumb = await generateThumbnail(result.data, result.type)
      setThumbnailData(thumb)
    } catch {
      setFormError('Failed to read file')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Title is required')
      return
    }
    if (!editing && !fileData) {
      setFormError('Please select a file')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    try {
      if (editing) {
        const updated = await VaultService.updateDocument(editing.id, {
          title: title.trim(),
          type,
          description,
          tags,
          documentDate: documentDate ? new Date(documentDate).toISOString() : editing.documentDate,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
          notes,
        })
        onSaved(updated)
      } else {
        await VaultService.saveDocument({
          title: title.trim(),
          type,
          description,
          tags,
          documentDate: documentDate ? new Date(documentDate).toISOString() : new Date().toISOString(),
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
          fileData,
          fileName,
          fileType,
          fileSize,
          thumbnailData,
          notes,
        })
        onSaved()
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 md:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-surface-card p-24 shadow-floating md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-16 flex items-center justify-between">
          <h2 className="text-h2 text-text-primary">{editing ? 'Edit Document' : 'New Document'}</h2>
          <button
            onClick={onClose}
            className="flex size-40 items-center justify-center rounded-lg text-text-tertiary hover:bg-border-subtle"
            aria-label="Close"
          >
            <X className="size-20" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-16">
          <label className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Car Insurance Policy"
              className="card-input min-h-touch rounded-lg px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-teal900/20"
              autoFocus
            />
          </label>

          <div className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Type</span>
            <div className="grid grid-cols-3 gap-6">
              {DOC_TYPES.map((dt) => {
                const TypeIcon = dt.icon
                return (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setType(dt.value)}
                    className={cn(
                      'flex flex-col items-center gap-4 rounded-lg px-6 py-8 text-caption font-medium transition-all',
                      type === dt.value
                        ? 'bg-brand-teal900 text-white shadow-glass-sm'
                        : 'bg-border-subtle text-text-secondary hover:bg-border'
                    )}
                  >
                    <TypeIcon className="size-16" aria-hidden="true" />
                    {dt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <label className="flex flex-col gap-4">
              <span className="text-body-sm font-medium text-text-primary">Document Date</span>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="card-input min-h-touch rounded-lg px-12 py-8 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal900/20"
              />
            </label>

            <label className="flex flex-col gap-4">
              <span className="text-body-sm font-medium text-text-primary">Expiry Date</span>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="card-input min-h-touch rounded-lg px-12 py-8 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-teal900/20"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">File</span>
            {fileData ? (
              <div className="card-sm flex items-center gap-12 rounded-lg p-12">
                {thumbnailData ? (
                  <img src={thumbnailData} alt="" className="size-40 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-40 items-center justify-center rounded-lg bg-border-subtle">
                    <Upload className="size-16 text-text-tertiary" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm text-text-primary">{fileName}</p>
                  <p className="text-caption text-text-tertiary">
                    {fileType} · {(fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setFileData('')
                      setFileName('')
                      setFileType('')
                      setFileSize(0)
                      setThumbnailData(null)
                    }}
                    className="text-caption text-expense"
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="card-sm flex min-h-touch items-center justify-center gap-8 rounded-lg border-2 border-dashed border-border text-body-sm text-text-tertiary transition-colors hover:border-brand-teal900 hover:text-brand-teal900"
              >
                <Upload className="size-18" aria-hidden="true" />
                Choose file
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            />
          </div>

          <label className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Tags (comma-separated)</span>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. home, insurance, 2024"
              className="card-input min-h-touch rounded-lg px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-teal900/20"
            />
          </label>

          <label className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Description</span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this document"
              className="card-input min-h-touch rounded-lg px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-teal900/20"
            />
          </label>

          <label className="flex flex-col gap-4">
            <span className="text-body-sm font-medium text-text-primary">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="card-input min-h-touch rounded-lg px-12 py-8 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-teal900/20 resize-none"
            />
          </label>

          {formError && (
            <p className="rounded-lg bg-expense-subtle px-12 py-8 text-body-sm text-expense" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="mt-8">
            {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Save Document'}
          </Button>
        </form>
      </div>
    </div>
  )
}
