import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore } from '@/app/settingsStore'
import type { ThemePreference, ThemePreset } from '@/types/entities'
import { cn } from '@/utils/cn'
import {
  THEME_PRESETS,
  ACCENT_COLORS,
  CHART_STYLES,
  CARD_STYLES,
  ANIMATION_LEVELS,
  DENSITY_OPTIONS,
  CORNER_RADIUS_OPTIONS,
  FONT_OPTIONS,
  DASHBOARD_LAYOUTS,
  getAccentColorById,
  applyAccentColor,
  applyPresetTokens,
} from '@/services/ThemeService'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const presetSwatches: Record<ThemePreset, string> = {
  classic: 'linear-gradient(135deg, #F4F6F5 50%, #10201D 50%)',
  modern: 'linear-gradient(135deg, #F8FAFC 50%, #3B82F6 50%)',
  midnight: 'linear-gradient(135deg, #0F172A 50%, #1E3A5F 50%)',
  oled: 'linear-gradient(135deg, #000000 50%, #1A1A1A 50%)',
  minimal: 'linear-gradient(135deg, #FFFFFF 50%, #171717 50%)',
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.7) 50%, rgba(59,130,246,0.3) 50%)',
  paper: 'linear-gradient(135deg, #FAF8F3 50%, #E6E1D7 50%)',
  terminal: 'linear-gradient(135deg, #000000 50%, #00FF00 50%)',
  professional: 'linear-gradient(135deg, #F5F7FA 50%, #0D1E3D 50%)',
  soft: 'linear-gradient(135deg, #F5F0FA 50%, #D8B4FE 50%)',
  warm: 'linear-gradient(135deg, #FEFAFA 50%, #C2410C 50%)',
  cool: 'linear-gradient(135deg, #F0F5FA 50%, #64748B 50%)',
}

export function ThemeToggle() {
  const theme = useSettingsStore((s) => s.settings?.theme ?? 'system')
  const update = useSettingsStore((s) => s.update)

  return (
    <div role="radiogroup" aria-label="Theme" className="card-input inline-flex rounded-2xl p-4">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => update({ theme: value })}
          className={cn(
            'flex min-h-touch items-center gap-8 rounded-xl px-16 text-body-sm font-medium transition-all duration-fast',
            theme === value
              ? 'bg-surface text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Icon className="size-16" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="card-input inline-flex flex-wrap gap-4 rounded-2xl p-4"
    >
      {options.map(({ id, label: optLabel }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            'min-h-touch rounded-xl px-16 text-body-sm font-medium transition-all duration-fast',
            value === id
              ? 'bg-brand-teal900 text-white shadow-pressed'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {optLabel}
        </button>
      ))}
    </div>
  )
}

export function AppearanceSettings() {
  const settings = useSettingsStore((s) => s.settings)
  const update = useSettingsStore((s) => s.update)

  if (!settings) return null

  const theme = settings.theme ?? 'system'
  const preset = settings.themePreset ?? 'classic'
  const accentColor = settings.accentColor ?? '#0F4D45'
  const chartStyle = settings.chartStyle ?? 'rounded'
  const cardStyle = settings.cardStyle ?? 'elevated'
  const animationLevel = settings.animationLevel ?? 'normal'
  const density = settings.density ?? 'comfortable'
  const cornerRadius = settings.cornerRadius ?? 'medium'
  const fontFamily = settings.fontFamily ?? 'inter'
  const dashboardLayout = settings.dashboardLayout ?? 'cards'

  const handlePresetChange = (next: ThemePreset) => {
    update({ themePreset: next })
    applyPresetTokens(next)
  }

  const handleAccentChange = (colorId: string) => {
    const def = getAccentColorById(colorId)
    update({ accentColor: def.hex })
    applyAccentColor(def.hex)
  }

  const accentDef = ACCENT_COLORS.find((c) => c.hex === accentColor) ?? ACCENT_COLORS[0]

  return (
    <div className="flex flex-col gap-24">
      <section className="flex flex-col gap-12">
        <h2 className="text-overline text-text-tertiary">Appearance</h2>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Theme Mode</h3>
          <div
            role="radiogroup"
            aria-label="Theme mode"
            className="card-input inline-flex rounded-2xl p-4"
          >
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                onClick={() => update({ theme: value })}
                className={cn(
                  'flex min-h-touch items-center gap-8 rounded-xl px-16 text-body-sm font-medium transition-all duration-fast',
                  theme === value
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="size-16" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Theme Presets</h3>
          <div className="grid grid-cols-3 gap-8">
            {THEME_PRESETS.map((presetDef) => (
              <button
                key={presetDef.id}
                type="button"
                onClick={() => handlePresetChange(presetDef.id)}
                className={cn(
                  'flex flex-col items-center gap-6 rounded-lg p-8 transition-all duration-fast',
                  preset === presetDef.id
                    ? 'bg-brand-teal50 ring-2 ring-brand-teal900'
                    : 'hover:bg-surface-input'
                )}
              >
                <div
                  className="size-32 rounded-md border border-border"
                  style={{ background: presetSwatches[presetDef.id] }}
                />
                <span className="text-caption font-medium text-text-primary tabular-nums">
                  {presetDef.label}
                </span>
                <span className="text-caption text-text-tertiary text-center leading-tight">
                  {presetDef.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Accent Color</h3>
          <div className="flex items-center gap-12 flex-wrap">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => handleAccentChange(color.id)}
                className={cn(
                  'size-36 rounded-full flex items-center justify-center transition-all duration-fast',
                  accentDef.id === color.id
                    ? 'ring-2 ring-offset-2 ring-brand-teal900 ring-offset-surface'
                    : 'hover:scale-110'
                )}
                title={color.label}
                aria-label={`Accent color ${color.label}`}
              >
                <span className="size-24 rounded-full" style={{ backgroundColor: color.hex }} />
              </button>
            ))}
          </div>
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Chart Style</h3>
          <SegmentedControl
            options={CHART_STYLES}
            value={chartStyle}
            onChange={(id) => update({ chartStyle: id })}
            label="Chart style"
          />
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Card Style</h3>
          <SegmentedControl
            options={CARD_STYLES}
            value={cardStyle}
            onChange={(id) => update({ cardStyle: id })}
            label="Card style"
          />
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Animation Level</h3>
          <SegmentedControl
            options={ANIMATION_LEVELS}
            value={animationLevel}
            onChange={(id) => update({ animationLevel: id })}
            label="Animation level"
          />
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Density</h3>
          <SegmentedControl
            options={DENSITY_OPTIONS}
            value={density}
            onChange={(id) => update({ density: id })}
            label="Density"
          />
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Corner Radius</h3>
          <SegmentedControl
            options={CORNER_RADIUS_OPTIONS}
            value={cornerRadius}
            onChange={(id) => update({ cornerRadius: id })}
            label="Corner radius"
          />
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Font</h3>
          <div className="card-input relative inline-flex rounded-2xl p-4">
            <select
              value={fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value as typeof fontFamily })}
              className="w-full min-h-touch appearance-none bg-transparent rounded-xl px-16 text-body-sm font-medium text-text-primary outline-none cursor-pointer"
              aria-label="Font family"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="card-sm p-20 flex flex-col gap-16">
          <h3 className="text-h3 text-text-primary">Dashboard Layout</h3>
          <SegmentedControl
            options={DASHBOARD_LAYOUTS}
            value={dashboardLayout}
            onChange={(id) => update({ dashboardLayout: id })}
            label="Dashboard layout"
          />
        </div>
      </section>
    </div>
  )
}
