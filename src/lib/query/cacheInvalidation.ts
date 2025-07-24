/**
 * Cache Invalidation Service - TanStack Query cache management and invalidation strategies
 *
 * Design Patterns Applied:
 * 1. **Strategy Pattern**: Different invalidation strategies based on data type and context
 * 2. **Observer Pattern**: Watches for data changes and triggers appropriate invalidations
 * 3. **Command Pattern**: Encapsulates invalidation operations as executable commands
 * 4. **Factory Pattern**: Creates appropriate invalidation strategies based on requirements
 * 5. **Template Method Pattern**: Defines invalidation workflow with customizable steps
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for cache invalidation and refetch coordination
 * - **OCP**: Extensible through new invalidation strategies without modifying core logic
 * - **LSP**: Different strategies can substitute each other with same interface
 * - **ISP**: Focused interfaces for different invalidation scenarios
 * - **DIP**: Depends on QueryClient abstraction, not concrete implementations
 *
 * React 19 Patterns:
 * - Separation of concerns with dedicated cache management
 * - Performance optimization through intelligent invalidation
 * - Background processing without blocking UI
 * - Integration with React Query's built-in patterns
 */

import { cityQueryKeys } from '@/lib/types/city.types'
import { eventQueryKeys } from '@/lib/types/event.types'

import type { QueryClient } from '@tanstack/react-query'

/**
 * Cache invalidation strategy types
 */
export type InvalidationStrategy = 
  | 'immediate'     // Invalidate and refetch immediately
  | 'background'    // Invalidate and refetch in background
  | 'lazy'          // Mark as stale, refetch on next access
  | 'optimistic'    // Update cache optimistically, then refetch
  | 'batch'         // Batch multiple invalidations together

/**
 * Invalidation scope defines what data should be invalidated
 */
export type InvalidationScope = 
  | 'all'           // All cached data
  | 'domain'        // All data for a specific domain (events, cities)
  | 'specific'      // Specific query keys only
  | 'dependent'     // Data dependent on changed entity

/**
 * Configuration for cache invalidation operations
 */
export interface CacheInvalidationConfig {
  strategy: InvalidationStrategy
  scope: InvalidationScope
  queryKeys?: unknown[][]
  domain?: string
  entity?: { id: string | number, type: string }
  debounceMs?: number
  backgroundRefetch?: boolean
  respectStaleTime?: boolean
}

/**
 * Result of cache invalidation operation
 */
export interface InvalidationResult {
  success: boolean
  invalidatedQueries: number
  refetchedQueries: number
  errors: string[]
  duration: number
}

/**
 * Cache Invalidation Service following Strategy and Command patterns
 * Provides intelligent cache management for TanStack Query
 */
export class CacheInvalidationService {
  private readonly queryClient: QueryClient
  private readonly debounceTimers = new Map<string, NodeJS.Timeout>()
  private readonly batchQueue = new Map<string, CacheInvalidationConfig[]>()

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  /**
   * Main invalidation method following Template Method Pattern
   * Executes invalidation based on provided configuration
   */
  async invalidate(config: CacheInvalidationConfig): Promise<InvalidationResult> {
    const startTime = performance.now()
    const result: InvalidationResult = {
      success: true,
      invalidatedQueries: 0,
      refetchedQueries: 0,
      errors: [],
      duration: 0,
    }

    try {
      // Apply debouncing if configured
      if (config.debounceMs && config.debounceMs > 0) {
        return this.debounceInvalidation(config)
      }

      // Handle batch strategy
      if (config.strategy === 'batch') {
        return this.batchInvalidation(config)
      }

      // Execute invalidation based on strategy
      await this.executeInvalidation(config, result)

      result.duration = performance.now() - startTime
      return result

    } catch (error) {
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown invalidation error')
      result.duration = performance.now() - startTime
      return result
    }
  }

  /**
   * Invalidate all events-related cache following Domain-Driven Design
   */
  async invalidateEvents(strategy: InvalidationStrategy = 'background'): Promise<InvalidationResult> {
    return this.invalidate({
      strategy,
      scope: 'domain',
      domain: 'events',
      queryKeys: [
        [...eventQueryKeys.all],
        [...eventQueryKeys.lists()],
        [...eventQueryKeys.details()],
      ],
    })
  }

  /**
   * Invalidate all cities-related cache
   */
  async invalidateCities(strategy: InvalidationStrategy = 'background'): Promise<InvalidationResult> {
    return this.invalidate({
      strategy,
      scope: 'domain',
      domain: 'cities',
      queryKeys: [
        [...cityQueryKeys.all],
        [...cityQueryKeys.lists()],
        [...cityQueryKeys.details()],
      ],
    })
  }

  /**
   * Invalidate specific event cache and related data
   */
  async invalidateEvent(
    eventId: string | number, 
    strategy: InvalidationStrategy = 'optimistic'
  ): Promise<InvalidationResult> {
    return this.invalidate({
      strategy,
      scope: 'dependent',
      entity: { id: eventId, type: 'event' },
      queryKeys: [
        [...eventQueryKeys.detail(String(eventId))],
        [...eventQueryKeys.lists()], // Event lists might contain this event
      ],
    })
  }

  /**
   * Invalidate specific city cache and related data
   */
  async invalidateCity(
    citySlug: string, 
    strategy: InvalidationStrategy = 'optimistic'
  ): Promise<InvalidationResult> {
    return this.invalidate({
      strategy,
      scope: 'dependent',
      entity: { id: citySlug, type: 'city' },
      queryKeys: [
        [...cityQueryKeys.detail(citySlug)],
        [...cityQueryKeys.lists()],
        [...eventQueryKeys.lists()], // Events filtered by city
      ],
    })
  }

  /**
   * Global cache invalidation for critical updates
   */
  async invalidateAll(strategy: InvalidationStrategy = 'immediate'): Promise<InvalidationResult> {
    return this.invalidate({
      strategy,
      scope: 'all',
    })
  }

  /**
   * Execute invalidation based on strategy following Strategy Pattern
   */
  private async executeInvalidation(
    config: CacheInvalidationConfig,
    result: InvalidationResult
  ): Promise<void> {
    const queryKeys = this.resolveQueryKeys(config)

    switch (config.strategy) {
      case 'immediate':
        await this.immediateInvalidation(queryKeys, result)
        break

      case 'background':
        await this.backgroundInvalidation(queryKeys, result)
        break

      case 'lazy':
        await this.lazyInvalidation(queryKeys, result)
        break

      case 'optimistic':
        await this.optimisticInvalidation(config, queryKeys, result)
        break

      default:
        throw new Error(`Unknown invalidation strategy: ${config.strategy}`)
    }
  }

  /**
   * Immediate invalidation and refetch
   */
  private async immediateInvalidation(
    queryKeys: unknown[][],
    result: InvalidationResult
  ): Promise<void> {
    for (const queryKey of queryKeys) {
      await this.queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      })
      result.invalidatedQueries++
      result.refetchedQueries++
    }
  }

  /**
   * Background invalidation without blocking UI
   */
  private async backgroundInvalidation(
    queryKeys: unknown[][],
    result: InvalidationResult
  ): Promise<void> {
    for (const queryKey of queryKeys) {
      // Invalidate immediately but refetch in background
      await this.queryClient.invalidateQueries({
        queryKey,
        refetchType: 'inactive',
      })
      result.invalidatedQueries++

      // Schedule background refetch
      setTimeout(() => {
        this.queryClient.refetchQueries({
          queryKey,
          type: 'active',
        }).catch(error => {
          console.error('Background refetch failed:', error)
        })
      }, 0)
      result.refetchedQueries++
    }
  }

  /**
   * Lazy invalidation - mark as stale without immediate refetch
   */
  private async lazyInvalidation(
    queryKeys: unknown[][],
    result: InvalidationResult
  ): Promise<void> {
    for (const queryKey of queryKeys) {
      await this.queryClient.invalidateQueries({
        queryKey,
        refetchType: 'none',
      })
      result.invalidatedQueries++
    }
  }

  /**
   * Optimistic invalidation with immediate cache update
   */
  private async optimisticInvalidation(
    _config: CacheInvalidationConfig,
    queryKeys: unknown[][],
    result: InvalidationResult
  ): Promise<void> {
    // For optimistic updates, we might have already updated the cache
    // Just invalidate to ensure eventual consistency
    for (const queryKey of queryKeys) {
      await this.queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      })
      result.invalidatedQueries++
      result.refetchedQueries++
    }
  }

  /**
   * Debounced invalidation to prevent excessive cache operations
   */
  private debounceInvalidation(config: CacheInvalidationConfig): Promise<InvalidationResult> {
    const debounceKey = this.generateDebounceKey(config)
    
    return new Promise((resolve) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(debounceKey)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(debounceKey)
        const result = await this.invalidate({ ...config, debounceMs: 0 })
        resolve(result)
      }, config.debounceMs)

      this.debounceTimers.set(debounceKey, timer)
    })
  }

  /**
   * Batch invalidation for multiple operations
   */
  private async batchInvalidation(config: CacheInvalidationConfig): Promise<InvalidationResult> {
    const batchKey = config.domain || 'default'
    
    // Add to batch queue
    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, [])
    }
    this.batchQueue.get(batchKey)!.push(config)

    // Process batch after short delay
    return new Promise((resolve) => {
      setTimeout(async () => {
        const batch = this.batchQueue.get(batchKey) || []
        this.batchQueue.delete(batchKey)

        const result: InvalidationResult = {
          success: true,
          invalidatedQueries: 0,
          refetchedQueries: 0,
          errors: [],
          duration: 0,
        }

        const startTime = performance.now()

        for (const batchConfig of batch) {
          try {
            const batchResult = await this.invalidate({ 
              ...batchConfig, 
              strategy: 'background' // Use background for batch operations
            })
            result.invalidatedQueries += batchResult.invalidatedQueries
            result.refetchedQueries += batchResult.refetchedQueries
            result.errors.push(...batchResult.errors)
          } catch (error) {
            result.success = false
            result.errors.push(error instanceof Error ? error.message : 'Batch operation failed')
          }
        }

        result.duration = performance.now() - startTime
        resolve(result)
      }, 100) // 100ms batch window
    })
  }

  /**
   * Resolve query keys based on configuration
   */
  private resolveQueryKeys(config: CacheInvalidationConfig): unknown[][] {
    if (config.queryKeys) {
      return config.queryKeys
    }

    switch (config.scope) {
      case 'all':
        return [
          [...eventQueryKeys.all],
          [...cityQueryKeys.all],
        ]

      case 'domain':
        if (config.domain === 'events') {
          return [[...eventQueryKeys.all]]
        }
        if (config.domain === 'cities') {
          return [[...cityQueryKeys.all]]
        }
        return []

      case 'specific':
      case 'dependent':
        // These should provide queryKeys explicitly
        return []

      default:
        return []
    }
  }

  /**
   * Generate unique debounce key for configuration
   */
  private generateDebounceKey(config: CacheInvalidationConfig): string {
    return JSON.stringify({
      strategy: config.strategy,
      scope: config.scope,
      domain: config.domain,
      entity: config.entity,
      queryKeys: config.queryKeys,
    })
  }

  /**
   * Cleanup method for service disposal
   */
  dispose(): void {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
    this.batchQueue.clear()
  }
}

/**
 * Factory function to create cache invalidation service
 * Following Factory Pattern for service instantiation
 */
export const createCacheInvalidationService = (queryClient: QueryClient): CacheInvalidationService => {
  return new CacheInvalidationService(queryClient)
}

/**
 * Default invalidation configurations for common scenarios
 */
export const DEFAULT_INVALIDATION_CONFIGS = {
  // After creating new event
  EVENT_CREATED: {
    strategy: 'background' as InvalidationStrategy,
    scope: 'domain' as InvalidationScope,
    domain: 'events',
  },

  // After updating event
  EVENT_UPDATED: {
    strategy: 'optimistic' as InvalidationStrategy,
    scope: 'dependent' as InvalidationScope,
    debounceMs: 300,
  },

  // After deleting event
  EVENT_DELETED: {
    strategy: 'immediate' as InvalidationStrategy,
    scope: 'domain' as InvalidationScope,
    domain: 'events',
  },

  // User navigated to different page
  NAVIGATION_CHANGE: {
    strategy: 'background' as InvalidationStrategy,
    scope: 'all' as InvalidationScope,
    backgroundRefetch: true,
  },

  // Network reconnection
  NETWORK_RECONNECT: {
    strategy: 'background' as InvalidationStrategy,
    scope: 'all' as InvalidationScope,
    respectStaleTime: false,
  },
} as const