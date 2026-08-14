import { BudgetService, computeBudgetStatus } from '@/services/BudgetService'
import { getRecurringAlerts } from '@/services/RecurringService'
import { LoanService } from '@/services/LoanService'
import type {
  Transaction,
  Budget,
  RecurringRule,
  Loan,
  LoanPayment,
  Category,
} from '@/types/entities'

export interface AppNotification {
  id: string
  title: string
  body: string
  timestamp: string
  read: boolean
  category: 'budget' | 'recurring' | 'loan' | 'goal'
}

const NOTIFICATION_STORAGE_KEY = 'mizan-notifications'
const MAX_STORED = 50

export const NotificationService = {
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied'
    }
    const result = await Notification.requestPermission()
    return result
  },

  getPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied'
    return Notification.permission
  },

  async sendBrowserNotification(title: string, body: string): Promise<void> {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    try {
      const registration = await navigator.serviceWorker?.ready
      if (registration) {
        await registration.showNotification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'mizan-alert',
          requireInteraction: false,
        })
      }
    } catch {
      new Notification(title, { body })
    }
  },

  getStoredNotifications(): AppNotification[] {
    try {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  addStoredNotification(notification: AppNotification): void {
    try {
      const existing = this.getStoredNotifications()
      const updated = [notification, ...existing].slice(0, MAX_STORED)
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // localStorage not available
    }
  },

  markAsRead(id: string): void {
    try {
      const stored = this.getStoredNotifications()
      const updated = stored.map((n) => (n.id === id ? { ...n, read: true } : n))
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // localStorage not available
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(NOTIFICATION_STORAGE_KEY)
    } catch {
      // localStorage not available
    }
  },

  async generateAlerts(
    transactions: Transaction[],
    budgets: Budget[],
    rules: RecurringRule[],
    loans: Loan[],
    loanPayments: LoanPayment[],
    categories: Category[],
    budgetMonthStart: number
  ): Promise<AppNotification[]> {
    const now = new Date().toISOString()
    const existingIds = new Set(this.getStoredNotifications().map((n) => n.id))
    const alerts: AppNotification[] = []

    const budgetStatuses = budgets.map((b) =>
      computeBudgetStatus(b, transactions, budgetMonthStart)
    )
    const budgetAlerts = BudgetService.getAlerts(budgetStatuses, categories)
    for (const alert of budgetAlerts) {
      if (existingIds.has(`budget-${alert.id}`)) continue
      alerts.push({
        id: `budget-${alert.id}`,
        title: 'Budget Alert',
        body: alert.message,
        timestamp: now,
        read: false,
        category: 'budget',
      })
    }

    const recurringAlerts = getRecurringAlerts(rules, transactions)
    for (const alert of recurringAlerts) {
      if (existingIds.has(`recurring-${alert.id}`)) continue
      alerts.push({
        id: `recurring-${alert.id}`,
        title: 'Recurring Payment',
        body: alert.message,
        timestamp: now,
        read: false,
        category: 'recurring',
      })
    }

    const loanPaymentsByLoan: Record<string, LoanPayment[]> = {}
    for (const p of loanPayments) {
      const list = loanPaymentsByLoan[p.loanId] ?? []
      list.push(p)
      loanPaymentsByLoan[p.loanId] = list
    }
    const loanAlerts = LoanService.getAlerts(loans, loanPaymentsByLoan)
    for (const alert of loanAlerts) {
      if (existingIds.has(`loan-${alert.id}`)) continue
      alerts.push({
        id: `loan-${alert.id}`,
        title: 'Loan Alert',
        body: alert.message,
        timestamp: now,
        read: false,
        category: 'loan',
      })
    }

    for (const alert of alerts) {
      this.addStoredNotification(alert)
      await this.sendBrowserNotification(alert.title, alert.body)
    }

    return alerts
  },

  unreadCount(): number {
    return this.getStoredNotifications().filter((n) => !n.read).length
  },
}
