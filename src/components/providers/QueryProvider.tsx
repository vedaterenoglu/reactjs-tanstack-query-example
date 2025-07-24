import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'

import { queryClient, persistenceUtils } from '@/lib/query/queryClient'

import type { ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Enhanced QueryProvider with Persistence Support
 * Replaces redux-persist functionality with TanStack Query persistence
 * Follows Provider Pattern with Single Responsibility for query management
 * Implements Dependency Inversion - depends on persistence abstractions
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const persistenceConfig = persistenceUtils.getPersistenceConfig()

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: persistenceConfig.persister,
        maxAge: persistenceConfig.maxAge,
        hydrateOptions: persistenceConfig.hydrateOptions,
        dehydrateOptions: persistenceConfig.dehydrateOptions,
        buster: persistenceConfig.buster,
      }}
      onSuccess={() => {
        // Cache rehydrated successfully
        if (import.meta.env.DEV) {
          console.warn('Query cache rehydrated successfully')
        }
      }}
      onError={() => {
        // Handle rehydration errors gracefully
        console.warn('Failed to rehydrate query cache')
        // Clear corrupted cache and continue
        persistenceUtils.clearPersistedCache()
      }}
    >
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
          position="right"
        />
      )}
    </PersistQueryClientProvider>
  )
}
