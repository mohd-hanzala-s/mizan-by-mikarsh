import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/database/db'
import {
  captureBackupData,
  serializeBackup,
  parseBackup,
  validateBackupFile,
  restoreBackup,
  transactionsToCsv,
  backupToBlob,
  BACKUP_FORMAT,
} from '@/services/BackupService'
import type { Account, Transaction } from '@/types/entities'

const now = () => new Date().toISOString()

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-test',
    name: 'Test Cash',
    type: 'cash',
    icon: 'banknote',
    color: '#10B981',
    openingBalance: 0,
    currentBalance: 100,
    isDefault: false,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
    currency: 'INR',
    ...overrides,
  }
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'txn-1',
    createdAt: now(),
    updatedAt: now(),
    transactionDate: '2026-06-05',
    type: 'expense',
    amount: 500,
    currency: 'INR',
    description: 'Groceries',
    categoryId: 'cat-food',
    accountId: 'acc-cash',
    recurringRuleId: null,
    loanId: null,
    budgetId: null,
    tags: ['food', 'daily'],
    notes: '',
    status: 'paid',
    source: 'manual',
    isFavorite: false,
    isDeleted: false,
    version: 1,
    linkedTransactionId: null,
    ...overrides,
  }
}

describe('BackupService', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await db.settings.update('active', { onboardingCompleted: true })
  })

  it('captures every store', async () => {
    await db.accounts.add(makeAccount())
    await db.transactions.add(makeTransaction())
    const data = await captureBackupData()
    expect(data.accounts.some((a) => a.id === 'acc-test')).toBe(true)
    expect(data.transactions).toHaveLength(1)
    expect(data.categories.length).toBeGreaterThan(0)
    expect(data.settings).toHaveLength(1)
    expect(data.loans).toEqual([])
    expect(data.loan_payments).toEqual([])
  })

  it('serializes a plain backup with metadata and all stores', async () => {
    await db.transactions.add(makeTransaction())
    const data = await captureBackupData()
    const { json, encrypted } = await serializeBackup(data)
    expect(encrypted).toBe(false)
    const file = JSON.parse(json)
    expect(file.format).toBe(BACKUP_FORMAT)
    expect(file.app).toBe('mizan')
    expect(file.encrypted).toBe(false)
    expect(file.dbVersion).toBe(6)
    expect(Date.parse(file.createdAt)).not.toBeNaN()
    expect(file.data.transactions).toHaveLength(1)
    expect(file.data.accounts.some((a: Account) => a.id === 'acc-bank')).toBe(true)
  })

  it('round-trips a plain backup through parseBackup', async () => {
    await db.transactions.add(makeTransaction({ id: 'txn-a', amount: 250 }))
    const { json } = await serializeBackup(await captureBackupData())
    const parsed = await parseBackup(json)
    expect(parsed.transactions).toHaveLength(1)
    expect(parsed.transactions[0].amount).toBe(250)
  })

  it('encrypts with a passphrase and decrypts back', async () => {
    await db.transactions.add(makeTransaction({ id: 'txn-a', description: 'Secret lunch' }))
    const data = await captureBackupData()
    const { json, encrypted } = await serializeBackup(data, { passphrase: 'correct horse' })
    expect(encrypted).toBe(true)

    const file = JSON.parse(json)
    expect(file.encrypted).toBe(true)
    expect(file.algorithm).toBe('AES-GCM')
    expect(file.kdf).toBe('PBKDF2')
    expect(typeof file.ciphertext).toBe('string')

    const parsed = await parseBackup(json, { passphrase: 'correct horse' })
    expect(parsed.transactions[0].description).toBe('Secret lunch')
  })

  it('rejects the wrong passphrase', async () => {
    const data = await captureBackupData()
    const { json } = await serializeBackup(data, { passphrase: 'right' })
    await expect(parseBackup(json, { passphrase: 'wrong' })).rejects.toThrow()
  })

  it('requires a passphrase to open an encrypted backup', async () => {
    const data = await captureBackupData()
    const { json } = await serializeBackup(data, { passphrase: 'right' })
    await expect(parseBackup(json)).rejects.toThrow(/passphrase/i)
  })

  it('validateBackupFile rejects non-backup objects', () => {
    expect(() => validateBackupFile({ format: 'something-else' })).toThrow(/not a Mizan backup/)
    expect(() => validateBackupFile({ format: BACKUP_FORMAT, app: 'other' })).toThrow(
      /not created by Mizan/
    )
    expect(() => validateBackupFile(null)).toThrow(/not a valid Mizan backup/)
    expect(() => validateBackupFile('hello')).toThrow(/not a valid Mizan backup/)
  })

  it('validateBackupFile rejects missing stores in plain backups', () => {
    const file = {
      format: BACKUP_FORMAT,
      version: 1,
      app: 'mizan',
      dbVersion: 6,
      createdAt: now(),
      encrypted: false,
      data: { accounts: [] },
    }
    expect(() => validateBackupFile(file)).toThrow(/missing the "categories" table/)
  })

  it('restoreBackup replaces the entire database', async () => {
    await db.transactions.add(makeTransaction({ id: 'txn-old' }))
    const restoreData = await captureBackupData()
    restoreData.transactions = [
      makeTransaction({ id: 'txn-restored', description: 'Restored entry' }),
    ]

    await restoreBackup(restoreData)
    const all = await db.transactions.toArray()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('txn-restored')
    expect(all[0].description).toBe('Restored entry')
  })

  it('restoreBackup throws on malformed data', async () => {
    const bad = { ...(await captureBackupData()), transactions: 'nope' as unknown as Transaction[] }
    await expect(restoreBackup(bad)).rejects.toThrow(/missing the "transactions" table/)
  })

  it('exported and imported data match after a full round-trip', async () => {
    await db.transactions.add(makeTransaction({ id: 'txn-1', amount: 500 }))
    await db.transactions.add(makeTransaction({ id: 'txn-2', amount: 200, type: 'income' }))
    await db.accounts.add(makeAccount({ id: 'acc-test', name: 'Bank' }))

    const exported = await captureBackupData()
    const { json } = await serializeBackup(exported)
    const imported = await parseBackup(json)
    await db.delete()
    await db.open()
    await restoreBackup(imported)

    expect(await db.transactions.count()).toBe(2)
    expect(await db.accounts.count()).toBe(exported.accounts.length)
    const restoredTxns = await db.transactions.toArray()
    const restoredAccounts = await db.accounts.toArray()
    expect(restoredTxns.map((t) => t.amount).sort()).toEqual([200, 500])
    expect(restoredAccounts.find((a) => a.id === 'acc-test')?.name).toBe('Bank')
    expect(restoredAccounts.map((a) => a.id).sort()).toEqual(
      exported.accounts.map((a) => a.id).sort()
    )
  })

  it('serializes a backup to a Blob with the right MIME type', () => {
    const blob = backupToBlob('{}', false)
    expect(blob.type).toBe('application/json')
    const enc = backupToBlob('{}', true)
    expect(enc.type).toBe('application/octet-stream')
  })
})

describe('transactionsToCsv', () => {
  it('emits a header plus rows, oldest first, excluding soft-deleted', () => {
    const txs = [
      makeTransaction({ id: 't1', transactionDate: '2026-06-10', description: 'Zebra' }),
      makeTransaction({ id: 't2', transactionDate: '2026-06-05', description: 'Apple' }),
      makeTransaction({
        id: 't3',
        transactionDate: '2026-06-07',
        description: 'Gone',
        isDeleted: true,
      }),
    ]
    const csv = transactionsToCsv(txs)
    const lines = csv.split('\n')
    expect(lines[0]).toBe(
      'date,type,amount,currency,description,categoryId,accountId,status,source,tags,notes'
    )
    expect(lines[1]).toContain('2026-06-05')
    expect(lines[1]).toContain('Apple')
    expect(lines[2]).toContain('2026-06-10')
    expect(csv).not.toContain('Gone')
  })

  it('escapes commas and quotes in fields', () => {
    const txs = [makeTransaction({ description: 'Chai, "special"', notes: 'line1\nline2' })]
    const csv = transactionsToCsv(txs)
    expect(csv).toContain('"Chai, ""special"""')
    expect(csv).toContain('"line1\nline2"')
  })
})
