import { db } from '@/database/db'
import type { Account } from '@/types/entities'

/** Backfills `currency` for accounts created before that field existed —
 * same reasoning as SettingsRepository.get()'s default-merge: Dexie won't
 * retroactively add a new field to already-stored rows. Defaults to INR,
 * matching DEFAULT_SETTINGS.currency and the (currently hardcoded)
 * Transaction.currency default — not importing SettingsRepository here to
 * avoid a repository-to-repository dependency for one fallback value. */
function withDefaults(account: Account): Account {
  return { ...account, currency: account.currency ?? 'INR' }
}

export const AccountRepository = {
  async getAll(): Promise<Account[]> {
    const all = await db.accounts.toArray()
    return all.filter((a) => !a.isArchived).map(withDefaults)
  },

  /** Includes archived accounts — the Accounts management screen needs to
   * show and unarchive them; every other consumer wants `getAll()`. */
  async getAllIncludingArchived(): Promise<Account[]> {
    const all = await db.accounts.toArray()
    return all.map(withDefaults)
  },

  async getById(id: string): Promise<Account | undefined> {
    const account = await db.accounts.get(id)
    return account ? withDefaults(account) : undefined
  },

  async add(account: Account): Promise<void> {
    await db.accounts.add(account)
  },

  async update(id: string, patch: Partial<Account>): Promise<void> {
    await db.accounts.update(id, { ...patch, updatedAt: new Date().toISOString() })
  },

  /** Adds `delta` to an account's current balance (negative to subtract).
   * Callers are expected to run this inside a db.transaction() alongside
   * the transaction write it's balancing (see TransactionService) so the
   * two never drift out of sync. */
  async adjustBalance(accountId: string, delta: number): Promise<void> {
    const account = await db.accounts.get(accountId)
    if (!account) throw new Error(`Account ${accountId} not found`)
    await db.accounts.update(accountId, {
      currentBalance: account.currentBalance + delta,
      updatedAt: new Date().toISOString(),
    })
  },
}
