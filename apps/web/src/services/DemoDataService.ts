import { AccountRepository } from '@/repositories/AccountRepository'
import { BudgetRepository } from '@/repositories/BudgetRepository'
import { BillSplitRepository } from '@/repositories/BillSplitRepository'
import { FavoriteRepository } from '@/repositories/FavoriteRepository'
import { GoalRepository } from '@/repositories/GoalRepository'
import { InvestmentRepository } from '@/repositories/InvestmentRepository'
import { LoanRepository } from '@/repositories/LoanRepository'
import { RecurringRepository } from '@/repositories/RecurringRepository'
import { SettingsRepository } from '@/repositories/SettingsRepository'
import { TagRepository } from '@/repositories/TagRepository'
import { TransactionRepository } from '@/repositories/TransactionRepository'
import type {
  BillSplit,
  Budget,
  Favorite,
  Goal,
  Investment,
  Loan,
  RecurringRule,
  Transaction,
} from '@/types/entities'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dateAgo(n: number): string {
  return daysAgo(n).slice(0, 10)
}

function makeTx(
  n: number,
  description: string,
  type: Transaction['type'],
  amount: number,
  categoryId: string,
  accountId: string,
  extra?: Partial<Transaction>
): Transaction {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    transactionDate: daysAgo(n),
    type,
    amount,
    currency: 'INR',
    description,
    categoryId,
    accountId,
    recurringRuleId: null,
    loanId: null,
    budgetId: null,
    tags: [],
    notes: '',
    status: 'paid',
    source: 'manual',
    isFavorite: false,
    isDeleted: false,
    version: 1,
    linkedTransactionId: null,
    ...extra,
  }
}

/** Seeds a rich, realistic dataset so a demo/preview launch opens straight
 * onto a populated dashboard. Called only when explicitly requested via
 * `?demo` in the URL (see App.tsx). Idempotent via the `onboardingCompleted`
 * flag — once set, a subsequent load won't re-seed. */
export const DemoDataService = {
  async seed(): Promise<void> {
    const now = new Date().toISOString()

    // 1. Account balances (realistic current state).
    const balances: Record<string, { openingBalance: number; currentBalance: number }> = {
      'acc-bank': { openingBalance: 118000, currentBalance: 126450 },
      'acc-cash': { openingBalance: 5000, currentBalance: 3450 },
      'acc-upi': { openingBalance: 10000, currentBalance: 8280 },
      'acc-credit-card': { openingBalance: -15000, currentBalance: -22150 },
      'acc-emergency-fund': { openingBalance: 250000, currentBalance: 250000 },
    }
    for (const [id, b] of Object.entries(balances)) {
      await AccountRepository.update(id, b)
    }

    // 2. Transactions across three months.
    const txs: Transaction[] = [
      // Salary + side income (monthly cadence).
      makeTx(2, 'Monthly salary', 'income', 125000, 'cat-salary', 'acc-bank'),
      makeTx(32, 'Monthly salary', 'income', 125000, 'cat-salary', 'acc-bank'),
      makeTx(62, 'Monthly salary', 'income', 125000, 'cat-salary', 'acc-bank'),
      makeTx(15, 'Freelance project payout', 'income', 30000, 'cat-salary', 'acc-bank'),
      makeTx(48, 'Interest earned', 'income', 1450, 'cat-other', 'acc-bank'),

      // Housing & utilities.
      makeTx(3, 'House rent', 'expense', 24000, 'cat-utilities', 'acc-bank'),
      makeTx(33, 'House rent', 'expense', 24000, 'cat-utilities', 'acc-bank'),
      makeTx(63, 'House rent', 'expense', 24000, 'cat-utilities', 'acc-bank'),
      makeTx(5, 'Electricity bill', 'expense', 2100, 'cat-utilities', 'acc-bank'),
      makeTx(38, 'Broadband + phone', 'expense', 1299, 'cat-utilities', 'acc-upi'),

      // Groceries & food.
      makeTx(1, 'BigBasket groceries', 'expense', 3200, 'cat-shopping', 'acc-upi'),
      makeTx(7, 'Weekly groceries', 'expense', 2850, 'cat-shopping', 'acc-upi'),
      makeTx(20, 'Monthly grocery run', 'expense', 4600, 'cat-shopping', 'acc-bank'),
      makeTx(0, 'Chai tapri', 'expense', 60, 'cat-food', 'acc-cash'),
      makeTx(2, 'Lunch with team', 'expense', 640, 'cat-food', 'acc-upi'),
      makeTx(6, 'Dinner with family', 'expense', 1850, 'cat-food', 'acc-credit-card'),
      makeTx(11, 'Zomato order', 'expense', 520, 'cat-food-delivery', 'acc-upi'),
      makeTx(18, 'Swiggy Instamart', 'expense', 430, 'cat-food-delivery', 'acc-upi'),
      makeTx(26, 'Dominos pizza night', 'expense', 899, 'cat-food-delivery', 'acc-credit-card'),

      // Transport.
      makeTx(4, 'Petrol fill', 'expense', 2000, 'cat-fuel', 'acc-upi'),
      makeTx(16, 'Petrol fill', 'expense', 1800, 'cat-fuel', 'acc-upi'),
      makeTx(30, 'Uber ride', 'expense', 340, 'cat-fuel', 'acc-upi'),
      makeTx(45, 'Metro card recharge', 'expense', 500, 'cat-fuel', 'acc-upi'),

      // Subscriptions & entertainment.
      makeTx(9, 'Netflix subscription', 'expense', 649, 'cat-entertainment', 'acc-credit-card'),
      makeTx(10, 'Spotify Premium', 'expense', 119, 'cat-entertainment', 'acc-credit-card'),
      makeTx(23, 'Movie night', 'expense', 900, 'cat-entertainment', 'acc-credit-card'),
      makeTx(55, 'Concert tickets', 'expense', 2400, 'cat-entertainment', 'acc-credit-card'),

      // Health & wellness.
      makeTx(8, 'Pharmacy', 'expense', 620, 'cat-health', 'acc-cash'),
      makeTx(28, 'Doctor consultation', 'expense', 800, 'cat-health', 'acc-upi'),
      makeTx(51, 'Gym membership', 'expense', 2000, 'cat-health', 'acc-upi'),

      // Shopping & lifestyle.
      makeTx(13, 'New running shoes', 'expense', 4200, 'cat-shopping', 'acc-credit-card'),
      makeTx(35, 'Winter jacket', 'expense', 3600, 'cat-shopping', 'acc-credit-card'),
      makeTx(58, 'Books', 'expense', 1450, 'cat-shopping', 'acc-upi'),

      // Loans & EMI.
      makeTx(12, 'Car loan EMI', 'expense', 15000, 'cat-emi-loans', 'acc-bank'),
      makeTx(42, 'Car loan EMI', 'expense', 15000, 'cat-emi-loans', 'acc-bank'),
      makeTx(72, 'Car loan EMI', 'expense', 15000, 'cat-emi-loans', 'acc-bank'),
    ]
    for (const tx of txs) await TransactionRepository.add(tx)

    // 3. Budgets (Food, Shopping, Entertainment, Utilities + a global one).
    const budgets: Budget[] = [
      {
        id: 'demo-budget-food',
        categoryId: 'cat-food',
        monthlyLimit: 12000,
        rolloverEnabled: false,
        warningThreshold: 80,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-budget-shopping',
        categoryId: 'cat-shopping',
        monthlyLimit: 15000,
        rolloverEnabled: true,
        warningThreshold: 75,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-budget-entertainment',
        categoryId: 'cat-entertainment',
        monthlyLimit: 6000,
        rolloverEnabled: false,
        warningThreshold: 70,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-budget-global',
        categoryId: '__global__',
        monthlyLimit: 60000,
        rolloverEnabled: false,
        warningThreshold: 85,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const b of budgets) await BudgetRepository.add(b)

    // 4. Goals.
    const goals: Goal[] = [
      {
        id: 'demo-goal-emergency',
        name: 'Emergency fund',
        type: 'emergency_fund',
        targetAmount: 250000,
        currentAmount: 250000,
        monthlyContribution: 10000,
        deadline: null,
        categoryId: null,
        icon: 'ShieldCheck',
        status: 'active',
        notes: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-goal-goa',
        name: 'Goa trip',
        type: 'travel',
        targetAmount: 60000,
        currentAmount: 28500,
        monthlyContribution: 8000,
        deadline: dateAgo(-120),
        categoryId: null,
        icon: 'Plane',
        status: 'active',
        notes: 'With friends in December',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-goal-phone',
        name: 'New phone',
        type: 'gadget',
        targetAmount: 80000,
        currentAmount: 42000,
        monthlyContribution: 6000,
        deadline: dateAgo(-90),
        categoryId: null,
        icon: 'Smartphone',
        status: 'active',
        notes: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-goal-house',
        name: 'House down payment',
        type: 'house',
        targetAmount: 1000000,
        currentAmount: 300000,
        monthlyContribution: 40000,
        deadline: dateAgo(-720),
        categoryId: null,
        icon: 'Home',
        status: 'active',
        notes: '',
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const g of goals) await GoalRepository.add(g)

    // 5. Investments.
    const investments: Investment[] = [
      {
        id: 'demo-inv-mf',
        name: 'Axis Bluechip Fund',
        type: 'mutual_fund',
        units: 1200,
        avgCostPerUnit: 62,
        currentPricePerUnit: 74,
        priceUpdatedAt: now,
        accountId: 'acc-bank',
        status: 'active',
        notes: 'Monthly SIP',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-inv-etf',
        name: 'Nifty 50 Index ETF',
        type: 'stock',
        units: 450,
        avgCostPerUnit: 210,
        currentPricePerUnit: 266,
        priceUpdatedAt: now,
        accountId: 'acc-bank',
        status: 'active',
        notes: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-inv-fd',
        name: 'Fixed deposit',
        type: 'fixed_deposit',
        units: 1,
        avgCostPerUnit: 150000,
        currentPricePerUnit: 150000,
        priceUpdatedAt: now,
        accountId: null,
        status: 'active',
        notes: '12-month FD at 7.2%',
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const inv of investments) await InvestmentRepository.add(inv)

    // 6. Loans.
    const loans: Loan[] = [
      {
        id: 'demo-loan-car',
        loanName: 'Car loan',
        lender: 'HDFC Bank',
        originalAmount: 600000,
        currentBalance: 210000,
        monthlyEMI: 15000,
        interestRate: 9.5,
        startDate: dateAgo(420),
        endDate: dateAgo(-180),
        dueDay: 5,
        status: 'active',
        notes: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-loan-home',
        loanName: 'Home loan',
        lender: 'SBI',
        originalAmount: 4500000,
        currentBalance: 3200000,
        monthlyEMI: 42000,
        interestRate: 8.4,
        startDate: dateAgo(720),
        endDate: dateAgo(-3600),
        dueDay: 7,
        status: 'active',
        notes: '',
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const l of loans) await LoanRepository.add(l)

    // 7. Recurring rules.
    const recurring: RecurringRule[] = [
      {
        id: 'demo-rec-salary',
        title: 'Salary',
        amount: 125000,
        type: 'income',
        categoryId: 'cat-salary',
        accountId: 'acc-bank',
        frequency: 'monthly',
        startDate: dateAgo(180),
        endDate: null,
        nextExecution: dateAgo(-2),
        autoGenerate: true,
        reminderDays: 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-rec-rent',
        title: 'House rent',
        amount: 24000,
        type: 'expense',
        categoryId: 'cat-utilities',
        accountId: 'acc-bank',
        frequency: 'monthly',
        startDate: dateAgo(180),
        endDate: null,
        nextExecution: dateAgo(-1),
        autoGenerate: true,
        reminderDays: 2,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-rec-netflix',
        title: 'Netflix',
        amount: 649,
        type: 'expense',
        categoryId: 'cat-entertainment',
        accountId: 'acc-credit-card',
        frequency: 'monthly',
        startDate: dateAgo(90),
        endDate: null,
        nextExecution: dateAgo(-5),
        autoGenerate: true,
        reminderDays: 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-rec-sip',
        title: 'Mutual fund SIP',
        amount: 10000,
        type: 'expense',
        categoryId: 'cat-transfers',
        accountId: 'acc-bank',
        frequency: 'monthly',
        startDate: dateAgo(300),
        endDate: null,
        nextExecution: dateAgo(-10),
        autoGenerate: true,
        reminderDays: 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const r of recurring) await RecurringRepository.add(r)

    // 8. Bill splits.
    const billSplits: BillSplit[] = [
      {
        id: 'demo-split-dinner',
        description: 'Team dinner',
        totalAmount: 4200,
        transactionId: null,
        participants: [
          {
            id: crypto.randomUUID(),
            name: 'Rohan',
            shareAmount: 1400,
            isSettled: true,
            settledAt: now,
          },
          {
            id: crypto.randomUUID(),
            name: 'Priya',
            shareAmount: 1400,
            isSettled: false,
            settledAt: null,
          },
        ],
        date: daysAgo(6),
        notes: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'demo-split-goa',
        description: 'Goa hotel booking',
        totalAmount: 18000,
        transactionId: null,
        participants: [
          {
            id: crypto.randomUUID(),
            name: 'Aarav',
            shareAmount: 6000,
            isSettled: false,
            settledAt: null,
          },
          {
            id: crypto.randomUUID(),
            name: 'Meera',
            shareAmount: 6000,
            isSettled: false,
            settledAt: null,
          },
        ],
        date: daysAgo(22),
        notes: 'Advance for the December trip',
        createdAt: now,
        updatedAt: now,
      },
    ]
    for (const s of billSplits) await BillSplitRepository.add(s)

    // 9. Tags + favorites.
    await TagRepository.findOrCreate('personal')
    await TagRepository.findOrCreate('work')
    await TagRepository.findOrCreate('family')

    const favorites: Favorite[] = [
      {
        id: 'demo-fav-chai',
        title: 'Chai',
        amount: 60,
        categoryId: 'cat-food',
        usageCount: 12,
        lastUsed: daysAgo(0),
      },
      {
        id: 'demo-fav-petrol',
        title: 'Petrol',
        amount: 2000,
        categoryId: 'cat-fuel',
        usageCount: 8,
        lastUsed: daysAgo(4),
      },
    ]
    for (const f of favorites) await FavoriteRepository.add(f)

    // 10. Mark onboarding complete so the app opens straight onto the
    // dashboard. Also clear the sample-data flag so the two seeding paths
    // never double up.
    await SettingsRepository.update({ onboardingCompleted: true, sampleDataRequested: false })
  },
}
