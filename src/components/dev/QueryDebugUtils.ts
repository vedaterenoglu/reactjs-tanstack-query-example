/**
 * Development utilities for TanStack Query debugging
 * Following Strategy Pattern for different debugging approaches
 */

import type { QueryClient } from '@tanstack/react-query'

/**
 * Development utilities for TanStack Query debugging
 * Following Strategy Pattern for different debugging approaches
 */
export class QueryDebugUtils {
  /**
   * Log query cache contents to console
   */
  static logQueryCache(queryClient: QueryClient): void {
    if (!import.meta.env.DEV) {
      return
    }

    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    console.warn('🔍 TanStack Query Cache Inspection')
    console.warn(
      queries.map((query) => ({
        queryKey: JSON.stringify(query.queryKey),
        state: query.state.status,
        dataUpdatedAt: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
        isStale: query.isStale(),
        fetchStatus: query.state.fetchStatus,
      }))
    )
  }

  /**
   * Log mutation cache contents to console
   */
  static logMutationCache(queryClient: QueryClient): void {
    if (!import.meta.env.DEV) {
      return
    }

    const cache = queryClient.getMutationCache()
    const mutations = cache.getAll()
    
    console.warn('🔄 TanStack Query Mutation Cache Inspection')
    console.warn(
      mutations.map((mutation) => ({
        mutationKey: JSON.stringify(mutation.options.mutationKey || 'No key'),
        state: mutation.state.status,
        isPaused: mutation.state.isPaused,
        submittedAt: mutation.state.submittedAt 
          ? new Date(mutation.state.submittedAt).toLocaleTimeString()
          : 'N/A',
      }))
    )
  }

  /**
   * Performance monitoring for queries
   */
  static monitorQueryPerformance(queryClient: QueryClient): void {
    if (!import.meta.env.DEV) {
      return
    }

    // Note: TanStack Query v5 cache subscribe API has changed
    // This is a placeholder for cache performance monitoring
    // In practice, you would use Query DevTools or custom performance tracking
    console.warn('Query performance monitoring setup - requires custom implementation for:', queryClient.getQueryCache().getAll().length, 'queries')
  }

  /**
   * Debug specific query by key
   */
  static debugQuery(queryClient: QueryClient, queryKey: unknown[]): void {
    if (!import.meta.env.DEV) {
      return
    }

    const query = queryClient.getQueryCache().find({ queryKey })
    
    if (query) {
      console.warn(`🔍 Query Debug: ${JSON.stringify(queryKey)}`)
      console.warn('Query State:', query.state)
      console.warn('Query Options:', query.options)
      console.warn('Observers:', query.getObserversCount())
      console.warn('Is Stale:', query.isStale())
      console.warn('Last Fetch:', new Date(query.state.dataUpdatedAt).toLocaleString())
    } else {
      console.warn(`Query not found:`, queryKey)
    }
  }
}

/**
 * Hook for accessing query debugging utilities in development
 * Following Custom Hook Pattern for debugging functionality
 */
export const useQueryDebug = () => {
  const isDevelopment = import.meta.env.DEV

  if (!isDevelopment) {
    // Return no-op functions in production
    return {
      logQueryCache: () => {},
      logMutationCache: () => {},
      monitorPerformance: () => {},
      debugQuery: () => {},
      isEnabled: false,
    }
  }

  return {
    logQueryCache: QueryDebugUtils.logQueryCache,
    logMutationCache: QueryDebugUtils.logMutationCache,
    monitorPerformance: QueryDebugUtils.monitorQueryPerformance,
    debugQuery: QueryDebugUtils.debugQuery,
    isEnabled: true,
  }
}