import { useContext } from 'react'

import { ThemeProviderContext } from '@/lib/contexts/theme.context'

/**
 * Custom hook to access theme context
 * Follows React 19 Custom Hook Pattern for reusable stateful logic
 * 
 * @returns Theme context with current theme and setter function
 * @throws Error if used outside ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}