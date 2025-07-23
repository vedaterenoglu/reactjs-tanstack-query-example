/**
 * Theme context - React context for theme management
 * Defines Theme type, ThemeProviderState interface, and ThemeProviderContext
 */

import { createContext } from 'react'

export type Theme = 'dark' | 'light' | 'system'

export type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

export const ThemeProviderContext =
  createContext<ThemeProviderState>(initialState)
