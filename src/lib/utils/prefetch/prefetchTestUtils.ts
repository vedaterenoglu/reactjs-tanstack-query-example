/**
 * Prefetch System Validation Utilities - Builder Pattern + Mock Factory
 *
 * Design Patterns Applied:
 * 1. **Builder Pattern**: Create complex test scenarios with fluent API
 * 2. **Mock Factory Pattern**: Generate mock network conditions and API responses
 * 3. **Strategy Pattern**: Different validation strategies for various scenarios
 * 4. **Template Method Pattern**: Consistent validation workflow
 *
 * SOLID Principles:
 * - **SRP**: Each utility focuses on one specific validation concern
 * - **OCP**: New validation scenarios can be added without modifying existing utilities
 * - **LSP**: All mocks implement consistent interfaces with predictable behavior
 * - **ISP**: Focused interfaces for different validation concerns (network, queue, abort)
 * - **DIP**: Utilities depend on abstractions, not concrete implementations
 *
 * React 19 Patterns:
 * - Validation utilities with proper cleanup and isolation
 * - Mock implementations that maintain interface compliance
 * - Error handling validation without external dependencies
 */

import { abortControllerRegistry } from './abortControllerFactory'
import { NetworkUtils } from './networkObserver'
import { prefetchQueueManager } from './prefetchQueue'

import type { NetworkStatus } from './networkObserver'
import type {
  PrefetchCommand,
  PrefetchPriority,
  PrefetchStrategy,
} from './prefetchQueue'

/**
 * Validation Result Interface - Interface Segregation Principle
 */
interface ValidationResult {
  passed: boolean
  message: string
  details?: Record<string, unknown>
  timestamp: number
}

/**
 * Test Scenario Builder - Builder Pattern
 * Creates complex validation scenarios with fluent API
 */
export class PrefetchValidationScenarioBuilder {
  private scenario: Partial<PrefetchValidationScenario> = {}

  withNetworkStatus(status: Partial<NetworkStatus>): this {
    this.scenario.networkStatus = {
      isOnline: true,
      connectionSpeed: 'unknown',
      dataSaver: false,
      lastChecked: Date.now(),
      ...status,
    }
    return this
  }

  withPageSequence(pages: number[]): this {
    this.scenario.pageSequence = pages
    return this
  }

  withNavigationSpeed(intervalMs: number): this {
    this.scenario.navigationInterval = intervalMs
    return this
  }

  withMaxConcurrentRequests(max: number): this {
    this.scenario.maxConcurrentRequests = max
    return this
  }

  withErrorRate(rate: number): this {
    this.scenario.errorRate = Math.min(Math.max(rate, 0), 1)
    return this
  }

  withTimeout(timeoutMs: number): this {
    this.scenario.timeoutMs = timeoutMs
    return this
  }

  withExpectedBehavior(behavior: ExpectedBehavior): this {
    this.scenario.expectedBehavior = behavior
    return this
  }

  build(): PrefetchValidationScenario {
    return {
      networkStatus: this.scenario.networkStatus || {
        isOnline: true,
        connectionSpeed: 'unknown',
        dataSaver: false,
        lastChecked: Date.now(),
      },
      pageSequence: this.scenario.pageSequence || [1, 2, 3],
      navigationInterval: this.scenario.navigationInterval || 1000,
      maxConcurrentRequests: this.scenario.maxConcurrentRequests || 2,
      errorRate: this.scenario.errorRate || 0,
      timeoutMs: this.scenario.timeoutMs || 5000,
      expectedBehavior: this.scenario.expectedBehavior || {
        shouldPrefetch: true,
        expectedCancellations: 0,
        expectedErrors: 0,
      },
    }
  }
}

/**
 * Validation Scenario Interface - Data Transfer Object
 */
interface PrefetchValidationScenario {
  networkStatus: NetworkStatus
  pageSequence: number[]
  navigationInterval: number
  maxConcurrentRequests: number
  errorRate: number
  timeoutMs: number
  expectedBehavior: ExpectedBehavior
}

interface ExpectedBehavior {
  shouldPrefetch: boolean
  expectedCancellations: number
  expectedErrors: number
  shouldUseConservativeStrategy?: boolean
  shouldDisablePrefetch?: boolean
}

/**
 * Mock Factory for Network Conditions - Factory Pattern
 */
export class NetworkConditionFactory {
  static createFastConnection(): NetworkStatus {
    return {
      isOnline: true,
      connectionSpeed: 'fast',
      dataSaver: false,
      lastChecked: Date.now(),
      effectiveType: '4g',
      downlink: 10.5,
      rtt: 50,
    }
  }

  static createSlowConnection(): NetworkStatus {
    return {
      isOnline: true,
      connectionSpeed: 'slow',
      dataSaver: false,
      lastChecked: Date.now(),
      effectiveType: '3g',
      downlink: 0.5,
      rtt: 300,
    }
  }

  static createOfflineConnection(): NetworkStatus {
    return {
      isOnline: false,
      connectionSpeed: 'unknown',
      dataSaver: false,
      lastChecked: Date.now(),
    }
  }

  static createDataSaverConnection(): NetworkStatus {
    return {
      isOnline: true,
      connectionSpeed: 'fast',
      dataSaver: true,
      lastChecked: Date.now(),
      effectiveType: '4g',
      downlink: 10.5,
      rtt: 50,
    }
  }
}

/**
 * Mock API Response Factory - Factory Pattern
 */
export class MockApiResponseFactory {
  static createSuccessResponse(delay = 100): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, delay)
    })
  }

  static createErrorResponse(errorMessage: string, delay = 100): Promise<void> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage))
      }, delay)
    })
  }

  static createTimeoutResponse(delay = 5000): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, delay)
    })
  }

  static createConditionalResponse(
    errorRate: number,
    errorMessage: string,
    delay = 100
  ): Promise<void> {
    if (Math.random() < errorRate) {
      return this.createErrorResponse(errorMessage, delay)
    }
    return this.createSuccessResponse(delay)
  }
}

/**
 * Prefetch System Validation Utilities
 * Provides validation methods for the complete prefetch system
 */
export class PrefetchValidationUtils {
  /**
   * Setup validation environment with cleanup
   */
  static setup(): void {
    // Reset all managers to clean state
    abortControllerRegistry.cleanup()
    prefetchQueueManager.stop()
    prefetchQueueManager.clearQueue()
  }

  /**
   * Cleanup validation environment
   */
  static cleanup(): void {
    // Clean up all active operations
    abortControllerRegistry.cleanup()
    prefetchQueueManager.stop()
    prefetchQueueManager.clearQueue()
  }

  /**
   * Create mock prefetch command for validation
   */
  static createMockCommand(
    page: number,
    priority: PrefetchPriority = 'normal',
    strategy: PrefetchStrategy = 'immediate',
    executor?: () => Promise<void>
  ): PrefetchCommand {
    const requestId = `validation-${page}-${Date.now()}`
    const abortController = abortControllerRegistry.create(page, requestId)

    return {
      id: requestId,
      page,
      priority,
      strategy,
      createdAt: Date.now(),
      abortController,

      async execute(): Promise<void> {
        if (this.abortController.isAborted()) {
          throw new Error('Command was aborted before execution')
        }

        if (executor) {
          await executor()
        } else {
          await MockApiResponseFactory.createSuccessResponse(100)
        }
      },

      canExecute(): boolean {
        return !this.abortController.isAborted()
      },

      getEstimatedDuration(): number {
        return strategy === 'delayed' ? 2000 : 1000
      },
    }
  }

  /**
   * Wait for queue to process commands with timeout
   */
  static async waitForQueueProcessing(
    timeoutMs = 5000
  ): Promise<ValidationResult> {
    return new Promise(resolve => {
      const startTime = Date.now()

      const checkQueue = () => {
        const stats = prefetchQueueManager.getStats()

        if (stats.queueLength === 0 && stats.activeCommands === 0) {
          resolve({
            passed: true,
            message: 'Queue processing completed successfully',
            details: { stats, duration: Date.now() - startTime },
            timestamp: Date.now(),
          })
          return
        }

        if (Date.now() - startTime > timeoutMs) {
          resolve({
            passed: false,
            message: `Queue processing timeout after ${timeoutMs}ms`,
            details: { stats, duration: Date.now() - startTime },
            timestamp: Date.now(),
          })
          return
        }

        setTimeout(checkQueue, 50)
      }

      checkQueue()
    })
  }

  /**
   * Simulate rapid navigation sequence for validation
   */
  static async simulateRapidNavigation(
    pages: number[],
    intervalMs: number
  ): Promise<ValidationResult> {
    try {
      for (const [index, page] of pages.entries()) {
        const command = this.createMockCommand(page)
        prefetchQueueManager.addPrefetchCommand(command)

        if (index < pages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, intervalMs))
        }
      }

      return {
        passed: true,
        message: `Rapid navigation simulation completed for ${pages.length} pages`,
        details: { pages, intervalMs },
        timestamp: Date.now(),
      }
    } catch (error) {
      return {
        passed: false,
        message: `Rapid navigation simulation failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { pages, intervalMs, error },
        timestamp: Date.now(),
      }
    }
  }

  /**
   * Get system statistics snapshot
   */
  static getSystemSnapshot(): SystemSnapshot {
    const queueStats = prefetchQueueManager.getStats()
    const activeControllers = abortControllerRegistry.getActive()

    return {
      queueLength: queueStats.queueLength,
      activeCommands: queueStats.activeCommands,
      completedCommands: queueStats.completedCommands,
      failedCommands: queueStats.failedCommands,
      activeControllerCount: activeControllers.size,
      isQueueRunning: queueStats.isRunning,
      timestamp: Date.now(),
    }
  }

  /**
   * Validate network-aware behavior
   */
  static validateNetworkAwareness(): ValidationResult[] {
    const results: ValidationResult[] = []

    // Test fast connection
    const fastNetwork = NetworkConditionFactory.createFastConnection()
    const shouldEnableFast = NetworkUtils.shouldEnablePrefetch(fastNetwork)
    const concurrencyFast = NetworkUtils.getRecommendedConcurrency(fastNetwork)

    results.push({
      passed: shouldEnableFast && concurrencyFast === 3,
      message: 'Fast connection should enable prefetch with high concurrency',
      details: { shouldEnable: shouldEnableFast, concurrency: concurrencyFast },
      timestamp: Date.now(),
    })

    // Test slow connection
    const slowNetwork = NetworkConditionFactory.createSlowConnection()
    const shouldEnableSlow = NetworkUtils.shouldEnablePrefetch(slowNetwork)
    const concurrencySlow = NetworkUtils.getRecommendedConcurrency(slowNetwork)

    results.push({
      passed: shouldEnableSlow && concurrencySlow === 1,
      message: 'Slow connection should enable prefetch with low concurrency',
      details: { shouldEnable: shouldEnableSlow, concurrency: concurrencySlow },
      timestamp: Date.now(),
    })

    // Test offline connection
    const offlineNetwork = NetworkConditionFactory.createOfflineConnection()
    const shouldEnableOffline =
      NetworkUtils.shouldEnablePrefetch(offlineNetwork)
    const concurrencyOffline =
      NetworkUtils.getRecommendedConcurrency(offlineNetwork)

    results.push({
      passed: !shouldEnableOffline && concurrencyOffline === 0,
      message: 'Offline connection should disable prefetch',
      details: {
        shouldEnable: shouldEnableOffline,
        concurrency: concurrencyOffline,
      },
      timestamp: Date.now(),
    })

    // Test data saver mode
    const dataSaverNetwork = NetworkConditionFactory.createDataSaverConnection()
    const shouldEnableDataSaver =
      NetworkUtils.shouldEnablePrefetch(dataSaverNetwork)

    results.push({
      passed: !shouldEnableDataSaver,
      message: 'Data saver mode should disable prefetch',
      details: { shouldEnable: shouldEnableDataSaver },
      timestamp: Date.now(),
    })

    return results
  }

  /**
   * Validate basic prefetch operations
   */
  static async validateBasicOperations(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []

    // Setup clean environment
    this.setup()
    prefetchQueueManager.start()

    try {
      // Test single command execution
      const command = this.createMockCommand(1)
      const added = prefetchQueueManager.addPrefetchCommand(command)

      results.push({
        passed: added,
        message: 'Single command should be added to queue successfully',
        details: { added },
        timestamp: Date.now(),
      })

      // Wait for processing
      const processingResult = await this.waitForQueueProcessing(2000)
      results.push(processingResult)

      // Test duplicate prevention
      const duplicateCommand = this.createMockCommand(1) // Same page
      const duplicateAdded =
        prefetchQueueManager.addPrefetchCommand(duplicateCommand)

      results.push({
        passed: !duplicateAdded,
        message: 'Duplicate command for same page should be rejected',
        details: { duplicateAdded },
        timestamp: Date.now(),
      })
    } catch (error) {
      results.push({
        passed: false,
        message: `Basic operations validation failed: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
        timestamp: Date.now(),
      })
    } finally {
      this.cleanup()
    }

    return results
  }

  /**
   * Run comprehensive validation suite
   */
  static async runValidationSuite(): Promise<ValidationSuiteResult> {
    const startTime = Date.now()
    const results: ValidationResult[] = []

    try {
      // Network awareness validation
      results.push(...this.validateNetworkAwareness())

      // Basic operations validation
      results.push(...(await this.validateBasicOperations()))

      const passedCount = results.filter(r => r.passed).length
      const totalCount = results.length

      return {
        passed: passedCount === totalCount,
        totalTests: totalCount,
        passedTests: passedCount,
        failedTests: totalCount - passedCount,
        results,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      }
    } catch (error) {
      return {
        passed: false,
        totalTests: results.length,
        passedTests: results.filter(r => r.passed).length,
        failedTests: results.length - results.filter(r => r.passed).length,
        results,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

interface SystemSnapshot {
  queueLength: number
  activeCommands: number
  completedCommands: number
  failedCommands: number
  activeControllerCount: number
  isQueueRunning: boolean
  timestamp: number
}

interface ValidationSuiteResult {
  passed: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  results: ValidationResult[]
  duration: number
  timestamp: number
  error?: string
}

/**
 * Export utility instances for easy access
 */
export const prefetchValidator = {
  NetworkConditions: NetworkConditionFactory,
  MockApi: MockApiResponseFactory,
  Utils: PrefetchValidationUtils,
  ScenarioBuilder: PrefetchValidationScenarioBuilder,
}
