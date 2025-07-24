/**
 * App - Root application component
 * 
 * Sets up application provider hierarchy (Clerk auth, TanStack Query, Theme) 
 * and React Router configuration using Provider Pattern.
 * 
 * Design Patterns Applied:
 * - Provider Pattern: Nested providers for dependency injection
 * - Composition Pattern: Building app through component composition
 */

import { RouterProvider } from 'react-router-dom'

import { ClerkProvider, QueryProvider } from '@/components/providers'
import { ThemeProvider } from '@/components/theme-provider'

import { router } from './router'

function App() {
  return (
    <ClerkProvider>
      <QueryProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryProvider>
    </ClerkProvider>
  )
}

export default App
