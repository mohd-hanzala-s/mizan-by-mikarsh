import type { ThemePreset } from '@/types/entities'

export interface ThemePresetDef {
  id: ThemePreset
  label: string
  description: string
}

export interface AccentColorDef {
  id: string
  label: string
  hex: string
}

export const THEME_PRESETS: ThemePresetDef[] = [
  { id: 'classic', label: 'Classic', description: 'Neutral warm tones' },
  { id: 'modern', label: 'Modern', description: 'Clean whites and blues' },
  { id: 'midnight', label: 'Midnight', description: 'Deep blue palette' },
  { id: 'oled', label: 'OLED', description: 'Pure black, high contrast' },
  { id: 'minimal', label: 'Minimal', description: 'Stark black and white' },
  { id: 'glass', label: 'Glass', description: 'Translucent surfaces' },
  { id: 'paper', label: 'Paper', description: 'Off-white with subtle shadows' },
  { id: 'terminal', label: 'Terminal', description: 'Green on black' },
  { id: 'professional', label: 'Professional', description: 'Navy and white' },
  { id: 'soft', label: 'Soft', description: 'Pastel tones' },
  { id: 'warm', label: 'Warm', description: 'Earth tones' },
  { id: 'cool', label: 'Cool', description: 'Blue-gray palette' },
]

export const ACCENT_COLORS: AccentColorDef[] = [
  { id: 'emerald', label: 'Emerald', hex: '#10B981' },
  { id: 'teal', label: 'Teal', hex: '#0F4D45' },
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
  },
  modern: {
    '--surface': '248 250 252',
    '--surface-card': '255 255 255',
    '--surface-raised': '255 255 255',
    '--border': '226 232 240',
    '--border-subtle': '241 245 249',
    '--text-primary': '15 23 42',
    '--text-secondary': '100 116 139',
    '--text-tertiary': '148 163 184',
  },
  midnight: {
    '--surface': '15 23 42',
    '--surface-card': '30 41 59',
    '--surface-raised': '51 65 85',
    '--border': '51 65 85',
    '--border-subtle': '30 41 59',
    '--text-primary': '248 250 252',
    '--text-secondary': '148 163 184',
    '--text-tertiary': '100 116 139',
  },
  oled: {
    '--surface': '0 0 0',
    '--surface-card': '15 15 15',
    '--surface-raised': '25 25 25',
    '--border': '40 40 40',
    '--border-subtle': '20 20 20',
    '--text-primary': '255 255 255',
    '--text-secondary': '180 180 180',
    '--text-tertiary': '120 120 120',
  },
  minimal: {
    '--surface': '255 255 255',
    '--surface-card': '255 255 255',
    '--surface-raised': '255 255 255',
    '--border': '229 229 229',
    '--border-subtle': '245 245 245',
    '--text-primary': '0 0 0',
    '--text-secondary': '82 82 82',
    '--text-tertiary': '163 163 163',
  },
  glass: {
    '--surface': '248 250 252',
    '--surface-card': 'rgba(255,255,255,0.72)',
    '--surface-raised': 'rgba(255,255,255,0.82)',
    '--border': '255 255 255',
    '--border-subtle': '241 245 249',
    '--text-primary': '15 23 42',
    '--text-secondary': '100 116 139',
    '--text-tertiary': '148 163 184',
  },
  paper: {
    '--surface': '250 248 243',
    '--surface-card': '255 253 248',
    '--surface-raised': '255 255 255',
    '--border': '230 225 215',
    '--border-subtle': '245 242 235',
    '--text-primary': '40 36 30',
    '--text-secondary': '120 110 95',
    '--text-tertiary': '180 170 155',
  },
  terminal: {
    '--surface': '0 0 0',
    '--surface-card': '10 15 10',
    '--surface-raised': '18 25 18',
    '--border': '0 180 0',
    '--border-subtle': '10 25 10',
    '--text-primary': '0 255 0',
    '--text-secondary': '0 200 0',
    '--text-tertiary': '0 140 0',
  },
  professional: {
    '--surface': '245 247 250',
    '--surface-card': '255 255 255',
    '--surface-raised': '255 255 255',
    '--border': '220 225 235',
    '--border-subtle': '238 241 246',
    '--text-primary': '15 30 55',
    '--text-secondary': '80 95 125',
    '--text-tertiary': '140 155 180',
  },
  soft: {
    '--surface': '245 240 250',
    '--surface-card': '255 252 255',
    '--surface-raised': '255 255 255',
    '--border': '230 220 240',
    '--border-subtle': '242 238 248',
    '--text-primary': '60 40 80',
    '--text-secondary': '130 110 160',
    '--text-tertiary': '190 175 210',
  },
  warm: {
    '--surface': '254 250 248',
    '--surface-card': '255 253 251',
    '--surface-raised': '255 255 255',
    '--border': '235 220 205',
    '--border-subtle': '248 240 230',
    '--text-primary': '50 35 20',
    '--text-secondary': '140 110 80',
    '--text-tertiary': '200 175 150',
  },
  cool: {
    '--surface': '240 245 250',
    '--surface-card': '248 252 255',
    '--surface-raised': '255 255 255',
    '--border': '215 225 240',
    '--border-subtle': '235 242 250',
    '--text-primary': '20 40 65',
    '--text-secondary': '90 110 145',
    '--text-tertiary': '150 170 200',
  },
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

  const overrideKeys = [
    '--surface',
    '--surface-card',
    '--surface-raised',
    '--border',
    '--border-subtle',
    '--text-primary',
    '--text-secondary',
    '--text-tertiary',
  ]

  for (const key of overrideKeys) {
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
