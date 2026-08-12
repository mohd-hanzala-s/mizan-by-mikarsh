import { startOfDay } from 'date-fns'
import { localDateKey, startOfStoredDate } from '@/utils/dates'
import { isTransferCreditLeg } from '@/utils/transactions'
import { addOccurrence, computeNextExecution } from '@/services/RecurringService'
import { nextDueDate } from '@/services/LoanService'
import type { Loan, LoanPayment, RecurringRule, Transaction, Goal, VaultDocument } from '@/types/entities'

export type CalendarEventKind =
  | 'transaction'
  | 'recurring'
  | 'loan'
  | 'goal_milestone'
  | 'document_expiry'
  | 'tax_reminder'
  | 'credit_card_due'

export interface CalendarEvent {
  id: string
  date: Date
  kind: CalendarEventKind
  title: string
  amount: number
  category?: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_RECURRING_OCCURRENCES = 62

function signedAmount(t: Transaction): number {
  return t.type === 'expense' ? -t.amount : t.amount
}

function transactionEvents(transactions: Transaction[], start: Date, end: Date): CalendarEvent[] {
  const out: CalendarEvent[] = []
  for (const t of transactions) {
    if (t.isDeleted || t.type === 'transfer' || isTransferCreditLeg(t)) continue
    const date = startOfStoredDate(t.transactionDate)
    if (date.getTime() < start.getTime() || date.getTime() >= end.getTime()) continue
    out.push({
      id: `tx-${t.id}`,
      date,
      kind: 'transaction',
      title: t.description.trim() || 'Transaction',
      amount: signedAmount(t),
    })
  }
  return out
}

function recurringEvents(
  rules: RecurringRule[],
  start: Date,
  end: Date,
  today: Date
): CalendarEvent[] {
  const out: CalendarEvent[] = []
  for (const rule of rules) {
    if (!rule.active) continue
    let occ = computeNextExecution(rule.startDate, rule.frequency, rule.customIntervalDays, today)
    if (occ.getTime() <= today.getTime()) {
      occ = addOccurrence(occ, rule.frequency, rule.customIntervalDays)
    }
    let guard = 0
    while (occ.getTime() < end.getTime() && guard < MAX_RECURRING_OCCURRENCES) {
      if (occ.getTime() >= start.getTime()) {
        out.push({
          id: `rec-${rule.id}-${localDateKey(occ)}`,
          date: occ,
          kind: 'recurring',
          title: rule.title,
          amount: rule.type === 'income' ? rule.amount : -rule.amount,
        })
      }
      occ = addOccurrence(occ, rule.frequency, rule.customIntervalDays)
      guard++
    }
  }
  return out
}

function loanEvents(
  loans: Loan[],
  payments: LoanPayment[],
  start: Date,
  end: Date,
  today: Date
): CalendarEvent[] {
  const out: CalendarEvent[] = []
  const nameById = new Map(loans.map((l) => [l.id, l.loanName]))
  const name = (id: string) => nameById.get(id) ?? 'Loan'

  for (const loan of loans) {
    if (loan.status !== 'active' || loan.currentBalance <= 0) continue
    const due = nextDueDate(loan, today)
    if (due && due.getTime() >= start.getTime() && due.getTime() < end.getTime()) {
      out.push({
        id: `loan-due-${loan.id}`,
        date: due,
        kind: 'loan',
        title: `EMI due · ${loan.loanName}`,
        amount: -loan.monthlyEMI,
      })
    }
  }

  for (const p of payments) {
    const date = startOfDay(new Date(`${p.paymentDate}T00:00:00`))
    if (date.getTime() < start.getTime() || date.getTime() >= end.getTime()) continue
    out.push({
      id: `loan-pay-${p.id}`,
      date,
      kind: 'loan',
      title: `EMI paid · ${name(p.loanId)}`,
      amount: -p.amountPaid,
    })
  }
  return out
}

function goalMilestoneEvents(goals: Goal[], start: Date, end: Date): CalendarEvent[] {
  const out: CalendarEvent[] = []
  for (const g of goals) {
    if (!g.deadline || g.status !== 'active') continue
    const date = startOfDay(new Date(`${g.deadline}T00:00:00`))
    if (date.getTime() < start.getTime() || date.getTime() >= end.getTime()) continue
    out.push({
      id: `goal-${g.id}`,
      date,
      kind: 'goal_milestone',
      title: g.name,
      amount: g.targetAmount - g.currentAmount,
      category: g.type,
    })
  }
  return out
}

function documentExpiryEvents(docs: VaultDocument[], start: Date, end: Date): CalendarEvent[] {
  const out: CalendarEvent[] = []
  for (const d of docs) {
    if (!d.expiryDate) continue
    const date = startOfDay(new Date(`${d.expiryDate}T00:00:00`))
    if (date.getTime() < start.getTime() || date.getTime() >= end.getTime()) continue
    out.push({
      id: `doc-${d.id}`,
      date,
      kind: 'document_expiry',
      title: d.title,
      amount: 0,
      category: d.type,
    })
  }
  return out
}

const TAX_DATES: { month: number; day: number; label: string }[] = [
  { month: 2, day: 31, label: 'Advance Tax (FY End)' },
  { month: 6, day: 31, label: 'ITR Filing Deadline' },
]

function taxReminderEvents(year: number, monthIndex: number): CalendarEvent[] {
  const out: CalendarEvent[] = []
  for (const t of TAX_DATES) {
    if (t.month !== monthIndex) continue
    out.push({
      id: `tax-${year}-${t.month}`,
      date: new Date(year, t.month, t.day),
      kind: 'tax_reminder',
      title: t.label,
      amount: 0,
    })
  }
  return out
}

function creditCardDueEvents(
  rules: RecurringRule[],
  creditCardAccountIds: string[],
  start: Date,
  end: Date,
  today: Date
): CalendarEvent[] {
  const out: CalendarEvent[] = []
  const ccIds = new Set(creditCardAccountIds)
  for (const rule of rules) {
    if (!rule.active || !ccIds.has(rule.accountId)) continue
    let occ = computeNextExecution(rule.startDate, rule.frequency, rule.customIntervalDays, today)
    if (occ.getTime() <= today.getTime()) {
      occ = addOccurrence(occ, rule.frequency, rule.customIntervalDays)
    }
    let guard = 0
    while (occ.getTime() < end.getTime() && guard < MAX_RECURRING_OCCURRENCES) {
      if (occ.getTime() >= start.getTime()) {
        out.push({
          id: `cc-${rule.id}-${localDateKey(occ)}`,
          date: occ,
          kind: 'credit_card_due',
          title: rule.title,
          amount: -rule.amount,
        })
      }
      occ = addOccurrence(occ, rule.frequency, rule.customIntervalDays)
      guard++
    }
  }
  return out
}

export function getMonthEvents(
  year: number,
  monthIndex: number,
  transactions: Transaction[],
  recurringRules: RecurringRule[],
  loans: Loan[],
  loanPayments: LoanPayment[],
  reference: Date = new Date()
): CalendarEvent[] {
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 1)
  const today = startOfDay(reference)

  return [
    ...transactionEvents(transactions, start, end),
    ...recurringEvents(recurringRules, start, end, today),
    ...loanEvents(loans, loanPayments, start, end, today),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function getFinancialMonthEvents(
  year: number,
  monthIndex: number,
  transactions: Transaction[],
  recurringRules: RecurringRule[],
  loans: Loan[],
  loanPayments: LoanPayment[],
  goals: Goal[],
  vaultDocuments: VaultDocument[],
  creditCardAccountIds: string[],
  reference: Date = new Date()
): CalendarEvent[] {
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 1)
  const today = startOfDay(reference)

  return [
    ...transactionEvents(transactions, start, end),
    ...recurringEvents(recurringRules, start, end, today),
    ...loanEvents(loans, loanPayments, start, end, today),
    ...goalMilestoneEvents(goals, start, end),
    ...documentExpiryEvents(vaultDocuments, start, end),
    ...taxReminderEvents(year, monthIndex),
    ...creditCardDueEvents(recurringRules, creditCardAccountIds, start, end, today),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function getDayEvents(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const day = startOfDay(date).getTime()
  return events.filter((e) => e.date.getTime() === day)
}

export function getWeekEvents(events: CalendarEvent[], weekStart: Date): CalendarEvent[] {
  const start = startOfDay(weekStart).getTime()
  return events.filter((e) => e.date.getTime() >= start && e.date.getTime() < start + 7 * DAY_MS)
}

export interface DaySummary {
  count: number
  income: number
  expense: number
  net: number
}

export function getDaySummary(events: CalendarEvent[]): DaySummary {
  let income = 0
  let expense = 0
  for (const e of events) {
    if (e.amount > 0) income += e.amount
    else expense += -e.amount
  }
  return { count: events.length, income, expense, net: income - expense }
}

export function filterEvents(
  events: CalendarEvent[],
  query: string,
  kinds: CalendarEventKind[]
): CalendarEvent[] {
  const q = query.trim().toLowerCase()
  return events.filter((e) => {
    if (kinds.length > 0 && !kinds.includes(e.kind)) return false
    if (q && !e.title.toLowerCase().includes(q)) return false
    return true
  })
}

export function dotColor(event: CalendarEvent): string {
  switch (event.kind) {
    case 'transaction':
      return event.amount > 0 ? 'bg-income' : 'bg-expense'
    case 'recurring':
      return event.amount > 0 ? 'bg-income' : 'bg-warning'
    case 'loan':
      return 'bg-liability'
    case 'goal_milestone':
      return 'bg-brand-teal900'
    case 'document_expiry':
      return 'bg-info'
    case 'tax_reminder':
      return 'bg-expense'
    case 'credit_card_due':
      return 'bg-warning'
  }
}

export const KIND_LABEL: Record<CalendarEventKind, string> = {
  transaction: 'Transaction',
  recurring: 'Recurring',
  loan: 'EMI',
  goal_milestone: 'Goal',
  document_expiry: 'Document',
  tax_reminder: 'Tax',
  credit_card_due: 'Card Due',
}

export const CalendarService = {
  getMonthEvents,
  getFinancialMonthEvents,
  getDayEvents,
  getWeekEvents,
  getDaySummary,
  filterEvents,
  dotColor,
}
