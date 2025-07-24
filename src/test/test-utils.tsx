import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'

import type { ReactElement, ReactNode } from 'react'

/**
 * Test Utilities for TanStack Query
 * 
 * Design Patterns Applied:
 * - Wrapper Pattern: Provides configured test wrapper for components
 * - Factory Pattern: Creates fresh QueryClient for each test
 * - Composition Pattern: Combines providers for testing
 * 
 * SOLID Principles:
 * - SRP: Focused on test rendering utilities
 * - OCP: Extensible through custom render options
 * - DIP: Components depend on abstract QueryClient
 */

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Turn off retries for tests
        retry: false,
        // Turn off refetch on window focus
        refetchOnWindowFocus: false,
        // Disable automatic refetching
        refetchOnMount: false,
        refetchOnReconnect: false,
        // Set stale time to 0 for tests
        staleTime: 0,
      },
      mutations: {
        // Turn off retries for tests
        retry: false,
      },
    },
  })
}

interface AllTheProvidersProps {
  children: ReactNode
  queryClient?: QueryClient | undefined
}

export function AllTheProviders({ 
  children, 
  queryClient = createTestQueryClient() 
}: AllTheProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

export function renderWithQuery(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { renderWithQuery as render }