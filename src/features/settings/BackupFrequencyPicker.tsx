import { useSettingsStore } from '@/app/settingsStore'
import type { Settings } from '@/types/entities'

const FREQ_OPTIONS: { value: Settings['backupFrequency']; label: string; desc: string }[] = [
  { value: 'off', label: 'Off', desc: 'Only manual backups' },
  { value: 'weekly', label: 'Weekly', desc: 'Remind every week' },
  { value: 'monthly', label: 'Monthly', desc: 'Remind every month' },
]

export function BackupFrequencyPicker() {
  const settings = useSettingsStore((s) => s.settings)
  const update = useSettingsStore((s) => s.update)
  const current = settings?.backupFrequency ?? 'monthly'

  return (
    <div className="rounded-md border border-border bg-surface-card p-16">
      <p className="text-body-sm text-text-secondary mb-12">
        How often should Mizan remind you to back up your data?
      </p>
      <div className="flex flex-col gap-8" role="radiogroup" aria-label="Backup reminder frequency">
        {FREQ_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-12 rounded-md px-12 py-8 transition-colors hover:bg-surface-elevated"
          >
            <input
              type="radio"
              name="backupFrequency"
              value={opt.value}
              checked={current === opt.value}
              onChange={() => update({ backupFrequency: opt.value })}
              className="size-20 accent-income"
            />
            <span className="flex flex-col">
              <span className="text-body-sm font-medium text-text-primary">{opt.label}</span>
              <span className="text-caption text-text-tertiary">{opt.desc}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
