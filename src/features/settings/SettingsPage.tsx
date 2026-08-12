import { AppearanceSettings } from './ThemeToggle'
import { AppLockSettings } from './AppLockSettings'
import { BackupFrequencyPicker } from './BackupFrequencyPicker'

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-24 p-24">
      <h1 className="text-h2 text-text-primary">Settings</h1>

      <AppearanceSettings />

      <section className="flex flex-col gap-12">
        <h2 className="text-overline text-text-tertiary">Backup</h2>
        <BackupFrequencyPicker />
      </section>

      <section className="flex flex-col gap-12">
        <h2 className="text-overline text-text-tertiary">Security</h2>
        <AppLockSettings />
      </section>

      <p className="text-body-sm text-text-tertiary">
        Data, categories, and backups are managed on the Reports screen.
      </p>
    </div>
  )
}
