import { describe, it, expect } from 'vitest'
import { isBackupDue, getBackupAlert } from '@/services/BackupReminderService'
import { DEFAULT_SETTINGS } from '@/constants/seed-data'
import type { Settings } from '@/types/entities'

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('BackupReminderService', () => {
  it('is never due when backupFrequency is off, regardless of last backup', () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, backupFrequency: 'off', lastBackupAt: null }
    expect(isBackupDue(settings)).toBe(false)
  })

  it('is due when a backup has never been made and a frequency is set', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      backupFrequency: 'weekly',
      lastBackupAt: null,
    }
    expect(isBackupDue(settings)).toBe(true)
  })

  it('is not due within the weekly grace period', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      backupFrequency: 'weekly',
      lastBackupAt: daysAgo(3),
    }
    expect(isBackupDue(settings)).toBe(false)
  })

  it('is due once the weekly grace period has passed', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      backupFrequency: 'weekly',
      lastBackupAt: daysAgo(10),
    }
    expect(isBackupDue(settings)).toBe(true)
  })

  it('uses a longer grace period for monthly backups', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      backupFrequency: 'monthly',
      lastBackupAt: daysAgo(10),
    }
    expect(isBackupDue(settings)).toBe(false)
  })

  it('getBackupAlert returns no alert when not due', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      backupFrequency: 'weekly',
      lastBackupAt: daysAgo(1),
    }
    expect(getBackupAlert(settings)).toEqual([])
  })

  it('getBackupAlert returns exactly one info alert when due', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      backupFrequency: 'weekly',
      lastBackupAt: daysAgo(30),
    }
    const alerts = getBackupAlert(settings)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('info')
    expect(alerts[0].id).toBe('backup-reminder')
  })
})
