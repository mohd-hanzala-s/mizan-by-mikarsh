/**
 * Domain entity types, mirroring §5 DATA ARCHITECTURE.
 *
 * Only the entities whose object stores exist in the current Dexie schema
 * version are defined here (see src/database/db.ts). Later phases add their
 * entities alongside the migration that creates their store — do not
 * pre-declare types for stores that don't exist yet, so this file always
 * matches the real schema.
 */

export type AccountType = 'cash' | 'bank' | 'creditCard' | 'upiWallet' | 'emergencyFund' | 'other'

/** §5 Account Entity */
export interface Account {
  id: string
  name: string
  type: AccountType
  icon: string
  color: string
  openingBalance: number
  currentBalance: number
  isDefault: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
  /** ISO 4217 code (e.g. 'INR', 'USD'). Display-only — Mizan has no live
   * exchange rates (it's fully offline, §4), so amounts are never
   * converted between currencies. An account's own balance/transactions
   * always show in this currency; aggregates across accounts with
   * different currencies (Dashboard net worth, Reports) flag the mismatch
   * rather than silently summing incompatible values. Defaults to
   * Settings.currency for new accounts. */
  currency: string
}

/** The top-level bucket a category belongs to. Income and expense categories
 * are the selectable taxonomies for transaction entry; `transfer` marks the
 * internal category used by Transfer legs (never shown in the category
 * selector, since transfers are created through a dedicated flow). */
export type CategoryKind = 'income' | 'expense' | 'transfer'

/** §5 Category Entity. `categoryId` on a transaction always points to the
 * most specific category; hierarchy lives here via `parentCategory`. `kind`
 * tags every row with its income/expense/transfer bucket so the category
 * selector can filter options to the transaction type and reject impossible
 * combinations (e.g. an expense category on an income entry). */
export interface Category {
  id: string
  name: string
  icon: string
  color: string
  kind: CategoryKind
  parentCategory: string | null
  displayOrder: number
  isDefault: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

/** Sentinel for a budget that applies across all categories combined
 * (§6: "optional global monthly budget"). Not `null` — IndexedDB can't
 * index a null key, the same problem booleans caused in Phase 0. A plain
 * string sidesteps it entirely while staying indexable. */
export const GLOBAL_BUDGET_CATEGORY_ID = '__global__'

/** §5 Budget Entity. */
export interface Budget {
  id: string
  /** A real Category id, or GLOBAL_BUDGET_CATEGORY_ID. */
  categoryId: string
  monthlyLimit: number
  rolloverEnabled: boolean
  /** % of allocated spend at which the budget's status turns "warning"
   * (before hitting 100%/over). */
  warningThreshold: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type ThemePreference = 'light' | 'dark' | 'system'

/** Four light themes and four dark themes. Each preset belongs to exactly one
 * mode — the theme picker only shows the presets for the currently resolved
 * mode (see `LIGHT_THEME_PRESETS` / `DARK_THEME_PRESETS`). */
export type ThemePreset =
  'classic' | 'modern' | 'paper' | 'soft' | 'midnight' | 'oled' | 'terminal' | 'violet'

export const LIGHT_THEME_PRESETS: ThemePreset[] = ['classic', 'modern', 'paper', 'soft']

export const DARK_THEME_PRESETS: ThemePreset[] = ['midnight', 'oled', 'terminal', 'violet']

export const THEME_PRESETS: ThemePreset[] = [...LIGHT_THEME_PRESETS, ...DARK_THEME_PRESETS]

export type TransactionType =
  'expense' | 'income' | 'transfer' | 'adjustment' | 'refund' | 'reversal'

/** Recurring's own vocabulary (§6), reused here so the schema doesn't need
 * a second status enum when Phase 5 adds recurring-generated entries.
 * Phase 1's manually-entered transactions are always 'paid'. */
export type TransactionStatus = 'paid' | 'pending' | 'skipped' | 'postponed' | 'missed'

export type TransactionSource = 'manual' | 'auto' | 'import'

/**
 * §5 Transaction Entity. `loanId`, `budgetId`, and `recurringRuleId` are
 * declared now (matching the spec's canonical entity) even though the
 * stores they'd reference don't exist until Phase 6/4/5 — Dexie doesn't
 * enforce foreign keys, so this is safe, and it means those phases won't
 * need a Transaction schema migration just to add a field. Phase 1 only
 * ever writes `null` to them.
 */
export interface Transaction {
  id: string
  createdAt: string
  updatedAt: string
  transactionDate: string
  type: TransactionType
  amount: number
  currency: string
  description: string
  categoryId: string
  accountId: string
  recurringRuleId: string | null
  loanId: string | null
  budgetId: string | null
  tags: string[]
  notes: string
  status: TransactionStatus
  source: TransactionSource
  isFavorite: boolean
  isDeleted: boolean
  version: number
  /** Links the two internal entries (debit + credit) of a Transfer so the
   * user sees one transaction. Null for non-transfer types. */
  linkedTransactionId: string | null
  /** Not in §5's field list — needed to tell a transfer's two linked legs
   * apart (which one is "the transfer" in a unified, cross-account list
   * vs. which one only matters when viewing the destination account's own
   * history). Undefined on rows created before Phase 3. */
  transferDirection?: 'debit' | 'credit'
}

/** §5 Favorite Entity — one-tap re-entry of a common transaction. Sorted by
 * usageCount then lastUsed (most-used, most-recent first). */
export interface Favorite {
  id: string
  title: string
  amount: number
  categoryId: string
  usageCount: number
  lastUsed: string
}

/** §5 Tag Entity. Transactions → Tags is many-to-many; a transaction stores
 * tag names directly in `Transaction.tags` (denormalized for fast filtering
 * on a client-only DB with no join support), and this store exists so tags
 * are real, renameable, listable entities rather than untracked strings. */
export interface Tag {
  id: string
  name: string
  createdAt: string
}

/** §6 Recurring frequencies: Daily/Weekly/Monthly/Quarterly/Half-Yearly/
 * Yearly/Custom. `custom` is meaningless without a day count, which lives
 * in `RecurringRule.customIntervalDays`. */
export type RecurringFrequency =
  'daily' | 'weekly' | 'monthly' | 'quarterly' | 'halfYearly' | 'yearly' | 'custom'

/** §5 Recurring Rule Entity. The schedule is described by
 * `frequency` + `startDate` + (for `custom`) `customIntervalDays`; the
 * derived next occurrence is materialized in `nextExecution` so generation
 * and reminders are a single index/field read instead of recomputing
 * schedule math on every check. */
export interface RecurringRule {
  id: string
  title: string
  amount: number
  /** Whether each generated entry is an expense or income — needed to build
   * the Transaction it creates. Not in §5's field list (the entity has no
   * type field at all), but a rule that generates transactions must know
   * which; inferring from the category is brittle. */
  type: 'expense' | 'income'
  categoryId: string
  /** Not in §5's field list — it predates the Account promotion, and §6's
   * recurring rules clearly post to one account. Required here for the same
   * reason `Transaction.accountId` is required. */
  accountId: string
  frequency: RecurringFrequency
  /** ISO date (yyyy-mm-dd) of the first scheduled occurrence. */
  startDate: string
  /** ISO date (yyyy-mm-dd) of the last occurrence, or null for no end. */
  endDate: string | null
  /** ISO datetime of the next occurrence to generate/remind on. Always
   * advanced forward (never left in the past) by the generation pass. */
  nextExecution: string
  /** Whether the scheduler creates a pending Transaction on each
   * occurrence. When false the rule only reminds; the user logs the
   * payment themselves. */
  autoGenerate: boolean
  /** Days before `nextExecution` to start surfacing an "upcoming" alert
   * (0 = on the day). */
  reminderDays: number
  /** `active` = schedule is running. Pause sets false (generation stops,
   * nextExecution is not advanced); resume re-arms from today. */
  active: boolean
  /** Only meaningful when `frequency === 'custom'` — day count between
   * occurrences. */
  customIntervalDays?: number
  createdAt: string
  updatedAt: string
}

/** §6 Loan status. `active` = repaying; `completed` = currentBalance has
 * been driven to 0 by recorded payments. Stored (and indexed, per §5) so
 * the Loans page and alerts can query it directly. */
export type LoanStatus = 'active' | 'completed'

/** §5 Loan Entity. Deliberately has no accountId — recording an EMI reduces
 * the loan's own `currentBalance` and writes a `LoanPayment` row; it does
 * not post to the ledger (the optional `Transaction.loanId` link is
 * reserved for manual EMI expenses and later analysis phases). */
export interface Loan {
  id: string
  loanName: string
  lender: string
  originalAmount: number
  /** Outstanding balance. Driven down only by recorded payments; never
   * negative (§6 data integrity). */
  currentBalance: number
  monthlyEMI: number
  /** Annual percentage rate, or null when interest isn't tracked (payments
   * are then all principal). */
  interestRate: number | null
  /** ISO date (yyyy-mm-dd) the loan started. */
  startDate: string
  /** ISO date (yyyy-mm-dd) of the last expected EMI, or null for none. */
  endDate: string | null
  /** Day of month the EMI is due (1–31); clamped to month-end. */
  dueDay: number
  status: LoanStatus
  notes: string
  createdAt: string
  updatedAt: string
}

/** §5 Loan Payment Entity — one recorded EMI. `remainingBalance` is the
 * loan's outstanding balance immediately after this payment. */
export interface LoanPayment {
  id: string
  loanId: string
  /** ISO date (yyyy-mm-dd) the payment was made. */
  paymentDate: string
  amountPaid: number
  /** Amount of `amountPaid` that reduced principal (never negative). */
  principalPaid: number
  /** Amount of `amountPaid` allocated to interest (0 when the loan doesn't
   * track interest). */
  interestPaid: number
  /** Loan.currentBalance after this payment. */
  remainingBalance: number
  notes: string
  createdAt: string
  updatedAt: string
}

export type ChartStyle = 'rounded' | 'flat' | 'gradient' | 'professional'
export type CardStyle = 'outlined' | 'filled' | 'elevated' | 'minimal'
export type AnimationLevel = 'off' | 'reduced' | 'normal' | 'fluid'
export type Density = 'compact' | 'comfortable' | 'relaxed'
export type CornerRadius = 'sharp' | 'medium' | 'rounded'
export type FontFamily = 'inter' | 'satoshi' | 'geist' | 'sf-pro' | 'ibm-plex'
export type DashboardLayout = 'cards' | 'grid' | 'widgets' | 'compact' | 'executive'

export type ProfileType = 'student' | 'employee' | 'business' | 'freelancer' | 'family' | 'retired'
export type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type RiskAppetite = 'conservative' | 'balanced' | 'aggressive'

export interface AiFeatures {
  forecasting: boolean
  recommendations: boolean
  autoCategorize: boolean
  budgetSuggestions: boolean
  goalPrediction: boolean
}

export interface FinancialIdentity {
  id: 'active'
  displayName: string
  profileType: ProfileType
  monthlyIncome: number
  incomeFrequency: IncomeFrequency
  salaryDay: number
  employmentType: string
  employerName: string
  dependents: number
  taxBracket: string
  country: string
  language: string
  weekStartsOn: number
  riskAppetite: RiskAppetite
  aiFeatures: AiFeatures
}

/** §5 Settings Entity — single active record. */
export interface Settings {
  id: 'active'
  theme: ThemePreference
  /** Color variant within the resolved mode — one of four light or four dark
   * presets, matching `theme`'s resolved light/dark side. */
  themePreset: ThemePreset
  currency: string
  currencyDisplay: 'lakh-crore' | 'international'
  dateFormat: string
  language: string
  defaultView: string
  budgetMonthStart: number
  backupFrequency: 'off' | 'weekly' | 'monthly'
  firstDayOfWeek: number
  animationEnabled: boolean
  hapticFeedback: boolean
  compactMode: boolean
  appLockEnabled: boolean
  /** Salted SHA-256 hex digest of the app-lock PIN, or null if no PIN is
   * set. Not in §5's Settings field list — added because §4 says the app
   * lock "setting" lives in Settings but only enumerates the boolean; the
   * PIN itself needs storage somewhere. Never store the raw PIN. */
  appLockPinHash: string | null
  /** Minutes of inactivity (app in background/hidden) before re-locking.
   * `0` = lock immediately on backgrounding; `null` = never auto-lock while
   * the app stays open (still locks on a fresh launch). Ignored when
   * appLockEnabled is false. See App.tsx's visibilitychange handling. */
  appLockTimeoutMinutes: number | null
  developerMode: boolean
  accentColor: string
  chartStyle: ChartStyle
  cardStyle: CardStyle
  animationLevel: AnimationLevel
  density: Density
  cornerRadius: CornerRadius
  fontFamily: FontFamily
  dashboardLayout: DashboardLayout
  /** Not in §5's field list — needed to gate the onboarding carousel vs. the
   * Dashboard on subsequent launches. */
  onboardingCompleted: boolean
  /** User opted into "load sample data" during onboarding (§9), but the
   * `transactions` store doesn't exist until Phase 1. This flag is read and
   * cleared by Phase 1's migration once it can actually seed sample
   * transactions. */
  sampleDataRequested: boolean
  /** ISO timestamp of the last successful backup export, or null if none
   * yet — drives the "backup is due" reminder alongside backupFrequency.
   * See BackupReminderService. */
  lastBackupAt: string | null
}

/** Goal types. */
export type GoalType =
  | 'emergency_fund'
  | 'house'
  | 'vehicle'
  | 'education'
  | 'retirement'
  | 'travel'
  | 'investment'
  | 'gadget'
  | 'wedding'
  | 'custom'
export type GoalStatus = 'active' | 'completed' | 'cancelled'

/** §14 Goal Entity — savings, debt payoff, and purchase targets. */
export interface Goal {
  id: string
  name: string
  type: GoalType
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  deadline: string | null
  categoryId: string | null
  icon: string
  status: GoalStatus
  notes: string
  createdAt: string
  updatedAt: string
}

/** §14 Goal Contribution Entity — one recorded progress step toward a goal. */
export interface GoalContribution {
  id: string
  goalId: string
  amount: number
  date: string
  notes: string
  createdAt: string
}

/** Investment holding types. No live market data — this is fully offline
 * (§4) — so `currentPricePerUnit` is a manual mark the user updates
 * themselves, not a fetched quote. */
export type InvestmentType = 'stock' | 'mutual_fund' | 'fixed_deposit' | 'other'
export type InvestmentStatus = 'active' | 'sold'

export interface Investment {
  id: string
  name: string
  type: InvestmentType
  /** Units/quantity held. Fixed deposits and "other" lump-sum holdings use
   * 1 — average cost and current value are then just the deposited/current
   * amount. */
  units: number
  avgCostPerUnit: number
  currentPricePerUnit: number
  /** ISO date the price was last updated — shown as "as of" in the UI so
   * a stale manual mark is visibly stale, not mistaken for a live quote. */
  priceUpdatedAt: string
  /** The account this holding's cash flows are tracked through, or null
   * if not linked to one. */
  accountId: string | null
  status: InvestmentStatus
  notes: string
  createdAt: string
  updatedAt: string
}

/** One participant's share of a BillSplit — not a real user account (this
 * is a single-user, offline app), just a name and how much of the total
 * they owe the person who actually paid. */
export interface BillSplitParticipant {
  id: string
  name: string
  shareAmount: number
  isSettled: boolean
  settledAt: string | null
}

/** §Bill Splitting — tracks a shared expense the user paid in full and who
 * owes them what. Optionally linked to the real Transaction that recorded
 * the actual payment, so the expense still shows correctly in the
 * account/budget it was paid from; the split itself is just a ledger of
 * who owes the payer, with no money movement of its own. */
export interface BillSplit {
  id: string
  description: string
  totalAmount: number
  transactionId: string | null
  participants: BillSplitParticipant[]
  date: string
  notes: string
  createdAt: string
  updatedAt: string
}

/**
 * Digital Vault — secure document storage.
 * Each document represents a receipt, bill, warranty, insurance policy,
 * tax record, vehicle document, medical record, bank statement, or any
 * other important file in the user's financial life.
 */
export type VaultDocumentType =
  | 'receipt'
  | 'bill'
  | 'warranty'
  | 'insurance'
  | 'tax'
  | 'vehicle'
  | 'medical'
  | 'bank_statement'
  | 'other'

export interface VaultDocument {
  id: string
  title: string
  type: VaultDocumentType
  description: string
  tags: string[]
  documentDate: string
  expiryDate: string | null
  /** Base64-encoded file data */
  fileData: string
  fileName: string
  fileType: string
  fileSize: number
  /** Base64-encoded thumbnail */
  thumbnailData: string | null
  isFavorite: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

/** Reminder linked to a vault document */
export interface VaultReminder {
  id: string
  documentId: string
  title: string
  reminderDate: string
  /** days before expiry to fire */
  daysBefore: number
  isRead: boolean
  createdAt: string
}
