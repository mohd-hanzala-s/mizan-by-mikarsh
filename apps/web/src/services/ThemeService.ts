import { DARK_THEME_PRESETS, type ThemePreference, type ThemePreset } from '@/types/entities'

export interface ThemePresetDef {
  id: ThemePreset
  label: string
  description: string
  mode: 'light' | 'dark'
}

export interface AccentColorDef {
  id: string
  label: string
  hex: string
}

export const DEFAULT_ACCENT_LIGHT = '#0F4D45'
export const DEFAULT_ACCENT_DARK = '#62C3A7'

const THEME_PRESETS: ThemePresetDef[] = [
  { id: 'classic', label: 'Classic', description: 'Brand teal on warm neutral', mode: 'light' },
  { id: 'modern', label: 'Modern', description: 'Crisp white and cool blue', mode: 'light' },
  { id: 'paper', label: 'Paper', description: 'Warm cream with soft ink', mode: 'light' },
  { id: 'soft', label: 'Soft', description: 'Pastel lavender tones', mode: 'light' },
  { id: 'midnight', label: 'Midnight', description: 'Deep teal-navy dark', mode: 'dark' },
  { id: 'oled', label: 'OLED', description: 'Pure black, high contrast', mode: 'dark' },
  { id: 'terminal', label: 'Terminal', description: 'Green on black', mode: 'dark' },
  { id: 'violet', label: 'Violet', description: 'Deep royal purple', mode: 'dark' },
]

export const LIGHT_THEMES: ThemePresetDef[] = THEME_PRESETS.filter((p) => p.mode === 'light')
export const DARK_THEMES: ThemePresetDef[] = THEME_PRESETS.filter((p) => p.mode === 'dark')

export const ACCENT_COLORS: AccentColorDef[] = [
  { id: 'emerald', label: 'Emerald', hex: '#10B981' },
  { id: 'teal', label: 'Teal', hex: '#0F4D45' },
  { id: 'mint', label: 'Mint', hex: '#62C3A7' },
  { id: 'blue', label: 'Blue', hex: '#2563EB' },
  { id: 'orange', label: 'Orange', hex: '#EA580C' },
  { id: 'amber', label: 'Amber', hex: '#D97706' },
  { id: 'indigo', label: 'Indigo', hex: '#4F46E5' },
  { id: 'monochrome', label: 'Monochrome', hex: '#374151' },
]

export const CHART_STYLES = [
  { id: 'rounded' as const, label: 'Rounded' },
  { id: 'flat' as const, label: 'Flat' },
  { id: 'gradient' as const, label: 'Gradient' },
  { id: 'professional' as const, label: 'Professional' },
]

export const CARD_STYLES = [
  { id: 'outlined' as const, label: 'Outlined' },
  { id: 'filled' as const, label: 'Filled' },
  { id: 'elevated' as const, label: 'Elevated' },
  { id: 'minimal' as const, label: 'Minimal' },
]

export const ANIMATION_LEVELS = [
  { id: 'off' as const, label: 'Off' },
  { id: 'reduced' as const, label: 'Reduced' },
  { id: 'normal' as const, label: 'Normal' },
  { id: 'fluid' as const, label: 'Fluid' },
]

export const DENSITY_OPTIONS = [
  { id: 'compact' as const, label: 'Compact' },
  { id: 'comfortable' as const, label: 'Comfortable' },
  { id: 'relaxed' as const, label: 'Relaxed' },
]

export const CORNER_RADIUS_OPTIONS = [
  { id: 'sharp' as const, label: 'Sharp' },
  { id: 'medium' as const, label: 'Medium' },
  { id: 'rounded' as const, label: 'Rounded' },
]

export const FONT_OPTIONS = [
  { id: 'inter' as const, label: 'Inter' },
  { id: 'satoshi' as const, label: 'Satoshi' },
  { id: 'geist' as const, label: 'Geist' },
  { id: 'sf-pro' as const, label: 'SF Pro' },
  { id: 'ibm-plex' as const, label: 'IBM Plex' },
]

export const DASHBOARD_LAYOUTS = [
  { id: 'cards' as const, label: 'Cards' },
  { id: 'grid' as const, label: 'Grid' },
  { id: 'widgets' as const, label: 'Widgets' },
  { id: 'compact' as const, label: 'Compact' },
  { id: 'executive' as const, label: 'Executive' },
]

type CSSVarOverrides = Record<string, string>

const presetTokens: Record<ThemePreset, CSSVarOverrides> = {
  classic: {
    '--surface': '244 246 245',
    '--surface-card': '255 255 255',
    '--surface-raised': '255 255 255',
    '--border': '221 229 226',
    '--border-subtle': '239 243 241',
    '--text-primary': '16 32 29',
    '--text-secondary': '100 117 111',
    '--text-tertiary': '164 178 173',
    '--surface-elevated': 'rgba(255, 255, 255, 0.96)',
    '--surface-pressed': 'rgba(239, 243, 241, 0.94)',
    '--surface-input': 'rgba(244, 246, 245, 0.98)',
    '--nav-bg': 'rgba(244, 246, 245, 0.88)',
    '--nav-border': 'rgba(0, 0, 0, 0.05)',
  },
  modern: {
    '--surface': '246 248 251',
    '--surface-card': '255 255 255',
    '--surface-raised': '255 255 255',
    '--border': '224 230 238',
    '--border-subtle': '241 245 249',
    '--text-primary': '15 28 45',
    '--text-secondary': '90 108 128',
    '--text-tertiary': '148 163 184',
    '--surface-elevated': 'rgba(255, 255, 255, 0.97)',
    '--surface-pressed': 'rgba(241, 245, 249, 0.95)',
    '--surface-input': 'rgba(246, 248, 251, 0.98)',
    '--nav-bg': 'rgba(246, 248, 251, 0.88)',
    '--nav-border': 'rgba(15, 28, 45, 0.06)',
  },
  paper: {
    '--surface': '250 247 240',
    '--surface-card': '255 253 248',
    '--surface-raised': '255 255 255',
    '--border': '229 222 207',
    '--border-subtle': '244 240 231',
    '--text-primary': '48 42 32',
    '--text-secondary': '128 116 94',
    '--text-tertiary': '187 176 155',
    '--surface-elevated': 'rgba(255, 253, 248, 0.97)',
    '--surface-pressed': 'rgba(244, 240, 231, 0.95)',
    '--surface-input': 'rgba(250, 247, 240, 0.98)',
    '--nav-bg': 'rgba(250, 247, 240, 0.9)',
    '--nav-border': 'rgba(48, 42, 32, 0.06)',
  },
  soft: {
    '--surface': '246 242 251',
    '--surface-card': '255 253 255',
    '--surface-raised': '255 255 255',
    '--border': '231 223 241',
    '--border-subtle': '244 240 249',
    '--text-primary': '55 42 78',
    '--text-secondary': '128 110 160',
    '--text-tertiary': '190 178 210',
    '--surface-elevated': 'rgba(255, 253, 255, 0.97)',
    '--surface-pressed': 'rgba(244, 240, 249, 0.95)',
    '--surface-input': 'rgba(246, 242, 251, 0.98)',
    '--nav-bg': 'rgba(246, 242, 251, 0.9)',
    '--nav-border': 'rgba(55, 42, 78, 0.06)',
  },
  midnight: {
    '--surface': '10 22 19',
    '--surface-card': '18 33 29',
    '--surface-raised': '24 41 36',
    '--border': '30 48 42',
    '--border-subtle': '18 33 29',
    '--text-primary': '244 246 245',
    '--text-secondary': '164 178 173',
    '--text-tertiary': '100 117 111',
    '--surface-elevated': 'rgba(18, 33, 29, 0.96)',
    '--surface-pressed': 'rgba(24, 41, 36, 0.94)',
    '--surface-input': 'rgba(10, 22, 19, 0.96)',
    '--nav-bg': 'rgba(10, 22, 19, 0.92)',
    '--nav-border': 'rgba(98, 195, 167, 0.08)',
  },
  oled: {
    '--surface': '0 0 0',
    '--surface-card': '14 14 14',
    '--surface-raised': '24 24 24',
    '--border': '38 38 38',
    '--border-subtle': '20 20 20',
    '--text-primary': '255 255 255',
    '--text-secondary': '175 175 175',
    '--text-tertiary': '115 115 115',
    '--surface-elevated': 'rgba(14, 14, 14, 0.96)',
    '--surface-pressed': 'rgba(24, 24, 24, 0.94)',
    '--surface-input': 'rgba(0, 0, 0, 0.96)',
    '--nav-bg': 'rgba(0, 0, 0, 0.92)',
    '--nav-border': 'rgba(255, 255, 255, 0.08)',
  },
  terminal: {
    '--surface': '2 12 4',
    '--surface-card': '6 20 8',
    '--surface-raised': '10 28 12',
    '--border': '0 120 0',
    '--border-subtle': '6 22 8',
    '--text-primary': '0 255 0',
    '--text-secondary': '0 190 0',
    '--text-tertiary': '0 130 0',
    '--surface-elevated': 'rgba(6, 20, 8, 0.96)',
    '--surface-pressed': 'rgba(10, 28, 12, 0.94)',
    '--surface-input': 'rgba(2, 12, 4, 0.96)',
    '--nav-bg': 'rgba(2, 12, 4, 0.92)',
    '--nav-border': 'rgba(0, 255, 0, 0.12)',
  },
  violet: {
    '--surface': '18 12 32',
    '--surface-card': '28 20 46',
    '--surface-raised': '38 28 60',
    '--border': '52 40 78',
    '--border-subtle': '28 20 46',
    '--text-primary': '244 240 255',
    '--text-secondary': '178 168 205',
    '--text-tertiary': '120 108 155',
    '--surface-elevated': 'rgba(28, 20, 46, 0.96)',
    '--surface-pressed': 'rgba(38, 28, 60, 0.94)',
    '--surface-input': 'rgba(18, 12, 32, 0.96)',
    '--nav-bg': 'rgba(18, 12, 32, 0.92)',
    '--nav-border': 'rgba(167, 139, 250, 0.1)',
  },
}

const PRESET_TOKEN_KEYS = [
  '--surface',
  '--surface-card',
  '--surface-raised',
  '--border',
  '--border-subtle',
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--surface-elevated',
  '--surface-pressed',
  '--surface-input',
  '--nav-bg',
  '--nav-border',
] as const

/** Resolve the effective light/dark mode for a theme preference. */
export function resolveMode(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme === 'dark' ? 'dark' : 'light'
}

export function isDarkPreset(preset: ThemePreset): boolean {
  return DARK_THEME_PRESETS.includes(preset)
}

export function getDefaultPreset(mode: 'light' | 'dark'): ThemePreset {
  return mode === 'dark' ? 'midnight' : 'classic'
}

/** Coerce any persisted value (including legacy pre-v8 preset ids) into a
 * valid preset that matches the given mode. */
export function normalizePreset(
  preset: ThemePreset | undefined,
  mode: 'light' | 'dark'
): ThemePreset {
  if (
    preset &&
    ((mode === 'dark' && isDarkPreset(preset)) || (mode === 'light' && !isDarkPreset(preset)))
  ) {
    return preset
  }
  return getDefaultPreset(mode)
}

/** Preset to store when the user flips the theme mode: keeps the current
 * variant if it already belongs to the new mode, otherwise snaps to that
 * mode's default. */
export function presetForModeChange(
  theme: ThemePreference,
  currentPreset: ThemePreset | undefined
): ThemePreset {
  return normalizePreset(currentPreset, resolveMode(theme))
}

/** The accent color that matches the resolved mode unless the user has
 * explicitly picked a custom accent. */
export function resolveAccentColor(
  accentColor: string | undefined,
  mode: 'light' | 'dark'
): string {
  if (accentColor && accentColor !== DEFAULT_ACCENT_LIGHT) return accentColor
  return mode === 'dark' ? DEFAULT_ACCENT_DARK : DEFAULT_ACCENT_LIGHT
}

export function getThemesForMode(mode: 'light' | 'dark'): ThemePresetDef[] {
  return mode === 'dark' ? DARK_THEMES : LIGHT_THEMES
}

export function getThemePresetTokens(presetId: ThemePreset): CSSVarOverrides {
  return presetTokens[presetId] ?? presetTokens.classic
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

export function applyAccentColor(hex: string): { r: number; g: number; b: number } {
  const { r, g, b } = hexToRgb(hex)
  document.documentElement.style.setProperty('--color-accent', `${r} ${g} ${b}`)
  document.documentElement.style.setProperty('--color-accent-muted', `rgba(${r}, ${g}, ${b}, 0.12)`)
  document.documentElement.style.setProperty('--color-accent-hover', `${hex}`)
  return { r, g, b }
}

export function applyPresetTokens(presetId: ThemePreset): void {
  const tokens = getThemePresetTokens(presetId)
  const root = document.documentElement

  for (const key of PRESET_TOKEN_KEYS) {
    if (tokens[key]) {
      root.style.setProperty(key, tokens[key])
    }
  }
}

export function getPresetById(id: ThemePreset): ThemePresetDef {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0]
}

export function getAccentColorById(id: string): AccentColorDef {
  return ACCENT_COLORS.find((c) => c.id === id) ?? ACCENT_COLORS[0]
}
