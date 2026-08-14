import Dexie, { type EntityTable } from 'dexie'
import type {
  Account,
  Category,
  Settings,
  Transaction,
  Favorite,
  Tag,
  Budget,
  RecurringRule,
  Loan,
  LoanPayment,
  Goal,
  GoalContribution,
  Investment,
  BillSplit,
  VaultDocument,
  VaultReminder,
} from '@/types/entities'
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '@/constants/seed-data'

/** The IndexedDB database name used before the product was renamed to
 * Mizan. On the first launch of the new `mizan` database, any data here is
 * copied across (see `migrateFromLegacyIfNeeded`) so existing users don't
 * lose anything to the rename. */
const LEGACY_DB_NAME = 'nexus-finance'

/** Full desired schema at the current version (v8) — shared by the live
 * Dexie version declaration and the legacy-DB reader so the two can never
 * drift apart. */
const CURRENT_SCHEMA = {
  accounts: 'id, type',
  categories: 'id, name, parentCategory',
  settings: 'id',
  transactions:
    'id, transactionDate, categoryId, accountId, amount, type, status, recurringRuleId, loanId',
  favorites: 'id, categoryId, usageCount, lastUsed',
  tags: 'id, &name',
  budgets: 'id, categoryId',
  recurring_rules: 'id, nextExecution',
  loans: 'id, dueDay, status',
  loan_payments: 'id, loanId, paymentDate',
  goals: 'id, status',
  goal_contributions: 'id, goalId, date',
  investments: 'id, type, accountId',
  bill_splits: 'id, transactionId, date',
  vault_documents: 'id, type, documentDate, expiryDate',
  vault_reminders: 'id, documentId, reminderDate',
} as const

const STORE_NAMES = [
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
  'goals',
  'goal_contributions',
  'investments',
  'bill_splits',
  'vault_documents',
  'vault_reminders',
] as const

/**
 * §5 DATA ARCHITECTURE — IndexedDB via Dexie, versioned schema, automatic
 * migrations. Each phase that needs a new store adds it via
 * `db.version(N).stores({...})` — per §11 "never modify schema without
 * migration" — restating the full desired schema for that version (Dexie's
 * own convention; it diffs against the previous version automatically). See
 * CHANGELOG.md for the store(s) each version added.
 */
class MizanDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>
  categories!: EntityTable<Category, 'id'>
  settings!: EntityTable<Settings, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  favorites!: EntityTable<Favorite, 'id'>
  tags!: EntityTable<Tag, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  recurring_rules!: EntityTable<RecurringRule, 'id'>
  loans!: EntityTable<Loan, 'id'>
  loan_payments!: EntityTable<LoanPayment, 'id'>
  goals!: EntityTable<Goal, 'id'>
  goal_contributions!: EntityTable<GoalContribution, 'id'>
  investments!: EntityTable<Investment, 'id'>
  bill_splits!: EntityTable<BillSplit, 'id'>
  vault_documents!: EntityTable<VaultDocument, 'id'>
  vault_reminders!: EntityTable<VaultReminder, 'id'>

  constructor() {
    super('mizan')

    // §5 lists `isArchived` as an index on Account, but IndexedDB doesn't
    // accept `boolean` as a valid key type — Dexie would throw a DataError
    // writing the index entry. Left unindexed; these tables stay small
    // (dozens of rows) so repositories filter in memory instead.
    this.version(1).stores({
      accounts: 'id, type',
      categories: 'id, name, parentCategory',
      settings: 'id',
    })

    // Phase 1 — Core Transaction Engine. Indexes exactly match §5's list for
    // Transaction (transactionDate, categoryId, accountId, amount, type,
    // status, recurringRuleId, loanId); `isFavorite`/`isDeleted` are
    // booleans and, as above, can't be indexed — filtered in memory.
    this.version(2).stores({
      accounts: 'id, type',
      categories: 'id, name, parentCategory',
      settings: 'id',
      transactions:
        'id, transactionDate, categoryId, accountId, amount, type, status, recurringRuleId, loanId',
      favorites: 'id, categoryId, usageCount, lastUsed',
      tags: 'id, &name',
    })

    // Phase 3 — Accounts. No index changes (Transaction.transferDirection
    // is a new unindexed field — IndexedDB doesn't require every stored
    // property to be declared), but bumping the version anyway to mark the
    // checkpoint in the migration history, per §11.
    this.version(3).stores({
      accounts: 'id, type',
      categories: 'id, name, parentCategory',
      settings: 'id',
      transactions:
        'id, transactionDate, categoryId, accountId, amount, type, status, recurringRuleId, loanId',
      favorites: 'id, categoryId, usageCount, lastUsed',
      tags: 'id, &name',
    })

    // Phase 4 — Budgets. Adds `budgets`, indexed on categoryId per §5
    // (GLOBAL_BUDGET_CATEGORY_ID is a plain string, so it indexes fine —
    // see the comment on that constant for why it isn't null).
    this.version(4).stores({
      accounts: 'id, type',
      categories: 'id, name, parentCategory',
      settings: 'id',
      transactions:
        'id, transactionDate, categoryId, accountId, amount, type, status, recurringRuleId, loanId',
      favorites: 'id, categoryId, usageCount, lastUsed',
      tags: 'id, &name',
      budgets: 'id, categoryId',
    })

    // Phase 5 — Recurring Engine. Adds `recurring_rules`, indexed on
    // nextExecution per §5. §5 also lists `active` as an index, but it's a
    // boolean — not a valid IndexedDB key type (same problem `isArchived`
    // caused in Phase 0), so it's filtered in memory; rules are a small
    // table (scalability target: 100+).
    this.version(5).stores({
      accounts: 'id, type',
      categories: 'id, name, parentCategory',
      settings: 'id',
      transactions:
        'id, transactionDate, categoryId, accountId, amount, type, status, recurringRuleId, loanId',
      favorites: 'id, categoryId, usageCount, lastUsed',
      tags: 'id, &name',
      budgets: 'id, categoryId',
      recurring_rules: 'id, nextExecution',
    })

    // Phase 6 — Loan Manager. Adds `loans` (indexed on dueDay, status per
    // §5 — both plain strings/numbers, so no boolean-key problem) and
    // `loan_payments` (indexed on loanId, paymentDate per §5).
    this.version(6).stores(CURRENT_SCHEMA)

    // v2 Phase C — Goals. Adds `goals` (indexed on status) and
    // `goal_contributions` (indexed on goalId, date).
    this.version(7).stores(CURRENT_SCHEMA)

    // Phase 12 — Investments & Bill Splitting. Adds `investments` (indexed
    // on type, accountId) and `bill_splits` (indexed on transactionId,
    // date). Also adds `Account.currency` — a new unindexed field, so no
    // index changes needed for that specifically, but bumping the version
    // anyway to mark the checkpoint (same reasoning as Phase 3's comment
    // above). Existing accounts get backfilled with Settings.currency by
    // AccountRepository.get()/getAll() at read time, the same pattern
    // SettingsRepository already uses for new Settings fields.
    this.version(8).stores(CURRENT_SCHEMA)

    // Phase 13 — Digital Vault. Adds vault_documents and vault_reminders
    // for secure document storage (receipts, bills, warranties, insurance,
    // tax records, vehicle documents, medical records, etc.).
    this.version(9).stores(CURRENT_SCHEMA)

    this.on('populate', () => this.seed())
  }

  /** First-run seed data (§9 Phase 0): default categories, five default
   * accounts, settings row with budgetMonthStart defaulting to the 1st.
   * When `migrateLegacyIfNeeded` captured a pre-rename `nexus-finance`
   * snapshot, that is imported instead (see `captureLegacySnapshot`) so the
   * rename never costs the user their history. */
  private async seed() {
    if (pendingLegacySnapshot) {
      const snapshot = pendingLegacySnapshot
      pendingLegacySnapshot = null
      for (const store of STORE_NAMES) {
        const rows = snapshot[store] ?? []
        if (rows.length > 0) {
          await this.table(store).bulkAdd(rows)
        }
      }
      return
    }
    await this.accounts.bulkAdd(DEFAULT_ACCOUNTS)
    await this.categories.bulkAdd(DEFAULT_CATEGORIES)
    await this.settings.add(DEFAULT_SETTINGS)
  }

  /** One-time migration entry point for the product rename. Call this before
   * the database is first used (App startup): if a `nexus-finance` database
   * with data exists and `mizan` has never been created, snapshots every
   * legacy row into memory so the first `populate` seeds from it instead of
   * defaults. Safe to call repeatedly — it no-ops once `mizan` exists. */
  async migrateLegacyIfNeeded(): Promise<void> {
    if (await Dexie.exists('mizan')) return
    pendingLegacySnapshot = await captureLegacySnapshot()
  }
}

type LegacySnapshot = Partial<Record<(typeof STORE_NAMES)[number], unknown[]>>

/** The `nexus-finance` snapshot to import on the next `mizan` populate, or
 * null once consumed/never present. */
let pendingLegacySnapshot: LegacySnapshot | null = null

/** Snapshots every row of the pre-rename `nexus-finance` database, or null
 * when no such database (or no data) exists. Captured into memory *before*
 * the `mizan` database is ever opened — the `populate` handler then
 * bulk-adds from this in-memory snapshot instead of doing live
 * cross-database I/O inside the creation transaction (IndexedDB forbids
 * opening another connection mid-transaction, and this keeps the real
 * browser path deterministic too). */
async function captureLegacySnapshot(): Promise<LegacySnapshot | null> {
  if (!(await Dexie.exists(LEGACY_DB_NAME))) return null

  const legacy = new Dexie(LEGACY_DB_NAME)
  legacy.version(6).stores(CURRENT_SCHEMA)

  try {
    await legacy.open()
  } catch {
    return null
  }

  try {
    const hasData =
      (await legacy.table('accounts').count()) > 0 ||
      (await legacy.table('transactions').count()) > 0 ||
      (await legacy.table('categories').count()) > 0
    if (!hasData) return null

    const snapshot: LegacySnapshot = {}
    for (const store of STORE_NAMES) {
      snapshot[store] = await legacy.table(store).toArray()
    }
    return snapshot
  } finally {
    legacy.close()
  }
}

export const db = new MizanDB()
