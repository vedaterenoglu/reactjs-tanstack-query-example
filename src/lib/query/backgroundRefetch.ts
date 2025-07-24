/**
 * Background Refetch Service - TanStack Query background refetching and stale-while-revalidate strategies
 *
 * Design Patterns Applied:
 * 1. **Strategy Pattern**: Different refetch strategies based on data type and user context
 * 2. **Observer Pattern**: Monitors user activity, network status, and focus events
 * 3. **State Pattern**: Different refetch behaviors based on application state
 * 4. **Template Method Pattern**: Defines refetch workflow with customizable timing
 * 5. **Builder Pattern**: Constructs complex refetch configurations
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for background refetching coordination and timing
 * - **OCP**: Extensible through new refetch strategies without modifying core logic
 * - **LSP**: Different strategies can substitute each other with same interface
 * - **ISP**: Focused interfaces for different refetch scenarios
 * - **DIP**: Depends on QueryClient and browser API abstractions
 *
 * React 19 Patterns:
 * - Background processing without blocking UI interactions
 * - Performance optimization through intelligent refetch timing
 * - Network-aware operations with online/offline detection
 * - User-centric refetch strategies based on activity patterns
 */

import { cityQueryKeys } from '@/lib/types/city.types'
import { eventQueryKeys } from '@/lib/types/event.types'

import type { QueryClient } from '@tanstack/react-query'

/**
 * Browser connection interface for network monitoring
 */
interface NavigatorConnection {
  type?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
  addEventListener?: (type: string, listener: EventListener) => void
  removeEventListener?: (type: string, listener: EventListener) => void
}

/**
 * Background refetch strategy types
 */
export type RefetchStrategy = 
  | 'aggressive'    // Refetch frequently for critical data
  | 'balanced'      // Standard refetch intervals
  | 'conservative'  // Minimal refetching to save bandwidth
  | 'user-driven'   // Refetch based on user activity
  | 'network-aware' // Adapt to network conditions

/**
 * Refetch trigger types
 */
export type RefetchTrigger = 
  | 'focus'         // Window focus events
  | 'online'        // Network reconnection
  | 'interval'      // Time-based intervals
  | 'visibility'    // Page visibility changes
  | 'user-action'   // User interactions

/**
 * Application state affecting refetch behavior
 */
export type AppState = 
  | 'active'        // User actively using the app
  | 'idle'          // User idle but app visible
  | 'background'    // App in background
  | 'offline'       // No network connection

/**
 * Configuration for background refetch operations
 */
export interface BackgroundRefetchConfig {
  strategy: RefetchStrategy
  triggers: RefetchTrigger[]
  intervals: {
    active: number      // Refetch interval when user is active (ms)
    idle: number        // Refetch interval when user is idle (ms)
    background: number  // Refetch interval when app is in background (ms)
  }
  staleTime: {
    events: number      // How long events data stays fresh (ms)
    cities: number      // How long cities data stays fresh (ms)
    details: number     // How long detail pages stay fresh (ms)
  }
  enabledConditions: {
    networkOnline: boolean        // Only refetch when online
    windowVisible: boolean        // Only refetch when window is visible
    userActive: boolean          // Only refetch when user is active
    batteryNotLow: boolean       // Respect battery status
  }
  priorities: {
    critical: string[]           // Query patterns that are critical
    high: string[]              // High priority queries
    normal: string[]            // Normal priority queries
    low: string[]               // Low priority queries
  }
}

/**
 * User activity monitoring data
 */
export interface UserActivity {
  lastAction: number       // Timestamp of last user action
  isActive: boolean        // Currently active
  idleThreshold: number    // Idle threshold in ms
  actionsCount: number     // Number of actions in current session
}

/**
 * Network status monitoring data
 */
export interface NetworkStatus {
  isOnline: boolean
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

/**
 * Background Refetch Service following Strategy and State patterns
 * Provides intelligent background refetching for TanStack Query
 */
export class BackgroundRefetchService {
  private readonly queryClient: QueryClient
  private config: BackgroundRefetchConfig
  private userActivity: UserActivity
  private networkStatus: NetworkStatus
  private appState: AppState = 'active'
  private intervalIds = new Map<string, NodeJS.Timeout>()
  private eventListeners = new Map<string, EventListener>()

  constructor(queryClient: QueryClient, config?: Partial<BackgroundRefetchConfig>) {
    this.queryClient = queryClient
    this.config = this.buildConfig(config)
    this.userActivity = {
      lastAction: Date.now(),
      isActive: true,
      idleThreshold: 5 * 60 * 1000, // 5 minutes
      actionsCount: 0,
    }
    this.networkStatus = {
      isOnline: navigator.onLine,
    }

    this.initializeMonitoring()
  }

  /**
   * Start background refetching based on configuration
   * Following Template Method Pattern for startup workflow
   */
  start(): void {
    this.setupEventListeners()
    this.startIntervalRefetching()
    this.detectNetworkStatus()
    this.monitorUserActivity()
  }

  /**
   * Stop all background refetching and cleanup
   */
  stop(): void {
    this.clearAllIntervals()
    this.removeEventListeners()
  }

  /**
   * Update refetch configuration dynamically
   */
  updateConfig(newConfig: Partial<BackgroundRefetchConfig>): void {
    this.config = this.buildConfig(newConfig)
    this.restart()
  }

  /**
   * Trigger manual refetch based on current strategy
   */
  async triggerRefetch(trigger: RefetchTrigger): Promise<void> {
    if (!this.shouldRefetch()) {
      return
    }

    const queries = this.selectQueriesForRefetch(trigger)
    
    for (const queryKey of queries) {
      try {
        await this.queryClient.refetchQueries({
          queryKey,
          type: 'active',
        })
      } catch (error) {
        console.warn('Background refetch failed:', { queryKey, error })
      }
    }
  }

  /**
   * Get current refetch status and metrics
   */
  getStatus(): {
    isActive: boolean
    appState: AppState
    userActivity: UserActivity
    networkStatus: NetworkStatus
    activeIntervals: string[]
  } {
    return {
      isActive: this.intervalIds.size > 0,
      appState: this.appState,
      userActivity: { ...this.userActivity },
      networkStatus: { ...this.networkStatus },
      activeIntervals: Array.from(this.intervalIds.keys()),
    }
  }

  /**
   * Build configuration with defaults following Builder Pattern
   */
  private buildConfig(customConfig?: Partial<BackgroundRefetchConfig>): BackgroundRefetchConfig {
    const defaultConfig: BackgroundRefetchConfig = {
      strategy: 'balanced',
      triggers: ['focus', 'online', 'interval', 'visibility'],
      intervals: {
        active: 5 * 60 * 1000,      // 5 minutes when active
        idle: 15 * 60 * 1000,       // 15 minutes when idle
        background: 60 * 60 * 1000, // 1 hour in background
      },
      staleTime: {
        events: 2 * 60 * 1000,      // 2 minutes for events
        cities: 10 * 60 * 1000,     // 10 minutes for cities
        details: 5 * 60 * 1000,     // 5 minutes for details
      },
      enabledConditions: {
        networkOnline: true,
        windowVisible: true,
        userActive: false,  // Refetch even when user is idle
        batteryNotLow: true,
      },
      priorities: {
        critical: ['events', 'cities'],
        high: ['event-detail', 'city-detail'],
        normal: ['event-list', 'city-list'],
        low: ['search', 'filters'],
      },
    }

    return { ...defaultConfig, ...customConfig }
  }

  /**
   * Initialize monitoring systems
   */
  private initializeMonitoring(): void {
    // Detect network information if available
    if ('connection' in navigator) {
      const connection = (navigator as typeof navigator & { connection?: NavigatorConnection }).connection
      this.networkStatus = {
        isOnline: navigator.onLine,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      }
    }
  }

  /**
   * Setup event listeners for refetch triggers
   */
  private setupEventListeners(): void {
    // Window focus events
    if (this.config.triggers.includes('focus')) {
      const focusHandler = () => this.handleWindowFocus()
      const blurHandler = () => this.handleWindowBlur()
      
      window.addEventListener('focus', focusHandler)
      window.addEventListener('blur', blurHandler)
      
      this.eventListeners.set('focus', focusHandler)
      this.eventListeners.set('blur', blurHandler)
    }

    // Online/offline events
    if (this.config.triggers.includes('online')) {
      const onlineHandler = () => this.handleNetworkOnline()
      const offlineHandler = () => this.handleNetworkOffline()
      
      window.addEventListener('online', onlineHandler)
      window.addEventListener('offline', offlineHandler)
      
      this.eventListeners.set('online', onlineHandler)
      this.eventListeners.set('offline', offlineHandler)
    }

    // Visibility change events
    if (this.config.triggers.includes('visibility')) {
      const visibilityHandler = () => this.handleVisibilityChange()
      
      document.addEventListener('visibilitychange', visibilityHandler)
      this.eventListeners.set('visibilitychange', visibilityHandler)
    }

    // User action tracking
    if (this.config.triggers.includes('user-action')) {
      const actionHandler = () => this.handleUserAction()
      
      document.addEventListener('mousedown', actionHandler)
      document.addEventListener('keydown', actionHandler)
      document.addEventListener('touchstart', actionHandler)
      
      this.eventListeners.set('mousedown', actionHandler)
      this.eventListeners.set('keydown', actionHandler)
      this.eventListeners.set('touchstart', actionHandler)
    }
  }

  /**
   * Start interval-based refetching
   */
  private startIntervalRefetching(): void {
    if (!this.config.triggers.includes('interval')) {
      return
    }

    const intervalMs = this.getCurrentInterval()
    
    const intervalId = setInterval(() => {
      void this.triggerRefetch('interval')
    }, intervalMs)

    this.intervalIds.set('main', intervalId)
  }

  /**
   * Handle window focus event
   */
  private handleWindowFocus(): void {
    this.appState = 'active'
    this.userActivity.isActive = true
    this.userActivity.lastAction = Date.now()
    
    void this.triggerRefetch('focus')
    this.restartIntervals()
  }

  /**
   * Handle window blur event
   */
  private handleWindowBlur(): void {
    this.appState = document.hidden ? 'background' : 'idle'
  }

  /**
   * Handle network online event
   */
  private handleNetworkOnline(): void {
    this.networkStatus.isOnline = true
    this.appState = 'active'
    
    void this.triggerRefetch('online')
  }

  /**
   * Handle network offline event
   */
  private handleNetworkOffline(): void {
    this.networkStatus.isOnline = false
    this.appState = 'offline'
    
    // Stop all intervals when offline
    this.clearAllIntervals()
  }

  /**
   * Handle visibility change event
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.appState = 'background'
    } else {
      this.appState = 'active'
      void this.triggerRefetch('visibility')
    }
    
    this.restartIntervals()
  }

  /**
   * Handle user action event
   */
  private handleUserAction(): void {
    this.userActivity.lastAction = Date.now()
    this.userActivity.isActive = true
    this.userActivity.actionsCount++
    
    if (this.appState === 'idle') {
      this.appState = 'active'
      this.restartIntervals()
    }
  }

  /**
   * Monitor user activity and update state
   */
  private monitorUserActivity(): void {
    const checkActivity = () => {
      const timeSinceLastAction = Date.now() - this.userActivity.lastAction
      
      if (timeSinceLastAction > this.userActivity.idleThreshold) {
        if (this.userActivity.isActive) {
          this.userActivity.isActive = false
          this.appState = 'idle'
          this.restartIntervals()
        }
      }
    }

    // Check activity every minute
    const activityIntervalId = setInterval(checkActivity, 60 * 1000)
    this.intervalIds.set('activity', activityIntervalId)
  }

  /**
   * Detect network status changes
   */
  private detectNetworkStatus(): void {
    if ('connection' in navigator) {
      const connection = (navigator as typeof navigator & { connection?: NavigatorConnection }).connection
      
      const updateNetworkInfo = () => {
        this.networkStatus = {
          ...this.networkStatus,
          connectionType: connection?.type,
          effectiveType: connection?.effectiveType,
          downlink: connection?.downlink,
          rtt: connection?.rtt,
        }
      }

      connection?.addEventListener?.('change', updateNetworkInfo)
      this.eventListeners.set('connectionchange', updateNetworkInfo)
    }
  }

  /**
   * Determine if refetch should proceed based on conditions
   */
  private shouldRefetch(): boolean {
    const { enabledConditions } = this.config

    // Check network condition
    if (enabledConditions.networkOnline && !this.networkStatus.isOnline) {
      return false
    }

    // Check window visibility condition
    if (enabledConditions.windowVisible && document.hidden) {
      return false
    }

    // Check user activity condition
    if (enabledConditions.userActive && !this.userActivity.isActive) {
      return false
    }

    // Check battery condition (if available)
    if (enabledConditions.batteryNotLow && 'getBattery' in navigator) {
      // Note: Battery API is deprecated, but we'll check if available
      // In real implementation, this would be async
      return true
    }

    return true
  }

  /**
   * Select queries to refetch based on trigger and strategy
   */
  private selectQueriesForRefetch(trigger: RefetchTrigger): unknown[][] {
    const { strategy } = this.config
    const queries: unknown[][] = []

    // Strategy-based query selection following Strategy Pattern
    switch (strategy) {
      case 'aggressive':
        queries.push(
          [...eventQueryKeys.all],
          [...cityQueryKeys.all],
        )
        break

      case 'balanced':
        if (trigger === 'focus' || trigger === 'online') {
          queries.push([...eventQueryKeys.lists()])
          queries.push([...cityQueryKeys.lists()])
        } else {
          queries.push([...eventQueryKeys.all])
        }
        break

      case 'conservative':
        if (trigger === 'online') {
          queries.push([...eventQueryKeys.lists()])
        }
        break

      case 'user-driven':
        if (this.userActivity.isActive) {
          queries.push([...eventQueryKeys.lists()])
          queries.push([...cityQueryKeys.lists()])
        }
        break

      case 'network-aware':
        if (this.networkStatus.effectiveType === '4g' || !this.networkStatus.effectiveType) {
          queries.push([...eventQueryKeys.all])
          queries.push([...cityQueryKeys.all])
        } else {
          queries.push([...eventQueryKeys.lists()])
        }
        break
    }

    return queries
  }

  /**
   * Get current refetch interval based on app state
   */
  private getCurrentInterval(): number {
    switch (this.appState) {
      case 'active':
        return this.config.intervals.active
      case 'idle':
        return this.config.intervals.idle
      case 'background':
        return this.config.intervals.background
      case 'offline':
        return Number.MAX_SAFE_INTEGER // Don't refetch when offline
      default:
        return this.config.intervals.active
    }
  }

  /**
   * Restart intervals with current configuration
   */
  private restartIntervals(): void {
    this.clearIntervals(['main'])
    this.startIntervalRefetching()
  }

  /**
   * Clear specific intervals
   */
  private clearIntervals(intervalNames: string[]): void {
    for (const name of intervalNames) {
      const intervalId = this.intervalIds.get(name)
      if (intervalId) {
        clearInterval(intervalId)
        this.intervalIds.delete(name)
      }
    }
  }

  /**
   * Clear all intervals
   */
  private clearAllIntervals(): void {
    for (const intervalId of this.intervalIds.values()) {
      clearInterval(intervalId)
    }
    this.intervalIds.clear()
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    for (const [event, listener] of this.eventListeners.entries()) {
      if (event === 'connectionchange' && 'connection' in navigator) {
        const connection = (navigator as typeof navigator & { connection?: NavigatorConnection }).connection
        connection?.removeEventListener?.('change', listener)
      } else if (event === 'visibilitychange') {
        document.removeEventListener('visibilitychange', listener)
      } else if (['mousedown', 'keydown', 'touchstart'].includes(event)) {
        document.removeEventListener(event, listener)
      } else {
        window.removeEventListener(event, listener)
      }
    }
    this.eventListeners.clear()
  }

  /**
   * Restart the entire service
   */
  private restart(): void {
    this.stop()
    this.start()
  }
}

/**
 * Factory function to create background refetch service
 * Following Factory Pattern for service instantiation
 */
export const createBackgroundRefetchService = (
  queryClient: QueryClient,
  config?: Partial<BackgroundRefetchConfig>
): BackgroundRefetchService => {
  return new BackgroundRefetchService(queryClient, config)
}

/**
 * Predefined configurations for common scenarios
 */
export const REFETCH_STRATEGIES = {
  // For dashboard or critical real-time data
  REAL_TIME: {
    strategy: 'aggressive' as RefetchStrategy,
    intervals: {
      active: 30 * 1000,      // 30 seconds
      idle: 2 * 60 * 1000,    // 2 minutes
      background: 5 * 60 * 1000, // 5 minutes
    },
    triggers: ['focus', 'online', 'interval', 'visibility', 'user-action'] as RefetchTrigger[],
  },

  // Standard application behavior
  STANDARD: {
    strategy: 'balanced' as RefetchStrategy,
    intervals: {
      active: 5 * 60 * 1000,     // 5 minutes
      idle: 15 * 60 * 1000,      // 15 minutes
      background: 60 * 60 * 1000, // 1 hour
    },
    triggers: ['focus', 'online', 'interval', 'visibility'] as RefetchTrigger[],
  },

  // For mobile or bandwidth-conscious scenarios
  BANDWIDTH_SAVER: {
    strategy: 'conservative' as RefetchStrategy,
    intervals: {
      active: 15 * 60 * 1000,    // 15 minutes
      idle: 60 * 60 * 1000,      // 1 hour
      background: 4 * 60 * 60 * 1000, // 4 hours
    },
    triggers: ['focus', 'online'] as RefetchTrigger[],
    enabledConditions: {
      networkOnline: true,
      windowVisible: true,
      userActive: true,
      batteryNotLow: true,
    },
  },
} as const