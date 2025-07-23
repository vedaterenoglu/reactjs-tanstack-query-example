import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { queryClient } from '@/lib/query/queryClient'

import type { ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * QueryProvider component that wraps the application with TanStack Query client
 * Follows the Provider Pattern for consistent state management across the app
 * Includes DevTools for development environment debugging
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
          position="right"
        />
      )}
    </QueryClientProvider>
  )
}
