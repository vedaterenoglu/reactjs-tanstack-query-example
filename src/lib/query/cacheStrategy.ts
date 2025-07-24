/**
 * Cache Strategy Service - Unified cache management combining invalidation and background refetching
 *
 * Design Patterns Applied:
 * 1. **Facade Pattern**: Provides unified interface for complex cache management operations
 * 2. **Coordinator Pattern**: Coordinates between invalidation and refetch services
 * 3. **Strategy Pattern**: Different cache strategies for different data types and scenarios
 * 4. **Observer Pattern**: Observes data mutations and triggers appropriate cache updates
 * 5. **Template Method Pattern**: Defines cache management workflow with customizable steps
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for coordinating cache management strategies
 * - **OCP**: Extensible through new cache strategies without modifying core coordination
 * - **LSP**: Different strategies can substitute each other with same interface
 * - **ISP**: Focused interfaces for different cache management scenarios
 * - **DIP**: Depends on service abstractions, not concrete implementations
 *
 * React 19 Patterns:
 * - Separation of concerns with dedicated cache coordination
 * - Performance optimization through intelligent cache orchestration
 * - Event-driven updates without blocking user interactions
 * - Integration with React Query's optimistic update patterns
 */

import { cityQueryKeys } from '@/lib/types/city.types'
import { eventQueryKeys } from '@/lib/types/event.types'

import { BackgroundRefetchService, type BackgroundRefetchConfig, type RefetchStrategy } from './backgroundRefetch'
import { CacheInvalidationService, type CacheInvalidationConfig, type InvalidationStrategy } from './cacheInvalidation'

import type { QueryClient } from '@tanstack/react-query'

/**
 * Cache strategy types for different data scenarios
 */
export type CacheStrategyType = 
  | 'real-time'      // Critical data requiring immediate updates
  | 'standard'       // Normal application data with balanced freshness
  | 'background'     // Non-critical data updated in background
  | 'on-demand'      // Data updated only when explicitly requested
  | 'read-heavy'     // Frequently read data with infrequent updates

/**
 * Data mutation types that trigger cache updates
 */
export type MutationType = 
  | 'create'         // New entity created
  | 'update'         // Existing entity modified
  | 'delete'         // Entity removed
  | 'bulk-update'    // Multiple entities modified
  | 'relationship'   // Related data changed

/**
 * Cache update priority levels
 */
export type UpdatePriority = 
  | 'critical'       // Must update immediately
  | 'high'           // Update soon, user might notice delay
  | 'normal'         // Standard update timing
  | 'low'            // Can be delayed significantly

/**
 * Configuration for cache strategy coordination
 */
export interface CacheStrategyConfig {
  defaultStrategy: CacheStrategyType
  strategies: Record<string, {
    type: CacheStrategyType
    invalidation: Partial<CacheInvalidationConfig>
    refetch: Partial<BackgroundRefetchConfig>
    priority: UpdatePriority
  }>
  mutationHandlers: Record<MutationType, {
    invalidationStrategy: InvalidationStrategy
    refetchStrategy: RefetchStrategy
    debounceMs: number
    priority: UpdatePriority
  }>
  globalSettings: {
    enableOptimisticUpdates: boolean
    enableBackgroundSync: boolean
    respectStaleTime: boolean
    batchUpdates: boolean
  }
}

/**
 * Cache operation result with detailed metrics
 */
export interface CacheOperationResult {
  success: boolean
  invalidationResult?: {
    invalidatedQueries: number
    errors: string[]
  }
  refetchResult?: {
    refetchedQueries: number
    errors: string[]
  }
  duration: number
  strategy: CacheStrategyType
  priority: UpdatePriority
}

/**
 * Cache Strategy Service following Facade and Coordinator patterns
 * Provides unified cache management across the application
 */
export class CacheStrategyService {
  private readonly queryClient: QueryClient
  private readonly invalidationService: CacheInvalidationService
  private readonly refetchService: BackgroundRefetchService
  private config: CacheStrategyConfig
  private operationQueue = new Map<string, Promise<CacheOperationResult>>()
  private metrics = {
    operationsCount: 0,
    successRate: 0,
    averageDuration: 0,
    errorCount: 0,
  }

  constructor(
    queryClient: QueryClient,
    config?: Partial<CacheStrategyConfig>
  ) {
    this.queryClient = queryClient
    this.invalidationService = new CacheInvalidationService(queryClient)
    this.refetchService = new BackgroundRefetchService(queryClient)
    this.config = this.buildConfig(config)
  }

  /**
   * Initialize cache strategy service
   * Following Template Method Pattern for initialization workflow
   */
  async initialize(): Promise<void> {
    // Start background refetch service
    this.refetchService.start()

    // Setup mutation observers if optimistic updates are enabled
    if (this.config.globalSettings.enableOptimisticUpdates) {
      this.setupMutationObservers()
    }

    // Initialize background sync if enabled
    if (this.config.globalSettings.enableBackgroundSync) {
      this.setupBackgroundSync()
    }
  }

  /**
   * Handle data mutation with appropriate cache strategy
   * Following Strategy Pattern for mutation-specific handling
   */
  async handleMutation(
    mutationType: MutationType,
    entityType: string,
    entityId?: string | number,
    data?: unknown
  ): Promise<CacheOperationResult> {
    const startTime = performance.now()
    const operationId = this.generateOperationId(mutationType, entityType, entityId)

    // Check if operation is already in progress
    const existingOperation = this.operationQueue.get(operationId)
    if (existingOperation) {
      return existingOperation
    }

    // Create new operation
    const operation = this.executeMutation(mutationType, entityType, entityId, data, startTime)
    this.operationQueue.set(operationId, operation)

    try {
      const result = await operation
      this.updateMetrics(result)
      return result
    } finally {
      this.operationQueue.delete(operationId)
    }
  }

  /**
   * Apply cache strategy for specific domain
   */
  async applyCacheStrategy(
    domain: string,
    strategyType?: CacheStrategyType
  ): Promise<CacheOperationResult> {
    const strategy = strategyType || this.config.defaultStrategy
    // eslint-disable-next-line security/detect-object-injection
    const domainConfig = this.config.strategies[domain] || this.getDefaultDomainConfig(strategy)

    const startTime = performance.now()
    const result: CacheOperationResult = {
      success: true,
      duration: 0,
      strategy,
      priority: domainConfig.priority,
    }

    try {
      // Execute invalidation if configured
      if (domainConfig.invalidation) {
        const invalidationResult = await this.invalidationService.invalidate({
          strategy: 'background',
          scope: 'domain',
          domain,
          ...domainConfig.invalidation,
        })
        result.invalidationResult = {
          invalidatedQueries: invalidationResult.invalidatedQueries,
          errors: invalidationResult.errors,
        }
      }

      // Update refetch configuration if needed
      if (domainConfig.refetch) {
        this.refetchService.updateConfig(domainConfig.refetch)
      }

      result.duration = performance.now() - startTime
      return result

    } catch {
      result.success = false
      result.duration = performance.now() - startTime
      return result
    }
  }

  /**
   * Optimistic update with automatic rollback on failure
   * Following Optimistic Update Pattern
   */
  async optimisticUpdate<T>(
    queryKey: unknown[],
    updater: (oldData: T | undefined) => T,
    mutationPromise: Promise<T>
  ): Promise<T> {
    // Store previous data for rollback
    const previousData = this.queryClient.getQueryData<T>(queryKey)

    try {
      // Apply optimistic update
      this.queryClient.setQueryData(queryKey, updater)

      // Wait for actual mutation
      const result = await mutationPromise

      // Update cache with real result
      this.queryClient.setQueryData(queryKey, result)

      // Invalidate related queries
      await this.invalidationService.invalidate({
        strategy: 'optimistic',
        scope: 'dependent',
        queryKeys: [queryKey],
      })

      return result

    } catch (error) {
      // Rollback on failure
      this.queryClient.setQueryData(queryKey, previousData)

      // Re-fetch to ensure consistency
      await this.queryClient.refetchQueries({
        queryKey,
      })

      throw error
    }
  }

  /**
   * Bulk cache operations with batching
   */
  async bulkOperation(
    operations: Array<{
      type: MutationType
      entityType: string
      entityId?: string | number
      data?: unknown
    }>
  ): Promise<CacheOperationResult[]> {
    if (!this.config.globalSettings.batchUpdates) {
      // Execute operations individually
      return Promise.all(
        operations.map(op => 
          this.handleMutation(op.type, op.entityType, op.entityId, op.data)
        )
      )
    }

    // Group operations by domain for batching
    const operationGroups = this.groupOperationsByDomain(operations)
    const results: CacheOperationResult[] = []

    for (const [domain, domainOps] of operationGroups.entries()) {
      const batchResult = await this.executeBatchOperation(domain, domainOps)
      results.push(...batchResult)
    }

    return results
  }

  /**
   * Get cache strategy service status and metrics
   */
  getStatus(): {
    isActive: boolean
    config: CacheStrategyConfig
    metrics: typeof this.metrics
    activeOperations: number
    refetchStatus: ReturnType<BackgroundRefetchService['getStatus']>
  } {
    return {
      isActive: this.operationQueue.size > 0,
      config: { ...this.config },
      metrics: { ...this.metrics },
      activeOperations: this.operationQueue.size,
      refetchStatus: this.refetchService.getStatus(),
    }
  }

  /**
   * Cleanup and dispose of service resources
   */
  dispose(): void {
    this.refetchService.stop()
    this.invalidationService.dispose()
    this.operationQueue.clear()
  }

  /**
   * Execute mutation with appropriate cache handling
   */
  private async executeMutation(
    mutationType: MutationType,
    entityType: string,
    entityId?: string | number,
    data?: unknown,
    startTime?: number
  ): Promise<CacheOperationResult> {
    // eslint-disable-next-line security/detect-object-injection
    const mutationConfig = this.config.mutationHandlers[mutationType]
    const start = startTime || performance.now()

    const result: CacheOperationResult = {
      success: true,
      duration: 0,
      strategy: this.getStrategyForEntity(entityType),
      priority: mutationConfig?.priority || 'normal',
    }

    try {
      // Handle different mutation types
      switch (mutationType) {
        case 'create':
          await this.handleCreateMutation(entityType, data, result)
          break

        case 'update':
          await this.handleUpdateMutation(entityType, entityId, data, result)
          break

        case 'delete':
          await this.handleDeleteMutation(entityType, entityId, result)
          break

        case 'bulk-update':
          await this.handleBulkUpdateMutation(entityType, data, result)
          break

        case 'relationship':
          await this.handleRelationshipMutation(entityType, entityId, data, result)
          break
      }

      result.duration = performance.now() - start
      return result

    } catch {
      result.success = false
      result.duration = performance.now() - start
      return result
    }
  }

  /**
   * Handle create mutations
   */
  private async handleCreateMutation(
    entityType: string,
    _data: unknown,
    result: CacheOperationResult
  ): Promise<void> {
    // Invalidate list queries to include new entity
    const invalidationResult = await this.invalidationService.invalidate({
      strategy: 'background',
      scope: 'domain',
      domain: entityType,
    })

    result.invalidationResult = {
      invalidatedQueries: invalidationResult.invalidatedQueries,
      errors: invalidationResult.errors,
    }
  }

  /**
   * Handle update mutations
   */
  private async handleUpdateMutation(
    entityType: string,
    entityId: string | number | undefined,
    _data: unknown,
    result: CacheOperationResult
  ): Promise<void> {
    if (!entityId) return

    // Invalidate specific entity and related lists
    const queryKeys = this.getEntityQueryKeys(entityType, entityId)
    
    const invalidationResult = await this.invalidationService.invalidate({
      strategy: 'optimistic',
      scope: 'dependent',
      queryKeys,
    })

    result.invalidationResult = {
      invalidatedQueries: invalidationResult.invalidatedQueries,
      errors: invalidationResult.errors,
    }
  }

  /**
   * Handle delete mutations
   */
  private async handleDeleteMutation(
    entityType: string,
    entityId: string | number | undefined,
    result: CacheOperationResult
  ): Promise<void> {
    if (!entityId) return

    // Remove from cache and invalidate lists
    const queryKeys = this.getEntityQueryKeys(entityType, entityId)
    
    // Remove specific entity data
    for (const queryKey of queryKeys) {
      this.queryClient.removeQueries({ queryKey })
    }

    // Invalidate list queries
    const invalidationResult = await this.invalidationService.invalidate({
      strategy: 'immediate',
      scope: 'domain',
      domain: entityType,
    })

    result.invalidationResult = {
      invalidatedQueries: invalidationResult.invalidatedQueries,
      errors: invalidationResult.errors,
    }
  }

  /**
   * Handle bulk update mutations
   */
  private async handleBulkUpdateMutation(
    entityType: string,
    _data: unknown,
    result: CacheOperationResult
  ): Promise<void> {
    // Invalidate entire domain for bulk operations
    const invalidationResult = await this.invalidationService.invalidate({
      strategy: 'background',
      scope: 'domain',
      domain: entityType,
    })

    result.invalidationResult = {
      invalidatedQueries: invalidationResult.invalidatedQueries,
      errors: invalidationResult.errors,
    }
  }

  /**
   * Handle relationship mutations (changes affecting related entities)
   */
  private async handleRelationshipMutation(
    entityType: string,
    _entityId: string | number | undefined,
    _data: unknown,
    result: CacheOperationResult
  ): Promise<void> {
    // Invalidate related entities based on relationships
    const relatedDomains = this.getRelatedDomains(entityType)
    
    for (const domain of relatedDomains) {
      await this.invalidationService.invalidate({
        strategy: 'background',
        scope: 'domain',
        domain,
      })
    }

    result.invalidationResult = {
      invalidatedQueries: relatedDomains.length,
      errors: [],
    }
  }

  /**
   * Get query keys for specific entity
   */
  private getEntityQueryKeys(entityType: string, entityId: string | number): unknown[][] {
    switch (entityType) {
      case 'events':
        return [
          [...eventQueryKeys.detail(String(entityId))],
          [...eventQueryKeys.lists()],
        ]
      case 'cities':
        return [
          [...cityQueryKeys.detail(String(entityId))],
          [...cityQueryKeys.lists()],
          [...eventQueryKeys.lists()], // Events might be filtered by city
        ]
      default:
        return []
    }
  }

  /**
   * Get related domains for relationship updates
   */
  private getRelatedDomains(entityType: string): string[] {
    switch (entityType) {
      case 'events':
        return ['cities'] // Events are related to cities
      case 'cities':
        return ['events'] // Cities are related to events
      default:
        return []
    }
  }

  /**
   * Get cache strategy for entity type
   */
  private getStrategyForEntity(entityType: string): CacheStrategyType {
    // eslint-disable-next-line security/detect-object-injection
    const domainConfig = this.config.strategies[entityType]
    return domainConfig?.type || this.config.defaultStrategy
  }

  /**
   * Build configuration with defaults
   */
  private buildConfig(customConfig?: Partial<CacheStrategyConfig>): CacheStrategyConfig {
    const defaultConfig: CacheStrategyConfig = {
      defaultStrategy: 'standard',
      strategies: {
        events: {
          type: 'standard',
          invalidation: { strategy: 'background' },
          refetch: { strategy: 'balanced' },
          priority: 'high',
        },
        cities: {
          type: 'background',
          invalidation: { strategy: 'lazy' },
          refetch: { strategy: 'conservative' },
          priority: 'normal',
        },
      },
      mutationHandlers: {
        create: {
          invalidationStrategy: 'background',
          refetchStrategy: 'balanced',
          debounceMs: 100,
          priority: 'high',
        },
        update: {
          invalidationStrategy: 'optimistic',
          refetchStrategy: 'balanced',
          debounceMs: 300,
          priority: 'normal',
        },
        delete: {
          invalidationStrategy: 'immediate',
          refetchStrategy: 'aggressive',
          debounceMs: 0,
          priority: 'critical',
        },
        'bulk-update': {
          invalidationStrategy: 'batch',
          refetchStrategy: 'conservative',
          debounceMs: 500,
          priority: 'low',
        },
        relationship: {
          invalidationStrategy: 'background',
          refetchStrategy: 'network-aware',
          debounceMs: 200,
          priority: 'normal',
        },
      },
      globalSettings: {
        enableOptimisticUpdates: true,
        enableBackgroundSync: true,
        respectStaleTime: true,
        batchUpdates: true,
      },
    }

    return { ...defaultConfig, ...customConfig }
  }

  /**
   * Get default domain configuration
   */
  private getDefaultDomainConfig(strategy: CacheStrategyType) {
    return {
      type: strategy,
      invalidation: { strategy: 'background' as InvalidationStrategy },
      refetch: { strategy: 'balanced' as RefetchStrategy },
      priority: 'normal' as UpdatePriority,
    }
  }

  /**
   * Setup mutation observers for optimistic updates
   */
  private setupMutationObservers(): void {
    // This would integrate with TanStack Query's mutation observers
    // Implementation would depend on specific mutation patterns
    // Mutation observers setup - implementation would go here
  }

  /**
   * Setup background synchronization
   */
  private setupBackgroundSync(): void {
    // This would setup periodic sync with server
    // Implementation would depend on specific sync requirements
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(
    mutationType: MutationType,
    entityType: string,
    entityId?: string | number
  ): string {
    return `${mutationType}-${entityType}-${entityId || 'bulk'}`
  }

  /**
   * Update service metrics
   */
  private updateMetrics(result: CacheOperationResult): void {
    this.metrics.operationsCount++
    
    if (result.success) {
      this.metrics.successRate = 
        (this.metrics.successRate * (this.metrics.operationsCount - 1) + 1) / 
        this.metrics.operationsCount
    } else {
      this.metrics.errorCount++
      this.metrics.successRate = 
        (this.metrics.successRate * (this.metrics.operationsCount - 1)) / 
        this.metrics.operationsCount
    }

    this.metrics.averageDuration = 
      (this.metrics.averageDuration * (this.metrics.operationsCount - 1) + result.duration) / 
      this.metrics.operationsCount
  }

  /**
   * Group operations by domain for batching
   */
  private groupOperationsByDomain(
    operations: Array<{
      type: MutationType
      entityType: string
      entityId?: string | number
      data?: unknown
    }>
  ): Map<string, typeof operations> {
    const groups = new Map<string, typeof operations>()
    
    for (const op of operations) {
      if (!groups.has(op.entityType)) {
        groups.set(op.entityType, [])
      }
      groups.get(op.entityType)!.push(op)
    }

    return groups
  }

  /**
   * Execute batch operation for domain
   */
  private async executeBatchOperation(
    domain: string,
    operations: Array<{
      type: MutationType
      entityType: string
      entityId?: string | number
      data?: unknown
    }>
  ): Promise<CacheOperationResult[]> {
    // For batch operations, execute all mutations then invalidate once
    const results: CacheOperationResult[] = []
    
    for (const op of operations) {
      const result = await this.executeMutation(op.type, op.entityType, op.entityId, op.data)
      results.push(result)
    }

    // Single domain invalidation for all operations
    await this.invalidationService.invalidate({
      strategy: 'batch',
      scope: 'domain',
      domain,
    })

    return results
  }
}

/**
 * Factory function to create cache strategy service
 * Following Factory Pattern for service instantiation
 */
export const createCacheStrategyService = (
  queryClient: QueryClient,
  config?: Partial<CacheStrategyConfig>
): CacheStrategyService => {
  return new CacheStrategyService(queryClient, config)
}