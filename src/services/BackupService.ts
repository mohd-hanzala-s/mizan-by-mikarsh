import { db } from '@/database/db'
import type {
  Account,
  Budget,
  Category,
  Favorite,
  Loan,
  LoanPayment,
  RecurringRule,
  Settings,
  Tag,
  Transaction,
} from '@/types/entities'

/**
 * §9 Phase 10 — Reports: backup/restore and export (§5 rules).
 *
 * - JSON export/backup = complete state (metadata, DB version, timestamp,
 *   user settings, and every store) — §5 "Export: JSON = complete state".
 * - CSV export = transactions only, the §5 default.
 * - Passphrase encryption is opt-in: when a passphrase is supplied the JSON
 *   payload is AES-256-GCM encrypted (Web Crypto) with a PBKDF2-derived key;
 *   the plain (unencrypted) export remains the default so a lost passphrase
 *   can never lock anyone out of data they didn't choose to encrypt.
 * - Restore validates the file first (§5 "never execute imported data
 *   directly; validate all imported backups"), then replaces the current
 *   state within a single transaction.
 *
 * The encryption/validation helpers are pure and exported for testing; the
 * DB capture/restore functions do the I/O against the Dexie stores.
 */

export const BACKUP_FORMAT = 'mizan-backup'
export const BACKUP_VERSION = 1
const CURRENT_DB_VERSION = 6

/** Every store that makes up a complete backup, in schema order. */
export const BACKUP_STORES = [
  'accounts',
  'categories',
  'settings',
  'transactions',
  'favorites',
  'tags',
  'budgets',
  'recurring_rules',
  'loans',
  'loan_payments',
] as const

export type BackupStoreName = (typeof BACKUP_STORES)[number]

export type BackupData = {
  accounts: Account[]
  categories: Category[]
  settings: Settings[]
  transactions: Transaction[]
  favorites: Favorite[]
  tags: Tag[]
  budgets: Budget[]
  recurring_rules: RecurringRule[]
  loans: Loan[]
  loan_payments: LoanPayment[]
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  /** Product identifier — guards against restoring some other app's file. */
  app: 'mizan'
  /** Dexie schema version the data was exported at. */
  dbVersion: number
  /** ISO datetime of when the backup was created. */
  createdAt: string
  encrypted: false
  data: BackupData
}

export interface EncryptedBackupFile {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  app: 'mizan'
  dbVersion: number
  createdAt: string
  encrypted: true
  algorithm: 'AES-GCM'
  kdf: 'PBKDF2'
  iterations: number
  /** Base64 salt used for PBKDF2 key derivation. */
  salt: string
  /** Base64 96-bit AES-GCM IV. */
  iv: string
  /** Base64 ciphertext of the stringified BackupData. */
  ciphertext: string
}

export type AnyBackupFile = BackupFile | EncryptedBackupFile

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function hasSubtle(): boolean {
  return typeof globalThis.crypto?.subtle !== 'undefined'
}

/** Derives an AES-GCM key from a passphrase via PBKDF2-SHA256. */
async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    textEncoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export interface BackupError {
  field: string
  message: string
}

/** Structural validation of an unknown object as a Mizan backup file. Throws
 * with a human-readable first error; returns true when valid. */
export function validateBackupFile(value: unknown): value is AnyBackupFile {
  if (typeof value !== 'object' || value === null) {
    throw new Error('This file is not a valid Mizan backup (empty or not an object).')
  }
  const file = value as Record<string, unknown>
  if (file.format !== BACKUP_FORMAT) {
    throw new Error(
      `This file is not a Mizan backup (format "${String(file.format ?? '(none)')}").`
    )
  }
  if (file.app !== 'mizan') {
    throw new Error('This backup was not created by Mizan.')
  }
  if (file.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version "${String(file.version)}".`)
  }
  if (typeof file.createdAt !== 'string' || Number.isNaN(Date.parse(file.createdAt))) {
    throw new Error('This backup is missing a valid creation timestamp.')
  }

  if (file.encrypted === true) return true

  const data = file.data as Record<string, unknown> | undefined
  if (!data || typeof data !== 'object') {
    throw new Error('This backup contains no data to restore.')
  }
  for (const store of BACKUP_STORES) {
    const rows = data[store]
    if (!Array.isArray(rows)) {
      throw new Error(`This backup is missing the "${store}" table.`)
    }
  }
  return true
}

/** Decrypts an EncryptedBackupFile into plain BackupData. Throws when the
 * passphrase is wrong or the file is malformed. */
export async function decryptBackup(
  file: EncryptedBackupFile,
  passphrase: string
): Promise<BackupData> {
  if (!hasSubtle()) throw new Error('Passphrase encryption is not supported in this browser.')
  if (!passphrase) throw new Error('A passphrase is required to open this encrypted backup.')

  const key = await deriveKey(passphrase, fromBase64(file.salt))
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(file.iv) },
    key,
    fromBase64(file.ciphertext)
  )
  const parsed = JSON.parse(textDecoder.decode(plain)) as unknown
  if (!validateBackupFile({ ...file, encrypted: false, data: parsed } as AnyBackupFile)) {
    throw new Error('Decrypted backup contents are not a valid Mizan backup.')
  }
  return parsed as BackupData
}

export interface ParseOptions {
  passphrase?: string
}

/** Parses and validates a backup from its JSON string, decrypting it when
 * needed. Returns the decrypted/plain BackupData. */
export async function parseBackup(json: string, options: ParseOptions = {}): Promise<BackupData> {
  let file: unknown
  try {
    file = JSON.parse(json)
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  if (!validateBackupFile(file)) {
    throw new Error('This file is not a valid Mizan backup.')
  }

  if (file.encrypted === true) {
    return decryptBackup(file, options.passphrase ?? '')
  }
  return (file as BackupFile).data
}

export interface BackupOutput {
  json: string
  encrypted: boolean
}

/** Serializes the complete state into a backup file, optionally encrypted
 * with a passphrase (AES-256-GCM, PBKDF2-derived key). */
export async function serializeBackup(
  data: BackupData,
  options: ParseOptions = {}
): Promise<BackupOutput> {
  if (options.passphrase) {
    if (!hasSubtle()) throw new Error('Passphrase encryption is not supported in this browser.')
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(options.passphrase, salt)
    const ciphertext = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      textEncoder.encode(JSON.stringify(data))
    )
    const file: EncryptedBackupFile = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      app: 'mizan',
      dbVersion: CURRENT_DB_VERSION,
      createdAt: new Date().toISOString(),
      encrypted: true,
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      iterations: 150_000,
      salt: toBase64(salt),
      iv: toBase64(iv),
      ciphertext: toBase64(new Uint8Array(ciphertext)),
    }
    return { json: JSON.stringify(file), encrypted: true }
  }

  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: 'mizan',
    dbVersion: CURRENT_DB_VERSION,
    createdAt: new Date().toISOString(),
    encrypted: false,
    data,
  }
  return { json: JSON.stringify(file, null, 2), encrypted: false }
}

/** Reads every store into a BackupData snapshot. */
export async function captureBackupData(): Promise<BackupData> {
  const [
    accounts,
    categories,
    settings,
    transactions,
    favorites,
    tags,
    budgets,
    recurring_rules,
    loans,
    loan_payments,
  ] = await Promise.all([
    db.accounts.toArray(),
    db.categories.toArray(),
    db.settings.toArray(),
    db.transactions.toArray(),
    db.favorites.toArray(),
    db.tags.toArray(),
    db.budgets.toArray(),
    db.recurring_rules.toArray(),
    db.loans.toArray(),
    db.loan_payments.toArray(),
  ])
  return {
    accounts,
    categories,
    settings,
    transactions,
    favorites,
    tags,
    budgets,
    recurring_rules,
    loans,
    loan_payments,
  }
}

/** Restores the database from BackupData, replacing the current state within
 * a single transaction. Soft-deleted rows are preserved as-is (they're part
 * of the state, and undo/history depends on them). */
export async function restoreBackup(data: BackupData): Promise<void> {
  for (const store of BACKUP_STORES) {
    const rows = data[store]
    if (!Array.isArray(rows)) {
      throw new Error(`This backup is missing the "${store}" table.`)
    }
  }

  const tables = BACKUP_STORES.map((name) => db.table(name))
  await db.transaction('rw', tables, async () => {
    for (const store of BACKUP_STORES) {
      await db.table(store).clear()
      await db.table(store).bulkAdd(data[store] as object[])
    }
  })
}

/** Downloads a Blob as a file. Wrapped for testability — in jsdom (tests)
 * this simply returns; real browsers get a proper download. */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Converts the JSON string of a backup into a downloadable Blob. */
export function backupToBlob(json: string, encrypted: boolean): Blob {
  const type = encrypted ? 'application/octet-stream' : 'application/json'
  return new Blob([json], { type })
}

/** Reads a selected File as text. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file.'))
    reader.readAsText(file)
  })
}

/** §5 "CSV = transactions only (default)". Rows are non-deleted
 * transactions, oldest first, with a plain header row. */
export function transactionsToCsv(transactions: Transaction[]): string {
  const header = [
    'date',
    'type',
    'amount',
    'currency',
    'description',
    'categoryId',
    'accountId',
    'status',
    'source',
    'tags',
    'notes',
  ]
  const esc = (value: string | number) => {
    const s = String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = transactions
    .filter((t) => !t.isDeleted)
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate))
    .map((t) =>
      [
        t.transactionDate,
        t.type,
        t.amount,
        t.currency,
        t.description,
        t.categoryId,
        t.accountId,
        t.status,
        t.source,
        t.tags.join(';'),
        t.notes,
      ]
        .map(esc)
        .join(',')
    )
  return [header.join(','), ...rows].join('\n')
}

export const BackupService = {
  captureBackupData,
  serializeBackup,
  parseBackup,
  validateBackupFile,
  restoreBackup,
  downloadBlob,
  backupToBlob,
  readFileAsText,
  transactionsToCsv,
}
