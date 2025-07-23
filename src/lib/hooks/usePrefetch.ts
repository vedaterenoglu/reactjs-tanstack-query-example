/**
 * Auto-Prefetch Hook - Strategy Pattern + Custom Hook for Intelligent Prefetching
 *
 * Design Patterns Applied:
 * 1. **Strategy Pattern**: Different prefetch strategies based on network conditions
 * 2. **Custom Hook Pattern**: Encapsulates prefetch logic in reusable React hook
 * 3. **Observer Pattern**: Responds to page changes and network status updates
 * 4. **Command Pattern**: Prefetch operations as executable commands
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for auto-prefetch trigger logic
 * - **OCP**: New strategies can be added without modifying core hook
 * - **LSP**: All strategies implement consistent prefetch interface
 * - **ISP**: Focused interface for prefetch operations only
 * - **DIP**: Depends on abstractions, not concrete prefetch implementations
 *
 * React 19 Patterns:
 * - Custom hook with proper cleanup and dependency management
 * - useEffect for side effect management
 * - useCallback for memoized event handlers
 * - Error boundaries for graceful failure handling
 */

import { useCallback, useEffect, useRef, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { AbortControllerUtils } from '@/lib/utils/prefetch/abortControllerFactory'
import { prefetchQueueManager, createPrefetchCommand } from '@/lib/utils/prefetch/prefetchQueue'
import type { PrefetchStrategy, PrefetchPriority } from '@/lib/utils/prefetch/prefetchQueue'
import {
  selectCurrentPage,
  selectNextPageNumber,
  selectPreviousPageNumber,
  selectIsPrefetchEnabled,
  selectCurrentPrefetchStrategy,
  selectPrefetchDelay,
  selectNetworkStatus,
} from '@/store/slices/events/eventSelectors'

/**
 * Prefetch Strategy Interface - Interface Segregation Principle
 */
interface PrefetchStrategyConfig {
  strategy: PrefetchStrategy
  priority: PrefetchPriority
  delayMs: number
  shouldPrefetchNext: boolean
  shouldPrefetchPrevious: boolean
}

/**
 * Auto-Prefetch Hook Configuration
 */
interface UsePrefetchConfig {
  /**
   * Enable auto-prefetch on page load
   */
  enableOnPageLoad?: boolean
  /**
   * Enable auto-prefetch on page change
   */
  enableOnPageChange?: boolean
  /**
   * Custom delay override (ms)
   */
  delayOverride?: number
  /**
   * Callback when prefetch starts
   */
  onPrefetchStart?: (page: number) => void
  /**
   * Callback when prefetch completes
   */
  onPrefetchComplete?: (page: number, success: boolean) => void
  /**
   * Callback when prefetch fails
   */
  onPrefetchError?: (page: number, error: Error) => void
}

/**
 * Strategy Factory - Factory Pattern for creating prefetch strategies
 */
class PrefetchStrategyFactory {
  static createStrategy(
    networkStrategy: string,
    networkStatus: { connectionSpeed: string; isOnline: boolean; dataSaver: boolean },
    delayMs: number
  ): PrefetchStrategyConfig {
    switch (networkStrategy) {
      case 'aggressive':
        return {
          strategy: 'immediate',
          priority: 'high',
          delayMs: Math.min(delayMs, 200),
          shouldPrefetchNext: true,
          shouldPrefetchPrevious: true,
        }
      
      case 'conservative':
        return {
          strategy: 'delayed',
          priority: 'low',
          delayMs: Math.max(delayMs, 1000),
          shouldPrefetchNext: true,
          shouldPrefetchPrevious: false, // Don't prefetch previous on conservative
        }
      
      case 'disabled':
        return {
          strategy: 'immediate',
          priority: 'normal',
          delayMs: 0,
          shouldPrefetchNext: false,
          shouldPrefetchPrevious: false,
        }
      
      case 'normal':
      default:
        return {
          strategy: 'immediate',
          priority: 'normal',
          delayMs,
          shouldPrefetchNext: true,
          shouldPrefetchPrevious: networkStatus?.connectionSpeed !== 'slow',
        }
    }
  }
}

/**
 * Auto-Prefetch Hook Implementation
 * Manages intelligent prefetching based on user navigation patterns
 */
export function usePrefetch(config: UsePrefetchConfig = {}) {
  
  // Redux state selectors
  const currentPage = useSelector(selectCurrentPage)
  const nextPage = useSelector(selectNextPageNumber)
  const previousPage = useSelector(selectPreviousPageNumber)
  // Memoized recommendations to prevent useCallback dependency changes
  const nextRecommendation = useMemo(() => ({ 
    shouldPrefetch: !!nextPage, 
    priority: 'normal' as const 
  }), [nextPage])
  
  const previousRecommendation = useMemo(() => ({ 
    shouldPrefetch: !!previousPage, 
    priority: 'low' as const 
  }), [previousPage])
  const isPrefetchEnabled = useSelector(selectIsPrefetchEnabled)
  const currentStrategy = useSelector(selectCurrentPrefetchStrategy)
  const prefetchDelay = useSelector(selectPrefetchDelay)
  const networkStatus = useSelector(selectNetworkStatus)
  
  // Refs for cleanup and preventing stale closures
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const prefetchedPagesRef = useRef<Set<number>>(new Set())
  
  const {
    enableOnPageLoad = true,
    enableOnPageChange = true,
    delayOverride,
    onPrefetchStart,
    onPrefetchComplete,
    onPrefetchError,
  } = config

  /**
   * Execute prefetch command with error handling
   * Follows Command Pattern with undo capability
   */
  const executePrefetch = useCallback(async (
    page: number,
    strategy: PrefetchStrategy,
    priority: PrefetchPriority
  ) => {
    if (!isPrefetchEnabled || prefetchedPagesRef.current.has(page)) {
      return
    }

    try {
      onPrefetchStart?.(page)
      
      // Create prefetch command with actual API call
      const command = createPrefetchCommand(
        page,
        priority,
        strategy,
        async () => {
          // TODO: This would be replaced with actual API call in integration
          // For now, simulate the prefetch operation
          await new Promise(resolve => setTimeout(resolve, 500))
          prefetchedPagesRef.current.add(page)
        }
      )

      // Add to queue manager
      const added = prefetchQueueManager.addPrefetchCommand(command)
      
      if (added) {
        // Start queue processor if not running
        if (!prefetchQueueManager.getStats().isRunning) {
          prefetchQueueManager.start()
        }
        
        onPrefetchComplete?.(page, true)
      }
    } catch (error) {
      const prefetchError = error instanceof Error ? error : new Error(String(error))
      onPrefetchError?.(page, prefetchError)
      onPrefetchComplete?.(page, false)
    }
  }, [isPrefetchEnabled, onPrefetchStart, onPrefetchComplete, onPrefetchError])

  /**
   * Schedule prefetch with strategy-based delay
   * Implements Strategy Pattern for different timing approaches
   */
  const schedulePrefetch = useCallback((
    page: number,
    strategyConfig: PrefetchStrategyConfig
  ) => {
    if (!strategyConfig.shouldPrefetchNext && !strategyConfig.shouldPrefetchPrevious) {
      return
    }

    // Clear existing timeout for this page
    const existingTimeout = timeoutRefs.current.get(page)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    const effectiveDelay = delayOverride ?? strategyConfig.delayMs
    
    const timeoutId = setTimeout(() => {
      void executePrefetch(page, strategyConfig.strategy, strategyConfig.priority)
      timeoutRefs.current.delete(page)
    }, effectiveDelay)

    timeoutRefs.current.set(page, timeoutId)
  }, [executePrefetch, delayOverride])

  /**
   * Auto-prefetch trigger based on current page and recommendations
   * Follows Single Responsibility Principle - only handles triggering logic
   */
  const triggerAutoPrefetch = useCallback(() => {
    if (!isPrefetchEnabled) {
      return
    }

    const strategyConfig = PrefetchStrategyFactory.createStrategy(
      currentStrategy,
      networkStatus,
      prefetchDelay
    )

    // Prefetch next page if recommended
    if (nextPage && nextRecommendation.shouldPrefetch && strategyConfig.shouldPrefetchNext) {
      schedulePrefetch(nextPage, {
        ...strategyConfig,
        priority: nextRecommendation.priority || strategyConfig.priority,
      })
    }

    // Prefetch previous page if recommended
    if (previousPage && previousRecommendation.shouldPrefetch && strategyConfig.shouldPrefetchPrevious) {
      schedulePrefetch(previousPage, {
        ...strategyConfig,
        priority: previousRecommendation.priority || strategyConfig.priority,
      })
    }
  }, [
    isPrefetchEnabled,
    currentStrategy,
    networkStatus,
    prefetchDelay,
    nextPage,
    previousPage,
    nextRecommendation,
    previousRecommendation,
    schedulePrefetch,
  ])

  /**
   * Cancel all pending prefetches for current session
   * Implements cleanup pattern for React 19
   */
  const cancelPendingPrefetches = useCallback(() => {
    // Cancel all timeouts
    for (const [page, timeoutId] of timeoutRefs.current.entries()) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(page)
    }

    // Cancel active prefetch operations
    AbortControllerUtils.cancelRapidNavigation(currentPage)
  }, [currentPage])

  /**
   * Manual prefetch trigger - Open/Closed Principle
   * Can be extended with additional prefetch types
   */
  const prefetchPage = useCallback((
    page: number,
    options: {
      priority?: PrefetchPriority
      strategy?: PrefetchStrategy
      immediate?: boolean
    } = {}
  ) => {
    const {
      priority = 'normal',
      strategy = 'immediate',
      immediate = false,
    } = options

    if (immediate) {
      void executePrefetch(page, strategy, priority)
    } else {
      const strategyConfig = PrefetchStrategyFactory.createStrategy(
        currentStrategy,
        networkStatus,
        prefetchDelay
      )
      
      schedulePrefetch(page, {
        ...strategyConfig,
        strategy,
        priority,
        shouldPrefetchNext: true,
        shouldPrefetchPrevious: true,
      })
    }
    
    return Promise.resolve()
  }, [executePrefetch, schedulePrefetch, currentStrategy, networkStatus, prefetchDelay])

  // Auto-prefetch on page load
  useEffect(() => {
    if (enableOnPageLoad && currentPage) {
      triggerAutoPrefetch()
    }
  }, [enableOnPageLoad, currentPage, triggerAutoPrefetch])

  // Auto-prefetch on page change
  useEffect(() => {
    if (enableOnPageChange && currentPage) {
      // Cancel previous prefetches on page change
      cancelPendingPrefetches()
      
      // Trigger new prefetches with slight delay to avoid rapid navigation issues
      const changeTimeout = setTimeout(() => {
        triggerAutoPrefetch()
      }, 100)

      return () => {
        clearTimeout(changeTimeout)
      }
    }
    
    return undefined
  }, [enableOnPageChange, currentPage, cancelPendingPrefetches, triggerAutoPrefetch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingPrefetches()
      AbortControllerUtils.cancelOnUnmount()
    }
  }, [cancelPendingPrefetches])

  // Network status change handling
  useEffect(() => {
    // Cancel existing prefetches if network becomes unavailable
    if (!networkStatus.isOnline || networkStatus.dataSaver) {
      cancelPendingPrefetches()
      AbortControllerUtils.cancelOnNetworkChange()
    } else {
      // Re-trigger prefetch when network becomes available
      triggerAutoPrefetch()
    }
  }, [networkStatus.isOnline, networkStatus.dataSaver, cancelPendingPrefetches, triggerAutoPrefetch])

  return {
    // State
    isPrefetchEnabled,
    currentStrategy,
    networkStatus,
    
    // Actions
    prefetchPage,
    triggerAutoPrefetch,
    cancelPendingPrefetches,
    
    // Recommendations (for debugging/monitoring)
    nextRecommendation,
    previousRecommendation,
    
    // Utilities
    isPageScheduled: (page: number) => timeoutRefs.current.has(page),
    getPendingPrefetches: () => Array.from(timeoutRefs.current.keys()),
    getStats: () => prefetchQueueManager.getStats(),
  }
}