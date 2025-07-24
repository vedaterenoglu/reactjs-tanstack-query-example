import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'


import {
  fetchCities,
  fetchEventsByCity,
  fetchEventBySlug,
} from '@/lib/api/queryFunctions'
import { queryKeys, prefetchQuery } from '@/lib/query/queryClient'
import type { City } from '@/lib/types/city.types'
import type { Event } from '@/lib/types/event.types'

/**
 * Performance Optimization Hook: Intelligent Prefetching
 * Implements prefetching strategies based on user behavior patterns
 * Follows Single Responsibility: Performance optimization orchestration
 * Implements Observer Pattern: Monitors user interactions for prefetch opportunities
 */
export function useIntelligentPrefetch() {
  const queryClient = useQueryClient()
  const prefetchTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Business logic: Prefetch popular cities
  const prefetchPopularCities = useCallback(async () => {
    try {
      await prefetchQuery(
        queryKeys.citiesList({}),
        fetchCities,
        {
          staleTime: 15 * 60 * 1000, // 15 minutes
        }
      )
    } catch (error) {
      console.warn('Failed to prefetch cities:', error)
    }
  }, [])

  // Business logic: Prefetch city events on hover
  const prefetchCityEvents = useCallback((citySlug: string, delay = 300) => {
    const timeoutKey = `city-events-${citySlug}`
    
    // Clear existing timeout
    const existingTimeout = prefetchTimeoutsRef.current.get(timeoutKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new prefetch timeout
    const timeout = setTimeout(async () => {
      try {
        await prefetchQuery(
          queryKeys.eventsList({ search: citySlug }),
          () => fetchEventsByCity(citySlug),
          {
            staleTime: 5 * 60 * 1000, // 5 minutes
          }
        )
      } catch (error) {
        console.warn(`Failed to prefetch events for city ${citySlug}:`, error)
      }
    }, delay)

    prefetchTimeoutsRef.current.set(timeoutKey, timeout)
  }, [])

  // Business logic: Prefetch event details on hover
  const prefetchEventDetails = useCallback((eventSlug: string, delay = 200) => {
    const timeoutKey = `event-details-${eventSlug}`
    
    // Clear existing timeout
    const existingTimeout = prefetchTimeoutsRef.current.get(timeoutKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new prefetch timeout
    const timeout = setTimeout(async () => {
      try {
        await prefetchQuery(
          queryKeys.event(eventSlug),
          () => fetchEventBySlug(eventSlug),
          {
            staleTime: 10 * 60 * 1000, // 10 minutes
          }
        )
      } catch (error) {
        console.warn(`Failed to prefetch event ${eventSlug}:`, error)
      }
    }, delay)

    prefetchTimeoutsRef.current.set(timeoutKey, timeout)
  }, [])

  // Business logic: Cancel prefetch operation
  const cancelPrefetch = useCallback((type: 'city-events' | 'event-details', id: string) => {
    const timeoutKey = `${type}-${id}`
    const timeout = prefetchTimeoutsRef.current.get(timeoutKey)
    
    if (timeout) {
      clearTimeout(timeout)
      prefetchTimeoutsRef.current.delete(timeoutKey)
    }
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeouts = prefetchTimeoutsRef.current
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      timeouts.clear()
    }
  }, [])

  return {
    // Prefetch operations
    prefetchPopularCities,
    prefetchCityEvents,
    prefetchEventDetails,
    cancelPrefetch,
    
    // Utility methods
    isPrefetching: (queryKey: readonly unknown[]) => 
      queryClient.isFetching({ queryKey }) > 0,
    
    getCacheStats: () => ({
      citiesInCache: queryClient.getQueryCache().findAll({
        queryKey: queryKeys.cities(),
      }).length,
      eventsInCache: queryClient.getQueryCache().findAll({
        queryKey: queryKeys.events(),
      }).length,
    }),
  }
}

/**
 * Performance Hook: Cache Management and Optimization
 * Manages cache lifecycle and memory optimization
 * Follows Single Responsibility: Cache optimization logic
 */
export function useCacheOptimization() {
  const queryClient = useQueryClient()

  // Business logic: Cache cleanup strategies
  const cacheOperations = useMemo(() => ({
    // Clear stale data older than specified time
    clearStaleData: (maxAge: number = 30 * 60 * 1000) => { // 30 minutes default
      const now = Date.now()
      
      queryClient.getQueryCache().findAll().forEach(query => {
        const lastUpdated = query.state.dataUpdatedAt
        if (lastUpdated && (now - lastUpdated) > maxAge) {
          queryClient.removeQueries({ queryKey: query.queryKey })
        }
      })
    },

    // Optimize cache size by removing least recently used queries
    optimizeCacheSize: (maxQueries: number = 50) => {
      const allQueries = queryClient.getQueryCache().findAll()
      
      if (allQueries.length > maxQueries) {
        // Sort by last accessed (dataUpdatedAt) and remove oldest
        const sortedQueries = allQueries
          .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
          .slice(0, allQueries.length - maxQueries)

        sortedQueries.forEach(query => {
          queryClient.removeQueries({ queryKey: query.queryKey })
        })
      }
    },

    // Clear cache for specific entity type
    clearEntityCache: (entityType: 'cities' | 'events') => {
      const queryKey = entityType === 'cities' ? queryKeys.cities() : queryKeys.events()
      queryClient.removeQueries({ queryKey })
    },

    // Refresh critical data
    refreshCriticalData: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cities() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events() }),
      ])
    },

    // Get cache health metrics
    getCacheHealth: () => {
      const allQueries = queryClient.getQueryCache().findAll()
      const now = Date.now()
      
      const staleQueries = allQueries.filter(query => {
         
        const staleTime = query.options.staleTime || 0
        const lastUpdated = query.state.dataUpdatedAt || 0
        return (now - lastUpdated) > staleTime
      })

      const errorQueries = allQueries.filter(query => query.state.error)

      return {
        totalQueries: allQueries.length,
        staleQueries: staleQueries.length,
        errorQueries: errorQueries.length,
        healthScore: Math.round(
          ((allQueries.length - staleQueries.length - errorQueries.length) / allQueries.length) * 100
        ) || 0,
        memoryUsage: {
          // Simplified memory estimation
          estimated: allQueries.length * 1024, // Rough estimate
          queries: allQueries.length,
        },
      }
    },
  }), [queryClient])

  return {
    ...cacheOperations,
    
    // Cache monitoring
    getCacheSize: () => queryClient.getQueryCache().getAll().length,
    
    // Memory pressure handling
    handleMemoryPressure: () => {
      cacheOperations.clearStaleData(10 * 60 * 1000) // Clear data older than 10 minutes
      cacheOperations.optimizeCacheSize(25) // Reduce cache to 25 queries
    },
  }
}

/**
 * Performance Hook: Connection and Network Optimization
 * Adapts behavior based on network conditions
 * Implements Adapter Pattern: Network-aware data fetching
 */
export function useNetworkOptimization() {
  const queryClient = useQueryClient()

  // Network status detection (simplified - would use actual network API in production)
  const networkStatus = useMemo(() => {
    // This would typically use navigator.connection API
    return {
      isOnline: navigator.onLine,
      connectionType: 'unknown' as 'wifi' | '4g' | '3g' | '2g' | 'unknown',
      isSlowConnection: false,
    }
  }, [])

  // Business logic: Network-adaptive query configuration
  const getAdaptiveQueryConfig = useCallback((queryType: 'critical' | 'normal' | 'background') => {
    const baseConfig = {
      critical: {
        retry: 3,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchOnWindowFocus: true,
      },
      normal: {
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
      background: {
        retry: 1,
        staleTime: 15 * 60 * 1000, // 15 minutes
        refetchOnWindowFocus: false,
      },
    }

    const config = baseConfig[queryType]

    // Adapt based on network conditions
    if (networkStatus.isSlowConnection) {
      return {
        ...config,
        retry: Math.max(1, config.retry - 1),
        staleTime: config.staleTime * 2, // Double stale time for slow connections
        refetchOnWindowFocus: false, // Disable refetch on focus for slow connections
      }
    }

    return config
  }, [networkStatus])

  // Business logic: Batch operations for network efficiency
  const batchOperations = useMemo(() => ({
    batchPrefetch: async (operations: Array<() => Promise<unknown>>, batchSize = 3) => {
      // Execute operations in batches to avoid overwhelming the network
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize)
        await Promise.allSettled(batch.map(op => op()))
        
        // Small delay between batches for slower connections
        if (networkStatus.isSlowConnection && i + batchSize < operations.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    },

    prioritizedRefresh: async (priorities: Array<{ queryKey: readonly unknown[]; priority: number }>) => {
      // Sort by priority and refresh in order
      const sortedPriorities = priorities.sort((a, b) => b.priority - a.priority)
      
      for (const { queryKey } of sortedPriorities) {
        await queryClient.refetchQueries({ queryKey })
        
        // Delay between refreshes for network courtesy
        if (networkStatus.isSlowConnection) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
    },
  }), [networkStatus, queryClient])

  return {
    // Network status
    networkStatus,
    
    // Adaptive configuration
    getAdaptiveQueryConfig,
    
    // Batch operations
    ...batchOperations,
    
    // Network-aware helpers
    shouldPrefetch: () => networkStatus.isOnline && !networkStatus.isSlowConnection,
    
    getOptimalStaleTime: (baseStaleTime: number) => 
      networkStatus.isSlowConnection ? baseStaleTime * 2 : baseStaleTime,
    
    shouldEnableBackgroundRefetch: () => 
      networkStatus.isOnline && networkStatus.connectionType !== '2g',
  }
}

/**
 * Performance Hook: Image and Asset Optimization
 * Manages image loading and asset prefetching
 * Follows Single Responsibility: Asset optimization
 */
export function useAssetOptimization() {
  const preloadedImages = useRef<Set<string>>(new Set())

  // Business logic: Intelligent image preloading
  const imageOperations = useMemo(() => ({
    preloadImage: (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (preloadedImages.current.has(url)) {
          resolve()
          return
        }

        const img = new Image()
        img.onload = () => {
          preloadedImages.current.add(url)
          resolve()
        }
        img.onerror = reject
        img.src = url
      })
    },

    preloadCityImages: async (cities: City[]) => {
      const imageUrls = cities.map(city => city.url).filter(Boolean)
      const promises = imageUrls.map(url => imageOperations.preloadImage(url))
      
      // Load images in batches of 3 to avoid overwhelming the browser
      for (let i = 0; i < promises.length; i += 3) {
        const batch = promises.slice(i, i + 3)
        await Promise.allSettled(batch)
      }
    },

    preloadEventImages: async (events: Event[]) => {
      const imageUrls = events.map(event => event.imageUrl).filter(Boolean)
      const promises = imageUrls.map(url => imageOperations.preloadImage(url))
      
      // Load images in batches
      for (let i = 0; i < promises.length; i += 3) {
        const batch = promises.slice(i, i + 3)
        await Promise.allSettled(batch)
      }
    },

    getImageLoadingStrategy: (priority: 'high' | 'normal' | 'low') => {
      const strategies = {
        high: { loading: 'eager' as const, decoding: 'sync' as const },
        normal: { loading: 'lazy' as const, decoding: 'async' as const },
        low: { loading: 'lazy' as const, decoding: 'async' as const },
      }
      
      return strategies[priority]
    },
  }), [])

  return {
    ...imageOperations,
    
    // Preload status
    isImagePreloaded: (url: string) => preloadedImages.current.has(url),
    getPreloadedCount: () => preloadedImages.current.size,
    
    // Cleanup
    clearPreloadCache: () => preloadedImages.current.clear(),
  }
}

/**
 * Master Performance Hook: Combines all optimization strategies
 * Orchestrates multiple performance optimizations
 * Follows Facade Pattern: Simplified interface for complex optimizations
 */
export function usePerformanceOptimization() {
  const prefetch = useIntelligentPrefetch()
  const cache = useCacheOptimization()
  const network = useNetworkOptimization()
  const assets = useAssetOptimization()

  // Initialize performance optimizations
  useEffect(() => {
    // Prefetch critical data on mount
    void prefetch.prefetchPopularCities()

    // Set up cache cleanup interval
    const cleanupInterval = setInterval(() => {
      cache.clearStaleData()
    }, 10 * 60 * 1000) // Every 10 minutes

    return () => clearInterval(cleanupInterval)
  }, [prefetch, cache])

  // Adaptive performance configuration
  const performanceConfig = useMemo(() => ({
    // Query configurations based on network conditions
    criticalQueryConfig: network.getAdaptiveQueryConfig('critical'),
    normalQueryConfig: network.getAdaptiveQueryConfig('normal'),
    backgroundQueryConfig: network.getAdaptiveQueryConfig('background'),
    
    // Asset loading strategies
    heroImageStrategy: assets.getImageLoadingStrategy('high'),
    thumbnailStrategy: assets.getImageLoadingStrategy('normal'),
    backgroundImageStrategy: assets.getImageLoadingStrategy('low'),
    
    // Prefetch settings
    shouldPrefetch: network.shouldPrefetch(),
    prefetchDelay: network.networkStatus.isSlowConnection ? 500 : 200,
  }), [network, assets])

  return {
    // Individual optimization modules
    prefetch,
    cache,
    network,
    assets,
    
    // Combined configuration
    config: performanceConfig,
    
    // Master operations
    optimizeForCurrentConditions: () => {
      if (network.networkStatus.isSlowConnection) {
        cache.handleMemoryPressure()
      }
    },
    
    getPerformanceMetrics: () => ({
      cache: cache.getCacheHealth(),
      network: network.networkStatus,
      assets: {
        preloadedImages: assets.getPreloadedCount(),
      },
      prefetch: prefetch.getCacheStats(),
    }),
  }
}

/**
 * Utility Types for Performance Hook Consumers
 */
export type IntelligentPrefetchResult = ReturnType<typeof useIntelligentPrefetch>
export type CacheOptimizationResult = ReturnType<typeof useCacheOptimization>
export type NetworkOptimizationResult = ReturnType<typeof useNetworkOptimization>
export type AssetOptimizationResult = ReturnType<typeof useAssetOptimization>
export type PerformanceOptimizationResult = ReturnType<typeof usePerformanceOptimization>