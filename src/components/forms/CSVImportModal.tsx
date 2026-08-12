import { useState, useCallback, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import type { TransactionStatus } from '@/types/entities'

interface ParsedRow {
  index: number
  values: string[]
}

interface MappedRow {
  date: string
  type: 'expense' | 'income' | 'transfer'
  amount: number
  description: string
  categoryId?: string
  accountId?: string
  status?: TransactionStatus
  tags?: string[]
  notes?: string
}

type ColumnMapping = Record<string, number>

const EXPECTED_COLUMNS: { key: keyof MappedRow; label: string; required: boolean }[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'type', label: 'Type', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'description', label: 'Description', required: true },
  { key: 'categoryId', label: 'Category', required: false },
  { key: 'accountId', label: 'Account', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'tags', label: 'Tags', required: false },
  { key: 'notes', label: 'Notes', required: false },
]

function parseCSVHeader(line: string): string[] {
  return line.split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
}

function parseCSVRow(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase()
    for (const col of EXPECTED_COLUMNS) {
      if (h.includes(col.key.toLowerCase()) || h === col.label.toLowerCase()) {
        mapping[col.key] = i
        break
      }
    }
  }
  return mapping
}

function mapRows(
  rows: ParsedRow[],
  mapping: ColumnMapping
): { valid: MappedRow[]; errors: string[] } {
  const valid: MappedRow[] = []
  const errors: string[] = []

  for (const row of rows) {
    const dateIdx = mapping['date']
    const typeIdx = mapping['type']
    const amountIdx = mapping['amount']
    const descIdx = mapping['description']

    if (
      dateIdx === undefined ||
      typeIdx === undefined ||
      amountIdx === undefined ||
      descIdx === undefined
    ) {
      errors.push(
        `Row ${row.index + 1}: Missing required column mapping (date, type, amount, description)`
      )
      continue
    }

    const dateVal = row.values[dateIdx]
    const typeVal = row.values[typeIdx]?.toLowerCase().trim()
    const amountVal = row.values[amountIdx]
    const descVal = row.values[descIdx]

    if (!dateVal || !amountVal || !descVal) {
      errors.push(`Row ${row.index + 1}: Empty required field`)
      continue
    }

    if (typeVal !== 'income' && typeVal !== 'expense' && typeVal !== 'transfer') {
      errors.push(
        `Row ${row.index + 1}: Invalid type "${row.values[typeIdx]}". Expected income/expense/transfer`
      )
      continue
    }

    const amount = Number(amountVal)
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${row.index + 1}: Invalid amount "${amountVal}"`)
      continue
    }

    const mapped: MappedRow = {
      date: dateVal,
      type: typeVal as 'expense' | 'income' | 'transfer',
      amount,
      description: descVal.replace(/^"|"$/g, ''),
    }

    if (mapping['categoryId'] !== undefined)
      mapped.categoryId = row.values[mapping['categoryId']] || undefined
    if (mapping['accountId'] !== undefined)
      mapped.accountId = row.values[mapping['accountId']] || undefined
    if (mapping['status'] !== undefined)
      mapped.status = (row.values[mapping['status']] || 'paid') as TransactionStatus
    if (mapping['tags'] !== undefined) {
      const tagsStr = row.values[mapping['tags']]
      if (tagsStr)
        mapped.tags = tagsStr
          .replace(/^"|"$/g, '')
          .split(';')
          .map((t) => t.trim())
          .filter(Boolean)
    }
    if (mapping['notes'] !== undefined) {
      mapped.notes = row.values[mapping['notes']]?.replace(/^"|"$/g, '') || undefined
    }

    valid.push(mapped)
  }

  return { valid, errors }
}

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (rows: MappedRow[]) => Promise<{ imported: number; skipped: number; errors: string[] }>
}

export function CSVImportModal({ isOpen, onClose, onImport }: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const mappingRef = useRef<ColumnMapping>({})
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    errors: string[]
  } | null>(null)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim())
      if (lines.length < 2) {
        setErrors(['File must have at least a header row and one data row'])
        return
      }

      const headerNames = parseCSVHeader(lines[0])
      const rows: ParsedRow[] = []
      for (let i = 1; i < Math.min(lines.length, 101); i++) {
        rows.push({ index: i - 1, values: parseCSVRow(lines[i]) })
      }

      const autoMapping = autoMapColumns(headerNames)
      const { valid, errors: mapErrors } = mapRows(rows, autoMapping)

      setHeaders(headerNames)
      setParsedRows(rows)
      mappingRef.current = autoMapping
      setMappedRows(valid)
      setErrors(mapErrors)
      setStep('preview')
    }
    reader.readAsText(file)
  }, [])

  async function handleImport() {
    setStep('importing')
    try {
      const result = await onImport(mappedRows)
      setImportResult(result)
      setStep('done')
    } catch (e) {
      setErrors([`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`])
      setStep('preview')
    }
  }

  function reset() {
    setStep('upload')
    setHeaders([])
    setParsedRows([])
    mappingRef.current = {}
    setMappedRows([])
    setErrors([])
    setImportResult(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-16">
      <div className="flex max-h-full w-full max-w-lg flex-col gap-16 overflow-auto rounded-modal bg-surface-card p-16 shadow-modal md:p-24">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 text-text-primary">Import CSV</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-32 items-center justify-center rounded-full text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close import modal"
          >
            <X className="size-20" />
          </button>
        </div>

        {step === 'upload' && (
          <div className="flex flex-col items-center gap-16 py-32">
            <Upload className="size-48 text-text-tertiary" aria-hidden="true" />
            <p className="text-body text-text-secondary">
              Upload a CSV file exported from Mizan or any banking app
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
                className="hidden"
              />
              <span className="rounded-md bg-brand-teal900 px-24 py-12 text-body font-medium text-white transition-colors duration-fast hover:bg-brand-teal700">
                Choose CSV File
              </span>
            </label>
            {errors.length > 0 && <p className="text-body-sm text-expense">{errors[0]}</p>}
          </div>
        )}

        {step === 'preview' && (
          <div className="flex flex-col gap-12">
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-text-secondary">
                {mappedRows.length} rows ready to import
                {errors.length > 0 && (
                  <span className="ml-8 text-warning">{errors.length} rows with errors</span>
                )}
              </p>
            </div>
            <div className="overflow-auto rounded-md border border-border">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-neutral-50 dark:bg-neutral-900">
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="whitespace-nowrap px-8 py-6 text-left text-caption text-text-tertiary"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {parsedRows.map((row, ri) => (
                    <tr key={ri} className={cn(ri % 2 === 0 && 'bg-surface-card')}>
                      {row.values.map((val, ci) => (
                        <td
                          key={ci}
                          className="max-w-[120px] truncate whitespace-nowrap px-8 py-6 text-text-primary"
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-8">
              <Button variant="primary" onClick={handleImport}>
                Import {mappedRows.length} transactions
              </Button>
              <Button variant="tertiary" onClick={reset}>
                Choose different file
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center gap-12 py-32">
            <div className="size-32 animate-spin rounded-full border-4 border-border border-t-primary" />
            <p className="text-body text-text-secondary">Importing transactions...</p>
          </div>
        )}

        {step === 'done' && importResult && (
          <div className="flex flex-col gap-12">
            <div className="rounded-md bg-income-subtle p-16 text-center">
              <p className="text-h3 text-income">{importResult.imported}</p>
              <p className="text-body-sm text-text-secondary">transactions imported successfully</p>
            </div>
            {importResult.skipped > 0 && (
              <p className="text-body-sm text-warning">{importResult.skipped} duplicates skipped</p>
            )}
            {importResult.errors.length > 0 && (
              <div className="flex flex-col gap-4 rounded-md bg-expense-subtle p-12">
                <p className="text-caption font-medium text-expense">Errors</p>
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-caption text-expense">
                    {err}
                  </p>
                ))}
                {importResult.errors.length > 5 && (
                  <p className="text-caption text-text-tertiary">
                    ...and {importResult.errors.length - 5} more
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-8">
              <Button variant="primary" onClick={reset}>
                Import another file
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
