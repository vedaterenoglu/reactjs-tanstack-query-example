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
    if (process.env['NODE_ENV'] !== 'development') {
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
        isFetching: query.state.isFetching,
        fetchStatus: query.state.fetchStatus,
      }))
    )
  }

  /**
   * Log mutation cache contents to console
   */
  static logMutationCache(queryClient: QueryClient): void {
    if (process.env['NODE_ENV'] !== 'development') {
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
    if (process.env['NODE_ENV'] !== 'development') {
      return
    }

    const cache = queryClient.getQueryCache()
    
    cache.subscribe((event) => {
      if (event.type === 'queryUpdated' && event.query) {
        const query = event.query
        const startedAt = query.state.fetchStartedAt || 0
        const updatedAt = query.state.dataUpdatedAt
        const duration = updatedAt - startedAt
        
        if (duration > 0 && duration > 3000) {
          console.warn(`⚡ Query Performance Alert:`, {
            queryKey: query.queryKey,
            duration: `${duration}ms`,
            isSlowQuery: duration > 3000,
            recommendation: duration > 3000 
              ? 'Consider caching strategy optimization'
              : 'Performance within acceptable range',
          })
        }
      }
    })
  }

  /**
   * Debug specific query by key
   */
  static debugQuery(queryClient: QueryClient, queryKey: unknown[]): void {
    if (process.env['NODE_ENV'] !== 'development') {
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
  const isDevelopment = process.env['NODE_ENV'] === 'development'

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