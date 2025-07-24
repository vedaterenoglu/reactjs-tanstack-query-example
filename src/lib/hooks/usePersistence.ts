import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

import { createPersistenceService } from '@/lib/query/persistence'
import type { PersistenceConfig } from '@/lib/query/persistence'
import { persistenceUtils } from '@/lib/query/queryClient'

/**
 * Persistence Statistics Interface
 * Tracks persistence health and performance metrics
 * Single Responsibility: Persistence monitoring data structure
 */
interface PersistenceStats {
  isStorageAvailable: boolean
  cacheSize: number
  lastPersisted: string | null
  totalClearOperations: number
  lastClearTime: string | null
  persistenceHealth: 'healthy' | 'warning' | 'critical'
}

/**
 * Business Logic Hook: Query Persistence Management
 * Provides comprehensive persistence functionality for components
 * Follows Single Responsibility: Persistence operations orchestration
 * Implements Observer Pattern for persistence state updates
 */
export function usePersistence() {
  const queryClient = useQueryClient()
  const [stats, setStats] = useState<PersistenceStats>(() => {
    const health = persistenceUtils.getCacheHealth()
    return {
      isStorageAvailable: health.isStorageAvailable,
      cacheSize: health.cacheSize,
      lastPersisted: health.lastPersisted,
      totalClearOperations: 0,
      lastClearTime: null,
      persistenceHealth: health.isStorageAvailable ? 'healthy' : 'warning',
    }
  })

  // Update persistence statistics
  const updateStats = useCallback(() => {
    const health = persistenceUtils.getCacheHealth()
    setStats(prev => ({
      ...prev,
      isStorageAvailable: health.isStorageAvailable,
      cacheSize: health.cacheSize,
      lastPersisted: health.lastPersisted,
      persistenceHealth: health.isStorageAvailable 
        ? (health.cacheSize > 0 ? 'healthy' : 'warning')
        : 'critical',
    }))
  }, [])

  // Clear persisted cache with tracking
  const clearCache = useCallback(async () => {
    try {
      persistenceUtils.clearPersistedCache()
      await queryClient.invalidateQueries()
      
      setStats(prev => ({
        ...prev,
        totalClearOperations: prev.totalClearOperations + 1,
        lastClearTime: new Date().toISOString(),
        cacheSize: 0,
        lastPersisted: null,
      }))
      
      return { success: true, error: null }
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return { success: false, error: error as Error }
    }
  }, [queryClient])

  // Force cache rehydration
  const rehydrateCache = useCallback(async () => {
    try {
      await persistenceUtils.rehydrateCache()
      updateStats()
      return { success: true, error: null }
    } catch (error) {
      console.error('Failed to rehydrate cache:', error)
      return { success: false, error: error as Error }
    }
  }, [updateStats])

  // Reset persistence (clear and rehydrate)
  const resetPersistence = useCallback(async () => {
    const clearResult = await clearCache()
    if (!clearResult.success) {
      return clearResult
    }
    
    // Wait a bit for clear to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return await rehydrateCache()
  }, [clearCache, rehydrateCache])

  // Get cache size in human-readable format
  const getCacheSizeFormatted = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    // eslint-disable-next-line security/detect-object-injection
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }, [])

  // Cache health checker
  const checkCacheHealth = useCallback(() => {
    const health = persistenceUtils.getCacheHealth()
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    const issues: string[] = []
    
    if (!health.isStorageAvailable) {
      status = 'critical'
      issues.push('Storage not available')
    }
    
    if (health.cacheSize === 0) {
      status = 'warning'
      issues.push('No cached data')
    }
    
    if (health.cacheSize > 10 * 1024 * 1024) { // 10MB
      status = 'warning'
      issues.push('Cache size is large')
    }
    
    if (health.lastPersisted) {
      const lastPersisted = new Date(health.lastPersisted)
      const daysSince = (Date.now() - lastPersisted.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince > 7) {
        status = 'warning'
        issues.push('Cache is stale')
      }
    }
    
    return { status, issues, ...health }
  }, [])

  // Persistence configuration factory
  const createCustomPersistence = useCallback((config: Partial<PersistenceConfig>) => {
    return createPersistenceService(config)
  }, [])

  // Persistence utilities
  const persistenceOperations = useMemo(() => ({
    // Basic operations
    clearCache,
    rehydrateCache,
    resetPersistence,
    updateStats,
    
    // Health monitoring
    checkCacheHealth,
    getCacheSizeFormatted: (bytes?: number) => 
      getCacheSizeFormatted(bytes ?? stats.cacheSize),
    
    // Configuration
    createCustomPersistence,
    
    // Debugging utilities
    exportCacheData: () => {
      try {
        const health = persistenceUtils.getCacheHealth()
        return {
          timestamp: new Date().toISOString(),
          stats,
          health,
          queryCache: queryClient.getQueryCache().getAll().map(query => ({
            queryKey: query.queryKey,
            state: query.state,
            lastUpdated: query.state.dataUpdatedAt,
          })),
        }
      } catch (error) {
        console.error('Failed to export cache data:', error)
        return null
      }
    },
    
    // Migration utilities (for redux-persist migration)
    migrateFromReduxPersist: async (reduxPersistedState?: unknown) => {
      if (!reduxPersistedState) return { success: true, error: null }
      
      try {
        // Clear existing cache first
        await clearCache()
        
        // Here you would implement logic to transform redux state to query cache
        // This is application-specific and would depend on your redux state structure
        console.warn('Redux persist migration not implemented yet', reduxPersistedState)
        
        return { success: true, error: null }
      } catch (error) {
        console.error('Failed to migrate from redux-persist:', error)
        return { success: false, error: error as Error }
      }
    },
  }), [
    clearCache,
    rehydrateCache,
    resetPersistence,
    updateStats,
    checkCacheHealth,
    getCacheSizeFormatted,
    createCustomPersistence,
    stats,
    queryClient,
  ])

  return {
    // State
    stats,
    
    // Operations
    ...persistenceOperations,
    
    // Computed properties
    isHealthy: stats.persistenceHealth === 'healthy',
    hasData: stats.cacheSize > 0,
    formattedCacheSize: getCacheSizeFormatted(stats.cacheSize),
    
    // Quick actions
    refresh: updateStats,
  }
}

/**
 * Business Logic Hook: Persistence Monitoring
 * Provides real-time persistence monitoring capabilities
 * Follows Interface Segregation: Focused on monitoring
 */
export function usePersistenceMonitor(options: {
  autoRefresh?: boolean
  refreshInterval?: number
} = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options
  const persistence = usePersistence()

  // Auto-refresh functionality
  useMemo(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        persistence.refresh()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
    return undefined
  }, [autoRefresh, refreshInterval, persistence])

  return {
    // Monitoring data
    stats: persistence.stats,
    healthCheck: persistence.checkCacheHealth(),
    
    // Quick status indicators
    isOnline: persistence.stats.isStorageAvailable,
    isHealthy: persistence.isHealthy,
    lastActivity: persistence.stats.lastPersisted,
    
    // Actions
    refresh: persistence.refresh,
    clearCache: persistence.clearCache,
    
    // Export for debugging
    exportData: persistence.exportCacheData,
  }
}

/**
 * Utility Types for Persistence Hook Consumers
 */
export type PersistenceResult = ReturnType<typeof usePersistence>
export type PersistenceMonitorResult = ReturnType<typeof usePersistenceMonitor>
export type { PersistenceStats }