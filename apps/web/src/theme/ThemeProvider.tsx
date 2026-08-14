import { useEffect } from 'react'
import { useSettingsStore } from '@/app/settingsStore'
import {
  applyAccentColor,
  applyPresetTokens,
  normalizePreset,
  resolveAccentColor,
  resolveMode,
} from '@/services/ThemeService'

export const THEME_CACHE_KEY = 'mizan-theme-cache'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettingsStore((s) => s.settings)

  useEffect(() => {
    if (!settings) return

    const mode = resolveMode(settings.theme)
    const preset = normalizePreset(settings.themePreset, mode)
    const root = document.documentElement

    root.classList.toggle('dark', mode === 'dark')
    root.setAttribute('data-theme', preset)
    applyPresetTokens(preset)
    applyAccentColor(resolveAccentColor(settings.accentColor, mode))

    try {
      localStorage.setItem(THEME_CACHE_KEY, mode === 'dark' ? 'dark' : 'light')
    } catch {
      /* noop */
    }

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => {
        const nextMode: 'light' | 'dark' = mq.matches ? 'dark' : 'light'
        const nextPreset = normalizePreset(settings.themePreset, nextMode)
        root.classList.toggle('dark', nextMode === 'dark')
        root.setAttribute('data-theme', nextPreset)
        applyPresetTokens(nextPreset)
        applyAccentColor(resolveAccentColor(settings.accentColor, nextMode))
        try {
          localStorage.setItem(THEME_CACHE_KEY, nextMode === 'dark' ? 'dark' : 'light')
        } catch {
          /* noop */
        }
      }
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
  }, [settings])

  return children
}
