/**
 * Prefetch Cancellation Hook - Chain of Responsibility + Template Method Pattern
 *
 * Design Patterns Applied:
 * 1. **Chain of Responsibility Pattern**: Multiple cancellation handlers process different scenarios
 * 2. **Template Method Pattern**: Consistent cancellation workflow with customizable steps
 * 3. **Observer Pattern**: Responds to navigation, network, and user events
 * 4. **Strategy Pattern**: Different cancellation strategies based on trigger type
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for prefetch cancellation logic and coordination
 * - **OCP**: New cancellation handlers can be added without modifying existing code
 * - **LSP**: All handlers implement consistent CancellationHandler interface
 * - **ISP**: Focused interfaces for different cancellation concerns
 * - **DIP**: Depends on abstractions, not concrete cancellation implementations
 *
 * React 19 Patterns:
 * - Custom hook with proper event listener cleanup
 * - useEffect for side effect management with dependencies
 * - useCallback for memoized event handlers
 * - Error handling with graceful degradation
 */

import { useCallback, useEffect, useRef } from 'react'
import { useAppSelector } from '@/store'

import { AbortControllerUtils } from '@/lib/utils/prefetch/abortControllerFactory'
import type { AbortReason } from '@/lib/utils/prefetch/abortControllerFactory'
import { prefetchQueueManager } from '@/lib/utils/prefetch/prefetchQueue'
import {
  selectCurrentPage,
  selectIsChangingPage,
  selectNetworkStatus,
  selectActivePrefetchCount,
} from '@/store/slices/events/eventSelectors'

/**
 * Cancellation Handler Interface - Interface Segregation Principle
 */
interface CancellationHandler {
  readonly type: CancellationTrigger
  readonly priority: number
  canHandle(trigger: CancellationTrigger, context: CancellationContext): boolean
  execute(context: CancellationContext): Promise<CancellationResult>
}

/**
 * Cancellation Context - Data Transfer Object
 */
interface CancellationContext {
  trigger: CancellationTrigger
  currentPage: number
  previousPage: number | undefined
  networkStatus: {
    isOnline: boolean
    connectionSpeed: string
    dataSaver: boolean
    lastChecked: number
  }
  timestamp: number
  metadata: Record<string, unknown>
}

/**
 * Cancellation Result
 */
interface CancellationResult {
  cancelled: boolean
  affectedCount: number
  reason: AbortReason
  duration: number
  errors?: Error[]
}

/**
 * Cancellation Trigger Types - Open/Closed Principle
 * New triggers can be added without modifying existing handlers
 */
type CancellationTrigger =
  | 'rapid-navigation'
  | 'page-change'
  | 'network-offline'
  | 'network-slow'
  | 'user-action'
  | 'component-unmount'
  | 'manual'
  | 'error-threshold'
  | 'memory-pressure'

/**
 * Configuration for cancellation system
 */
interface CancellationConfig {
  /**
   * Enable rapid navigation detection
   */
  enableRapidNavigation?: boolean
  /**
   * Time threshold for rapid navigation (ms)
   */
  rapidNavigationThreshold?: number
  /**
   * Enable network-based cancellation
   */
  enableNetworkCancellation?: boolean
  /**
   * Enable error threshold cancellation
   */
  enableErrorThreshold?: boolean
  /**
   * Max errors before cancelling all prefetches
   */
  maxErrors?: number
  /**
   * Custom cancellation handlers
   */
  customHandlers?: CancellationHandler[]
}

/**
 * Rapid Navigation Cancellation Handler
 * Implements Chain of Responsibility pattern
 */
class RapidNavigationHandler implements CancellationHandler {
  readonly type: CancellationTrigger = 'rapid-navigation'
  readonly priority = 1 // High priority

  private lastNavigationTime = 0
  private readonly threshold: number

  constructor(threshold = 500) {
    this.threshold = threshold
  }

  canHandle(
    trigger: CancellationTrigger,
    context: CancellationContext
  ): boolean {
    if (trigger !== 'rapid-navigation' && trigger !== 'page-change') {
      return false
    }

    const timeSinceLastNavigation = context.timestamp - this.lastNavigationTime
    const isRapidNavigation = timeSinceLastNavigation < this.threshold

    this.lastNavigationTime = context.timestamp

    return isRapidNavigation
  }

  async execute(_context: CancellationContext): Promise<CancellationResult> {
    const startTime = performance.now()

    try {
      // Cancel all prefetches for rapid navigation
      const cancelledCount = AbortControllerUtils.cancelRapidNavigation(
        _context.currentPage
      )

      // Clear queue for current page
      const queueCancelledCount = prefetchQueueManager.cancelPage(
        _context.currentPage
      )

      return {
        cancelled: true,
        affectedCount: cancelledCount + queueCancelledCount,
        reason: 'rapid-navigation',
        duration: performance.now() - startTime,
      }
    } catch (error) {
      return {
        cancelled: false,
        affectedCount: 0,
        reason: 'rapid-navigation',
        duration: performance.now() - startTime,
        errors: [error instanceof Error ? error : new Error(String(error))],
      }
    }
  }
}

/**
 * Network-Based Cancellation Handler
 */
class NetworkCancellationHandler implements CancellationHandler {
  readonly type: CancellationTrigger = 'network-offline'
  readonly priority = 2 // Medium priority

  canHandle(
    trigger: CancellationTrigger,
    context: CancellationContext
  ): boolean {
    return (
      (trigger === 'network-offline' && !context.networkStatus.isOnline) ||
      (trigger === 'network-slow' &&
        context.networkStatus.connectionSpeed === 'slow')
    )
  }

  async execute(_context: CancellationContext): Promise<CancellationResult> {
    const startTime = performance.now()

    try {
      const reason: AbortReason =
        _context.trigger === 'network-offline'
          ? 'network-change'
          : 'network-change'

      // Cancel all active prefetches
      const cancelledCount = AbortControllerUtils.cancelOnNetworkChange()

      // Pause queue processing
      prefetchQueueManager.pause()

      return {
        cancelled: true,
        affectedCount: cancelledCount,
        reason,
        duration: performance.now() - startTime,
      }
    } catch (error) {
      return {
        cancelled: false,
        affectedCount: 0,
        reason: 'network-change',
        duration: performance.now() - startTime,
        errors: [error instanceof Error ? error : new Error(String(error))],
      }
    }
  }
}

/**
 * Component Unmount Cancellation Handler
 */
class UnmountCancellationHandler implements CancellationHandler {
  readonly type: CancellationTrigger = 'component-unmount'
  readonly priority = 1 // High priority

  canHandle(trigger: CancellationTrigger): boolean {
    return trigger === 'component-unmount'
  }

  async execute(_context: CancellationContext): Promise<CancellationResult> {
    void _context // Acknowledge parameter for interface compliance
    const startTime = performance.now()

    try {
      // Cancel all active prefetches
      const cancelledCount = AbortControllerUtils.cancelOnUnmount()

      // Stop queue processing
      prefetchQueueManager.stop()

      // Clear entire queue
      prefetchQueueManager.clearQueue()

      return {
        cancelled: true,
        affectedCount: cancelledCount,
        reason: 'component-unmount',
        duration: performance.now() - startTime,
      }
    } catch (error) {
      return {
        cancelled: false,
        affectedCount: 0,
        reason: 'component-unmount',
        duration: performance.now() - startTime,
        errors: [error instanceof Error ? error : new Error(String(error))],
      }
    }
  }
}

/**
 * Error Threshold Cancellation Handler
 */
class ErrorThresholdHandler implements CancellationHandler {
  readonly type: CancellationTrigger = 'error-threshold'
  readonly priority = 2 // Medium priority

  private errorCount = 0
  private readonly maxErrors: number

  constructor(maxErrors = 5) {
    this.maxErrors = maxErrors
  }

  canHandle(
    trigger: CancellationTrigger,
    _context: CancellationContext
  ): boolean {
    void _context // Acknowledge parameter for interface compliance
    if (trigger === 'error-threshold') {
      this.errorCount++
      return this.errorCount >= this.maxErrors
    }

    // Reset error count on successful operations
    if (trigger === 'page-change') {
      this.errorCount = 0
    }

    return false
  }

  async execute(_context: CancellationContext): Promise<CancellationResult> {
    void _context // Acknowledge parameter for interface compliance
    const startTime = performance.now()

    try {
      // Cancel all active prefetches due to too many errors
      const cancelledCount = AbortControllerUtils.cancelRapidNavigation(
        _context.currentPage
      )

      // Pause queue temporarily
      prefetchQueueManager.pause()

      // Reset error count
      this.errorCount = 0

      return {
        cancelled: true,
        affectedCount: cancelledCount,
        reason: 'manual-cancel',
        duration: performance.now() - startTime,
      }
    } catch (error) {
      return {
        cancelled: false,
        affectedCount: 0,
        reason: 'manual-cancel',
        duration: performance.now() - startTime,
        errors: [error instanceof Error ? error : new Error(String(error))],
      }
    }
  }
}

/**
 * Cancellation Chain Manager - Chain of Responsibility Implementation
 */
class CancellationChain {
  private readonly handlers: CancellationHandler[] = []

  constructor(customHandlers: CancellationHandler[] = []) {
    // Add default handlers in priority order
    this.handlers.push(
      new RapidNavigationHandler(),
      new NetworkCancellationHandler(),
      new UnmountCancellationHandler(),
      new ErrorThresholdHandler(),
      ...customHandlers
    )

    // Sort by priority (lower number = higher priority)
    this.handlers.sort((a, b) => a.priority - b.priority)
  }

  async process(
    trigger: CancellationTrigger,
    context: CancellationContext
  ): Promise<CancellationResult[]> {
    const results: CancellationResult[] = []

    for (const handler of this.handlers) {
      try {
        if (handler.canHandle(trigger, context)) {
          const result = await handler.execute(context)
          results.push(result)

          // Stop processing if a high-priority handler succeeded
          if (result.cancelled && handler.priority === 1) {
            break
          }
        }
      } catch (error) {
        results.push({
          cancelled: false,
          affectedCount: 0,
          reason: 'manual-cancel',
          duration: 0,
          errors: [error instanceof Error ? error : new Error(String(error))],
        })
      }
    }

    return results
  }
}

/**
 * Prefetch Cancellation Hook
 * Manages comprehensive cancellation scenarios using Chain of Responsibility
 */
export function usePrefetchCancellation(config: CancellationConfig = {}) {
  // Redux state selectors
  const currentPage = useAppSelector(selectCurrentPage)
  const isChangingPage = useAppSelector(selectIsChangingPage)
  const networkStatus = useAppSelector(selectNetworkStatus)
  const activePrefetchCount = useAppSelector(selectActivePrefetchCount)

  // Configuration with defaults
  const {
    enableRapidNavigation = true,
    rapidNavigationThreshold = 500,
    enableNetworkCancellation = true,
    enableErrorThreshold = true,
    maxErrors = 5,
    customHandlers = [],
  } = config

  // Cancellation chain instance
  const cancellationChainRef = useRef<CancellationChain | undefined>(undefined)
  const previousPageRef = useRef<number | undefined>(undefined)
  const navigationTimestampRef = useRef<number>(0)

  // Initialize cancellation chain
  if (!cancellationChainRef.current) {
    const handlers = [...customHandlers]

    if (enableRapidNavigation) {
      handlers.push(new RapidNavigationHandler(rapidNavigationThreshold))
    }

    if (enableErrorThreshold) {
      handlers.push(new ErrorThresholdHandler(maxErrors))
    }

    cancellationChainRef.current = new CancellationChain(handlers)
  }

  /**
   * Execute cancellation chain - Template Method Pattern
   */
  const executeCancellation = useCallback(
    async (
      trigger: CancellationTrigger,
      metadata?: Record<string, unknown>
    ): Promise<CancellationResult[]> => {
      const context: CancellationContext = {
        trigger,
        currentPage: currentPage || 0,
        previousPage: previousPageRef.current,
        networkStatus: {
          ...networkStatus,
          lastChecked: networkStatus.lastChecked || Date.now(),
        },
        timestamp: Date.now(),
        metadata: metadata || {},
      }

      if (!cancellationChainRef.current) {
        return []
      }

      try {
        const results = await cancellationChainRef.current.process(
          trigger,
          context
        )

        // Update references
        previousPageRef.current = currentPage
        navigationTimestampRef.current = context.timestamp

        return results
      } catch (error) {
        console.error('Cancellation chain execution failed:', error)
        return [
          {
            cancelled: false,
            affectedCount: 0,
            reason: 'manual-cancel',
            duration: 0,
            errors: [error instanceof Error ? error : new Error(String(error))],
          },
        ]
      }
    },
    [currentPage, networkStatus]
  )

  // Page change cancellation
  useEffect(() => {
    if (enableRapidNavigation && currentPage !== previousPageRef.current) {
      void executeCancellation('page-change')
    }
  }, [currentPage, enableRapidNavigation, executeCancellation])

  // Network status cancellation
  useEffect(() => {
    if (enableNetworkCancellation) {
      if (!networkStatus.isOnline) {
        void executeCancellation('network-offline')
      } else if (networkStatus.connectionSpeed === 'slow') {
        void executeCancellation('network-slow')
      }
    }
  }, [
    networkStatus.isOnline,
    networkStatus.connectionSpeed,
    enableNetworkCancellation,
    executeCancellation,
  ])

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      void executeCancellation('component-unmount')
    }
  }, [executeCancellation])

  // Manual cancellation functions - Open/Closed Principle
  const cancelAll = useCallback(
    async (reason?: string) => {
      return executeCancellation('manual', { reason })
    },
    [executeCancellation]
  )

  const cancelPage = useCallback(
    async (page: number) => {
      return executeCancellation('user-action', { targetPage: page })
    },
    [executeCancellation]
  )

  const reportError = useCallback(
    async (error: Error) => {
      return executeCancellation('error-threshold', { error: error.message })
    },
    [executeCancellation]
  )

  return {
    // State
    activePrefetchCount,
    isChangingPage,
    networkStatus,

    // Manual cancellation actions
    cancelAll,
    cancelPage,
    reportError,

    // Utilities
    getStats: () => prefetchQueueManager.getStats(),
    isEnabled: (trigger: CancellationTrigger) => {
      switch (trigger) {
        case 'rapid-navigation':
          return enableRapidNavigation
        case 'network-offline':
        case 'network-slow':
          return enableNetworkCancellation
        case 'error-threshold':
          return enableErrorThreshold
        default:
          return true
      }
    },
  }
}
