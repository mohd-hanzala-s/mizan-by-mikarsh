import { AccountRepository } from '@/repositories/AccountRepository'
import type { Account, AccountType } from '@/types/entities'

export interface CreateAccountInput {
  name: string
  type: AccountType
  icon: string
  color: string
  openingBalance: number
  /** ISO 4217 code. Optional — defaults to 'INR' (matching
   * DEFAULT_SETTINGS.currency) when not provided, e.g. from older callers
   * that predate multi-currency accounts. */
  currency?: string
}

export interface UpdateAccountInput {
  name: string
  icon: string
  color: string
  currency?: string
}

export const AccountService = {
  async create(input: CreateAccountInput): Promise<Account> {
    if (!input.name.trim()) throw new Error('Account name is required.')

    const now = new Date().toISOString()
    const account: Account = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      type: input.type,
      icon: input.icon,
      color: input.color,
      openingBalance: input.openingBalance,
      currentBalance: input.openingBalance,
      isDefault: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      currency: input.currency ?? 'INR',
    }
    await AccountRepository.add(account)
    return account
  },

  /** Name/icon/color only — type and openingBalance are fixed after
   * creation. Changing type after transactions exist would make past
   * transaction history semantically inconsistent (e.g. a "Cash" account
   * that used to be a "Credit Card"); changing openingBalance after the
   * fact would require recalculating currentBalance from full history,
   * which isn't worth the complexity for what's meant to be a one-time
   * starting point. */
  async update(id: string, input: UpdateAccountInput): Promise<void> {
    if (!input.name.trim()) throw new Error('Account name is required.')
    await AccountRepository.update(id, {
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
      ...(input.currency ? { currency: input.currency } : {}),
    })
  },

  /** Archiving is reversible (unarchive), so it doesn't need the same
   * "hard delete" ceremony as deleting a category — but it's blocked if
   * this is the last active account, since Smart Entry would have nowhere
   * to post a new transaction to. */
  async archive(id: string): Promise<void> {
    const active = await AccountRepository.getAll()
    if (active.length <= 1 && active.some((a) => a.id === id)) {
      throw new Error('You need at least one active account.')
    }
    await AccountRepository.update(id, { isArchived: true })
  },

  async unarchive(id: string): Promise<void> {
    await AccountRepository.update(id, { isArchived: false })
  },
}
