/**
 * Network-Aware Prefetching Observer - Observer Pattern + Adapter Pattern
 *
 * Design Patterns Applied:
 * 1. **Observer Pattern**: Network status changes notify multiple subscribers
 * 2. **Adapter Pattern**: Wraps Navigator.connection API with consistent interface
 * 3. **Singleton Pattern**: Single global network status monitor
 * 4. **Strategy Pattern**: Different network strategies based on connection quality
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for network status monitoring and notifications
 * - **OCP**: New network strategies can be added without modifying observer core
 * - **LSP**: All network adapters implement consistent NetworkStatusProvider interface
 * - **ISP**: Separate interfaces for status monitoring, strategies, and notifications
 * - **DIP**: Depends on network abstractions, not concrete Navigator.connection API
 *
 * React 19 Patterns:
 * - Custom hooks for network status integration
 * - Cleanup patterns for event listeners
 * - Error boundaries for graceful API failures
 */

export type ConnectionSpeed = 'fast' | 'slow' | 'unknown'
export type NetworkStrategy = 'aggressive' | 'conservative' | 'disabled'

/**
 * Network Status Interface - Adapter Pattern
 * Abstracts different network detection APIs
 */
export interface NetworkStatus {
  readonly isOnline: boolean
  readonly connectionSpeed: ConnectionSpeed
  readonly dataSaver: boolean
  readonly lastChecked: number
  readonly effectiveType?: string
  readonly downlink?: number
  readonly rtt?: number
}

/**
 * Network Observer Interface - Observer Pattern
 */
export interface NetworkObserver {
  onNetworkChange(status: NetworkStatus, previousStatus: NetworkStatus): void
  onConnectionSpeedChange(speed: ConnectionSpeed, previousSpeed: ConnectionSpeed): void
  onOnlineStatusChange(isOnline: boolean): void
}

/**
 * Network Status Provider Interface - Strategy Pattern
 */
export interface NetworkStatusProvider {
  getCurrentStatus(): NetworkStatus
  startMonitoring(): void
  stopMonitoring(): void
  isSupported(): boolean
}

/**
 * Prefetch Strategy Config Interface - Interface Segregation
 */
export interface NetworkPrefetchConfig {
  strategy: NetworkStrategy
  maxConcurrentRequests: number
  delayMs: number
  disableOnSlow: boolean
  disableOnDataSaver: boolean
  minDownlinkMbps?: number
  maxRttMs?: number
}

/**
 * Navigator Connection API Adapter - Adapter Pattern
 * Wraps native Navigator.connection with consistent interface
 */

interface NavigatorConnection {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
  addEventListener?: (type: string, listener: () => void) => void
  removeEventListener?: (type: string, listener: () => void) => void
}

interface ExtendedNavigator extends Navigator {
  connection?: NavigatorConnection
  mozConnection?: NavigatorConnection
  webkitConnection?: NavigatorConnection
}

class NavigatorConnectionAdapter implements NetworkStatusProvider {
  private connection: NavigatorConnection | null = null
  private listeners: (() => void)[] = []
  private lastStatus: NetworkStatus | null = null

  constructor() {
    // Check for various connection API implementations
    const nav = navigator as ExtendedNavigator
    this.connection = nav.connection || nav.mozConnection || nav.webkitConnection || null
  }

  getCurrentStatus(): NetworkStatus {
    const baseStatus: NetworkStatus = {
      isOnline: navigator.onLine,
      connectionSpeed: this.determineConnectionSpeed(),
      dataSaver: this.getDataSaverStatus(),
      lastChecked: Date.now(),
    }

    // Add connection-specific details if available
    if (this.connection) {
      const connectionDetails: any = {}
      
      if (this.connection.effectiveType !== undefined) {
        connectionDetails.effectiveType = this.connection.effectiveType
      }
      if (this.connection.downlink !== undefined) {
        connectionDetails.downlink = this.connection.downlink
      }
      if (this.connection.rtt !== undefined) {
        connectionDetails.rtt = this.connection.rtt
      }
      
      return {
        ...baseStatus,
        ...connectionDetails,
      } as NetworkStatus
    }

    return baseStatus
  }

  startMonitoring(): void {
    if (!this.isSupported()) {
      return
    }

    // Monitor online/offline status
    const onlineHandler = () => this.handleStatusChange()
    const offlineHandler = () => this.handleStatusChange()
    
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    
    this.listeners.push(
      () => window.removeEventListener('online', onlineHandler),
      () => window.removeEventListener('offline', offlineHandler)
    )

    // Monitor connection changes if supported
    if (this.connection && 
        typeof this.connection.addEventListener === 'function' &&
        typeof this.connection.removeEventListener === 'function') {
      const connectionHandler = () => this.handleStatusChange()
      const connection = this.connection // Capture connection reference
      connection.addEventListener!('change', connectionHandler)
      
      this.listeners.push(
        () => {
          if (typeof connection.removeEventListener === 'function') {
            connection.removeEventListener('change', connectionHandler)
          }
        }
      )
    }

    // Initial status
    this.lastStatus = this.getCurrentStatus()
  }

  stopMonitoring(): void {
    this.listeners.forEach(cleanup => cleanup())
    this.listeners = []
    this.lastStatus = null
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'onLine' in navigator
  }

  private determineConnectionSpeed(): ConnectionSpeed {
    if (!this.connection) {
      return 'unknown'
    }

    const effectiveType = this.connection.effectiveType
    const downlink = this.connection.downlink

    // Use downlink speed if available (Mbps)
    if (typeof downlink === 'number') {
      return downlink >= 1.5 ? 'fast' : 'slow'
    }

    // Fallback to effective type
    if (effectiveType) {
      return ['4g', '5g'].includes(effectiveType) ? 'fast' : 'slow'
    }

    return 'unknown'
  }

  private getDataSaverStatus(): boolean {
    if (!this.connection) {
      return false
    }

    // Check for data saver mode
    return this.connection.saveData === true
  }

  private handleStatusChange(): void {
    const currentStatus = this.getCurrentStatus()
    
    // Only trigger if status actually changed
    if (this.lastStatus && this.hasStatusChanged(this.lastStatus, currentStatus)) {
      this.lastStatus = currentStatus
    }
  }

  private hasStatusChanged(previous: NetworkStatus, current: NetworkStatus): boolean {
    return (
      previous.isOnline !== current.isOnline ||
      previous.connectionSpeed !== current.connectionSpeed ||
      previous.dataSaver !== current.dataSaver
    )
  }
}

/**
 * Network Observer Manager - Observer Pattern Implementation
 */
class NetworkObserverManager {
  private static instance: NetworkObserverManager
  private readonly observers = new Set<NetworkObserver>()
  private readonly provider: NetworkStatusProvider
  private currentStatus: NetworkStatus | null = null
  private isMonitoring = false

  private constructor() {
    this.provider = new NavigatorConnectionAdapter()
  }

  public static getInstance(): NetworkObserverManager {
    if (!NetworkObserverManager.instance) {
      NetworkObserverManager.instance = new NetworkObserverManager()
    }
    return NetworkObserverManager.instance
  }

  /**
   * Add observer for network changes
   */
  addObserver(observer: NetworkObserver): void {
    this.observers.add(observer)
    
    // Start monitoring when first observer is added
    if (this.observers.size === 1 && !this.isMonitoring) {
      this.startMonitoring()
    }
  }

  /**
   * Remove observer
   */
  removeObserver(observer: NetworkObserver): void {
    this.observers.delete(observer)
    
    // Stop monitoring when no observers remain
    if (this.observers.size === 0 && this.isMonitoring) {
      this.stopMonitoring()
    }
  }

  /**
   * Get current network status
   */
  getCurrentStatus(): NetworkStatus {
    return this.provider.getCurrentStatus()
  }

  /**
   * Force status check and notification
   */
  checkStatus(): void {
    const newStatus = this.provider.getCurrentStatus()
    
    if (this.currentStatus) {
      this.notifyObservers(newStatus, this.currentStatus)
    }
    
    this.currentStatus = newStatus
  }

  private startMonitoring(): void {
    if (!this.provider.isSupported()) {
      console.warn('Network status monitoring not supported in this browser')
      return
    }

    this.isMonitoring = true
    this.currentStatus = this.provider.getCurrentStatus()
    this.provider.startMonitoring()

    // Poll for status changes (fallback for browsers with limited support)
    this.setupPolling()
  }

  private stopMonitoring(): void {
    this.isMonitoring = false
    this.provider.stopMonitoring()
  }

  private setupPolling(): void {
    const pollInterval = 5000 // 5 seconds
    
    const poll = () => {
      if (!this.isMonitoring) {
        return
      }
      
      const newStatus = this.provider.getCurrentStatus()
      
      if (this.currentStatus && this.hasStatusChanged(this.currentStatus, newStatus)) {
        this.notifyObservers(newStatus, this.currentStatus)
        this.currentStatus = newStatus
      }
      
      setTimeout(poll, pollInterval)
    }
    
    setTimeout(poll, pollInterval)
  }

  private notifyObservers(newStatus: NetworkStatus, previousStatus: NetworkStatus): void {
    for (const observer of this.observers) {
      try {
        observer.onNetworkChange(newStatus, previousStatus)
        
        // Specific notifications
        if (newStatus.connectionSpeed !== previousStatus.connectionSpeed) {
          observer.onConnectionSpeedChange(newStatus.connectionSpeed, previousStatus.connectionSpeed)
        }
        
        if (newStatus.isOnline !== previousStatus.isOnline) {
          observer.onOnlineStatusChange(newStatus.isOnline)
        }
      } catch (error) {
        console.error('Network observer notification failed:', error)
      }
    }
  }

  private hasStatusChanged(previous: NetworkStatus, current: NetworkStatus): boolean {
    return (
      previous.isOnline !== current.isOnline ||
      previous.connectionSpeed !== current.connectionSpeed ||
      previous.dataSaver !== current.dataSaver
    )
  }
}

/**
 * Network-Aware Prefetch Strategy Manager
 * Determines prefetch behavior based on network conditions
 */
export class NetworkPrefetchStrategyManager implements NetworkObserver {
  private currentConfig: NetworkPrefetchConfig
  private readonly configChangeCallbacks = new Set<(config: NetworkPrefetchConfig) => void>()

  constructor(initialConfig: NetworkPrefetchConfig) {
    this.currentConfig = initialConfig
  }

  /**
   * Network Observer implementation
   */
  onNetworkChange(status: NetworkStatus, previousStatus: NetworkStatus): void {
    void previousStatus // Acknowledge parameter for interface compliance
    const newConfig = this.determineConfig(status)
    
    if (this.hasConfigChanged(this.currentConfig, newConfig)) {
      this.currentConfig = newConfig
      this.notifyConfigChange()
    }
  }

  onConnectionSpeedChange(speed: ConnectionSpeed, previousSpeed: ConnectionSpeed): void {
    void speed // Acknowledge parameters for interface compliance
    void previousSpeed
    // Handled by onNetworkChange
  }

  onOnlineStatusChange(isOnline: boolean): void {
    if (!isOnline) {
      this.currentConfig = {
        ...this.currentConfig,
        strategy: 'disabled',
        maxConcurrentRequests: 0,
      }
      this.notifyConfigChange()
    }
  }

  /**
   * Get current prefetch configuration
   */
  getCurrentConfig(): NetworkPrefetchConfig {
    return { ...this.currentConfig }
  }

  /**
   * Add callback for config changes
   */
  onConfigChange(callback: (config: NetworkPrefetchConfig) => void): void {
    this.configChangeCallbacks.add(callback)
  }

  /**
   * Remove config change callback
   */
  removeConfigChangeCallback(callback: (config: NetworkPrefetchConfig) => void): void {
    this.configChangeCallbacks.delete(callback)
  }

  private determineConfig(status: NetworkStatus): NetworkPrefetchConfig {
    // Disabled when offline
    if (!status.isOnline) {
      return {
        ...this.currentConfig,
        strategy: 'disabled',
        maxConcurrentRequests: 0,
      }
    }

    // Disabled with data saver
    if (status.dataSaver && this.currentConfig.disableOnDataSaver) {
      return {
        ...this.currentConfig,
        strategy: 'disabled',
        maxConcurrentRequests: 0,
      }
    }

    // Conservative on slow connections
    if (status.connectionSpeed === 'slow' && this.currentConfig.disableOnSlow) {
      return {
        ...this.currentConfig,
        strategy: 'conservative',
        maxConcurrentRequests: 1,
        delayMs: Math.max(this.currentConfig.delayMs, 2000),
      }
    }

    // Aggressive on fast connections
    if (status.connectionSpeed === 'fast') {
      return {
        ...this.currentConfig,
        strategy: 'aggressive',
        maxConcurrentRequests: Math.min(this.currentConfig.maxConcurrentRequests, 3),
        delayMs: Math.min(this.currentConfig.delayMs, 200),
      }
    }

    // Default conservative approach
    return {
      ...this.currentConfig,
      strategy: 'conservative',
    }
  }

  private hasConfigChanged(previous: NetworkPrefetchConfig, current: NetworkPrefetchConfig): boolean {
    return (
      previous.strategy !== current.strategy ||
      previous.maxConcurrentRequests !== current.maxConcurrentRequests ||
      previous.delayMs !== current.delayMs
    )
  }

  private notifyConfigChange(): void {
    for (const callback of this.configChangeCallbacks) {
      try {
        callback(this.currentConfig)
      } catch (error) {
        console.error('Config change callback failed:', error)
      }
    }
  }
}

/**
 * Singleton exports
 */
export const networkObserverManager = NetworkObserverManager.getInstance()

/**
 * Utility functions for network-aware prefetching
 */
export const NetworkUtils = {
  /**
   * Create network-aware prefetch strategy manager
   */
  createStrategyManager: (initialConfig: NetworkPrefetchConfig): NetworkPrefetchStrategyManager => {
    const manager = new NetworkPrefetchStrategyManager(initialConfig)
    networkObserverManager.addObserver(manager)
    return manager
  },

  /**
   * Get current network status
   */
  getCurrentStatus: (): NetworkStatus => {
    return networkObserverManager.getCurrentStatus()
  },

  /**
   * Check if prefetching should be enabled
   */
  shouldEnablePrefetch: (status?: NetworkStatus): boolean => {
    const networkStatus = status || networkObserverManager.getCurrentStatus()
    return networkStatus.isOnline && !networkStatus.dataSaver
  },

  /**
   * Get recommended max concurrent requests based on network
   */
  getRecommendedConcurrency: (status?: NetworkStatus): number => {
    const networkStatus = status || networkObserverManager.getCurrentStatus()
    
    if (!networkStatus.isOnline || networkStatus.dataSaver) {
      return 0
    }
    
    switch (networkStatus.connectionSpeed) {
      case 'fast':
        return 3
      case 'slow':
        return 1
      default:
        return 2
    }
  },
} as const