import { useEffect } from 'react'
import { useSettingsStore } from '@/app/settingsStore'
import type { ThemePreset } from '@/types/entities'

export const THEME_CACHE_KEY = 'mizan-theme-cache'

const DARK_PRESETS: ThemePreset[] = ['midnight', 'oled', 'terminal']

function resolveDark(theme: string, preset: ThemePreset): boolean {
  if (DARK_PRESETS.includes(preset)) return true
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return theme === 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettingsStore((s) => s.settings)

  useEffect(() => {
    if (!settings) return

    const preset = settings.themePreset ?? 'classic'
    const isDark = resolveDark(settings.theme, preset)
    const root = document.documentElement

    root.classList.toggle('dark', isDark)
    root.setAttribute('data-theme', preset)
    try {
      localStorage.setItem(THEME_CACHE_KEY, isDark ? 'dark' : 'light')
    } catch {
      /* noop */
    }

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const onChange = () => {
        const nextDark = mq.matches
        root.classList.toggle('dark', nextDark)
        try {
          localStorage.setItem(THEME_CACHE_KEY, nextDark ? 'dark' : 'light')
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
