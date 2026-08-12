import { db } from '@/database/db'
import { DEFAULT_SETTINGS } from '@/constants/seed-data'
import type { Settings } from '@/types/entities'

export const SettingsRepository = {
  async get(): Promise<Settings> {
    const settings = await db.settings.get('active')
    if (!settings) {
      throw new Error('Settings row missing — database was not seeded correctly.')
    }
    // Backfills any fields added to Settings after this row was first
    // seeded (e.g. an existing install upgrading to a newer app version)
    // with their defaults, rather than trusting the stored row to already
    // have every current field — Dexie won't add them for us.
    return { ...DEFAULT_SETTINGS, ...settings }
  },

  async update(patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
    await db.settings.update('active', patch)
    return this.get()
  },
}
