/**
 * App - Root application component
 * Sets up providers (Clerk, Redux, Theme) and router configuration
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
