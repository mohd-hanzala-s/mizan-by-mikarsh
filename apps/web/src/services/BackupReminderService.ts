import type { DashboardAlert } from '@/services/DashboardService'
import type { Settings } from '@/types/entities'

const DAY_MS = 24 * 60 * 60 * 1000

/** How overdue a backup needs to be, per frequency, before it's actually
 * worth nagging about — deliberately a little more lenient than the exact
 * frequency so this doesn't fire the day after a "weekly" backup just
 * because it's been 7 days and 1 hour. */
const GRACE_DAYS: Record<'weekly' | 'monthly', number> = {
  weekly: 9,
  monthly: 35,
}

/** True when `settings.backupFrequency` is anything other than "off" and
 * more than the frequency's grace period has passed since
 * `settings.lastBackupAt` (or since ever, if no backup has been made). */
export function isBackupDue(settings: Settings, now: Date = new Date()): boolean {
  if (settings.backupFrequency === 'off') return false

  if (!settings.lastBackupAt) return true

  const graceDays = GRACE_DAYS[settings.backupFrequency]
  const elapsedMs = now.getTime() - new Date(settings.lastBackupAt).getTime()
  return elapsedMs >= graceDays * DAY_MS
}

/** Dashboard alert for a due backup, or an empty array otherwise — shaped
 * to slot directly into DashboardPage's existing `alerts` array alongside
 * budget/recurring/loan alerts (see DashboardService.getAlerts). */
export function getBackupAlert(settings: Settings, now: Date = new Date()): DashboardAlert[] {
  if (!isBackupDue(settings, now)) return []

  const message = settings.lastBackupAt
    ? `Your ${settings.backupFrequency} backup is overdue — last one was ${new Date(settings.lastBackupAt).toLocaleDateString('en-IN')}.`
    : `You haven't backed up your data yet. Export a backup from Insights → Reports.`

  return [{ id: 'backup-reminder', message, severity: 'info' }]
}

export const BackupReminderService = {
  isBackupDue,
  getBackupAlert,
}
