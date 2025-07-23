/**
 * AbortController Factory - Factory Pattern + Singleton for Request Cancellation
 *
 * Design Patterns Applied:
 * 1. **Factory Pattern**: Creates AbortController instances with metadata and tracking
 * 2. **Singleton Pattern**: Single global registry for all active controllers
 * 3. **Command Pattern**: Each abort operation is an executable command
 * 4. **Observer Pattern**: Cleanup callbacks for abort events
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for AbortController creation and lifecycle management
 * - **OCP**: Extensible abort reasons without modifying core factory
 * - **LSP**: Implements standard AbortController interface
 * - **ISP**: Focused interface for abort operations only
 * - **DIP**: Depends on AbortController abstractions, not concrete implementations
 *
 * React 19 Patterns:
 * - Factory function for consistent controller creation
 * - Cleanup patterns for memory management
 * - Error boundary integration for graceful failures
 */

export type AbortReason = 
  | 'user-navigation' 
  | 'rapid-navigation' 
  | 'network-change' 
  | 'manual-cancel' 
  | 'timeout' 
  | 'component-unmount'
  | 'queue-cleared'
  | 'removed-from-queue'
  | 'processor-stopped'

export interface ManagedAbortController {
  readonly controller: AbortController
  readonly requestId: string
  readonly page: number
  readonly createdAt: number
  readonly reason: AbortReason | undefined
  abort(reason?: AbortReason): void
  isAborted(): boolean
}

export interface AbortControllerRegistry {
  create(page: number, requestId: string): ManagedAbortController
  abort(requestId: string, reason?: AbortReason): boolean
  abortPage(page: number, reason?: AbortReason): number
  abortAll(reason?: AbortReason): number
  cleanup(): void
  getActive(): ReadonlyMap<string, ManagedAbortController>
  isActive(requestId: string): boolean
}

/**
 * Managed AbortController Implementation
 * Wraps native AbortController with metadata and tracking
 */
class ManagedAbortControllerImpl implements ManagedAbortController {
  public readonly controller: AbortController
  public readonly requestId: string
  public readonly page: number
  public readonly createdAt: number
  private _reason?: AbortReason

  constructor(page: number, requestId: string) {
    this.controller = new AbortController()
    this.requestId = requestId
    this.page = page
    this.createdAt = Date.now()
  }

  get reason(): AbortReason | undefined {
    return this._reason
  }

  abort(reason: AbortReason = 'manual-cancel'): void {
    if (!this.controller.signal.aborted) {
      this._reason = reason
      this.controller.abort(new Error(`Request aborted: ${reason}`))
    }
  }

  isAborted(): boolean {
    return this.controller.signal.aborted
  }
}

/**
 * AbortController Factory Registry - Singleton Pattern
 * Centralized management of all active AbortController instances
 */
class AbortControllerRegistryImpl implements AbortControllerRegistry {
  private static instance: AbortControllerRegistryImpl
  private readonly activeControllers = new Map<string, ManagedAbortController>()
  private readonly cleanupCallbacks = new Set<() => void>()

  private constructor() {}

  public static getInstance(): AbortControllerRegistryImpl {
    if (!AbortControllerRegistryImpl.instance) {
      AbortControllerRegistryImpl.instance = new AbortControllerRegistryImpl()
    }
    return AbortControllerRegistryImpl.instance
  }

  /**
   * Factory method to create new managed AbortController
   * Follows Factory Pattern with automatic registration
   */
  create(page: number, requestId: string): ManagedAbortController {
    // Abort existing controller for same page if exists
    this.abortPage(page, 'rapid-navigation')

    const managedController = new ManagedAbortControllerImpl(page, requestId)
    this.activeControllers.set(requestId, managedController)

    // Auto-cleanup on abort
    managedController.controller.signal.addEventListener('abort', () => {
      this.activeControllers.delete(requestId)
    }, { once: true })

    return managedController
  }

  /**
   * Abort specific request by ID
   * Returns true if controller was found and aborted
   */
  abort(requestId: string, reason: AbortReason = 'manual-cancel'): boolean {
    const controller = this.activeControllers.get(requestId)
    if (controller && !controller.isAborted()) {
      controller.abort(reason)
      return true
    }
    return false
  }

  /**
   * Abort all requests for specific page
   * Returns number of controllers aborted
   */
  abortPage(page: number, reason: AbortReason = 'manual-cancel'): number {
    let abortedCount = 0
    for (const controller of this.activeControllers.values()) {
      if (controller.page === page && !controller.isAborted()) {
        controller.abort(reason)
        abortedCount++
      }
    }
    return abortedCount
  }

  /**
   * Abort all active requests
   * Returns number of controllers aborted
   */
  abortAll(reason: AbortReason = 'manual-cancel'): number {
    let abortedCount = 0
    for (const controller of this.activeControllers.values()) {
      if (!controller.isAborted()) {
        controller.abort(reason)
        abortedCount++
      }
    }
    return abortedCount
  }

  /**
   * Manual cleanup of aborted controllers
   * Called automatically, but can be triggered manually
   */
  cleanup(): void {
    for (const [requestId, controller] of this.activeControllers.entries()) {
      if (controller.isAborted()) {
        this.activeControllers.delete(requestId)
      }
    }
    
    // Run cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('AbortController cleanup callback failed:', error)
      }
    })
  }

  /**
   * Get readonly view of active controllers
   */
  getActive(): ReadonlyMap<string, ManagedAbortController> {
    return new Map(this.activeControllers)
  }

  /**
   * Check if request is still active
   */
  isActive(requestId: string): boolean {
    const controller = this.activeControllers.get(requestId)
    return controller !== undefined && !controller.isAborted()
  }

  /**
   * Add cleanup callback for advanced cleanup scenarios
   */
  addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback)
  }

  /**
   * Remove cleanup callback
   */
  removeCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.delete(callback)
  }
}

/**
 * Singleton instance export - Global registry
 */
export const abortControllerRegistry: AbortControllerRegistry = AbortControllerRegistryImpl.getInstance()

/**
 * Utility functions for common abort scenarios
 * Follows Facade Pattern for simplified API
 */
export const AbortControllerUtils = {
  /**
   * Create controller for prefetch request
   */
  createForPrefetch: (page: number, requestId: string): ManagedAbortController => {
    return abortControllerRegistry.create(page, requestId)
  },

  /**
   * Cancel prefetch on rapid navigation
   */
  cancelRapidNavigation: (currentPage?: number): number => {
    return currentPage 
      ? abortControllerRegistry.abortPage(currentPage, 'rapid-navigation')
      : abortControllerRegistry.abortAll('rapid-navigation')
  },

  /**
   * Cancel on component unmount
   */
  cancelOnUnmount: (): number => {
    return abortControllerRegistry.abortAll('component-unmount')
  },

  /**
   * Cancel on network change
   */
  cancelOnNetworkChange: (): number => {
    return abortControllerRegistry.abortAll('network-change')
  },

  /**
   * Get active request count for monitoring
   */
  getActiveCount: (): number => {
    return abortControllerRegistry.getActive().size
  },

  /**
   * Force cleanup - useful for testing
   */
  forceCleanup: (): void => {
    abortControllerRegistry.cleanup()
  },
} as const

/**
 * Generate unique request ID for tracking
 * Simple implementation - could be replaced with more sophisticated UUID
 */
export function generateRequestId(page: number): string {
  return `prefetch-${page}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}