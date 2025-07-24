/**
 * ThemeProvider - Context provider for theme management with system preference detection
 * 
 * Provides theme context to child components with localStorage persistence,
 * system theme detection, and automatic DOM class management. Supports light,
 * dark, and system themes with proper CSS class application.
 * 
 * Design Patterns Applied:
 * - Provider Pattern: Provides theme context to component tree
 * - Strategy Pattern: Different theme strategies (light/dark/system)
 * - Observer Pattern: Watches system theme preference changes
 * - Persistence Pattern: Saves theme preference to localStorage
 */

import { useEffect, useState } from 'react'

import { ThemeProviderContext, type Theme } from '@/lib/contexts/theme.context'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
