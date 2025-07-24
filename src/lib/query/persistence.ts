import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

/**
 * Storage Interface - Abstraction for different storage mechanisms
 * Follows Interface Segregation Principle - focused storage contract
 * Allows for easy testing and different storage implementations
 */
interface StorageInterface {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

/**
 * Browser Local Storage Implementation
 * Implements Dependency Inversion - depends on abstraction
 * Single Responsibility - handles localStorage operations
 */
class BrowserStorage implements StorageInterface {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('Failed to get item from localStorage:', error)
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('Failed to set item in localStorage:', error)
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove item from localStorage:', error)
    }
  }

  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }
}

/**
 * Memory Storage Implementation (fallback)
 * Implements same interface for consistency
 * Used when localStorage is not available (SSR, testing)
 */
class MemoryStorage implements StorageInterface {
  private storage = new Map<string, string>()

  getItem(key: string): string | null {
    return this.storage.get(key) || null
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value)
  }

  removeItem(key: string): void {
    this.storage.delete(key)
  }

  clear(): void {
    this.storage.clear()
  }
}

/**
 * Persistence Configuration Interface
 * Defines configurable persistence behavior
 * Open/Closed Principle - extensible configuration
 */
interface PersistenceConfig {
  storageKey: string
  maxAge?: number
  serialize?: (data: unknown) => string
  deserialize?: (data: string) => unknown
  buster?: string
  hydrateOptions?: {
    defaultOptions?: {
      queries?: {
        staleTime?: number
        gcTime?: number
      }
    }
  }
  dehydrateOptions?: {
    shouldDehydrateQuery?: (query: unknown) => boolean
    shouldDehydrateMutation?: (mutation: unknown) => boolean
  }
}

/**
 * Query Persistence Service
 * Manages TanStack Query cache persistence
 * Follows Single Responsibility - persistence orchestration
 * Implements Strategy Pattern for different storage options
 */
class QueryPersistenceService {
  private storage: StorageInterface
  private config: Required<PersistenceConfig>

  constructor(config: PersistenceConfig, storage?: StorageInterface) {
    this.storage = storage || this.createStorage()
    this.config = {
      storageKey: config.storageKey,
      maxAge: config.maxAge || 24 * 60 * 60 * 1000, // 24 hours default
      serialize: config.serialize || JSON.stringify,
      deserialize: config.deserialize || ((data: string) => {
        try {
          return JSON.parse(data) as import('@tanstack/query-persist-client-core').PersistedClient
        } catch {
          return { 
            buster: '',
            timestamp: Date.now(),
            clientState: { 
              queries: [], 
              mutations: [] 
            }
          } as import('@tanstack/query-persist-client-core').PersistedClient
        }
      }),
      buster: config.buster || '',
      hydrateOptions: config.hydrateOptions || {
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
          },
        },
      },
      dehydrateOptions: config.dehydrateOptions || {
        shouldDehydrateQuery: () => true,
        shouldDehydrateMutation: () => false,
      },
    }
  }

  /**
   * Creates appropriate storage based on environment
   * Factory Method Pattern - creates storage instances
   */
  private createStorage(): StorageInterface {
    if (typeof window !== 'undefined' && window.localStorage) {
      return new BrowserStorage()
    }
    return new MemoryStorage()
  }

  /**
   * Creates TanStack Query persister
   * Factory Method - creates configured persister
   */
  createPersister() {
    return createSyncStoragePersister({
      storage: this.storage,
      key: this.config.storageKey,
      serialize: this.config.serialize,
      deserialize: this.config.deserialize as (cachedString: string) => import('@tanstack/query-persist-client-core').PersistedClient,
      throttleTime: 1000, // Throttle persistence operations
    })
  }

  /**
   * Gets persistence configuration
   * Accessor method for configuration
   */
  getConfig() {
    return {
      persister: this.createPersister(),
      maxAge: this.config.maxAge,
      hydrateOptions: this.config.hydrateOptions,
      dehydrateOptions: this.config.dehydrateOptions,
      buster: this.config.buster,
    }
  }

  /**
   * Clears persisted cache
   * Utility method for cache management
   */
  clearPersistedCache(): void {
    this.storage.removeItem(this.config.storageKey)
  }

  /**
   * Gets cache health information
   * Monitoring and debugging utility
   */
  getCacheHealth(): {
    isStorageAvailable: boolean
    cacheSize: number
    lastPersisted: string | null
  } {
    const isStorageAvailable = this.storage instanceof BrowserStorage

    let cacheSize = 0
    let lastPersisted: string | null = null

    try {
      const cachedData = this.storage.getItem(this.config.storageKey)
      if (cachedData) {
        cacheSize = new Blob([cachedData]).size
        // Try to extract timestamp from cache
        const parsed = this.config.deserialize(cachedData)
        if (parsed && typeof parsed === 'object' && 'clientState' in parsed) {
          const clientState = parsed.clientState as { timestamp?: number }
          if (clientState.timestamp) {
            lastPersisted = new Date(clientState.timestamp).toISOString()
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache health:', error)
    }

    return {
      isStorageAvailable,
      cacheSize,
      lastPersisted,
    }
  }
}

/**
 * Default Persistence Configuration
 * Sensible defaults for most applications
 * Following Convention over Configuration principle
 */
const defaultPersistenceConfig: PersistenceConfig = {
  storageKey: 'tanstack-query-cache',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  buster: typeof window !== 'undefined' ? Date.now().toString() : '1.0.0',
  hydrateOptions: {
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  },
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only persist successful queries
      return query && typeof query === 'object' && 'state' in query
        ? (query.state as { status?: string }).status === 'success'
        : false
    },
    shouldDehydrateMutation: () => false, // Don't persist mutations
  },
}

/**
 * Persistence Service Factory
 * Creates configured persistence service instances
 * Implements Factory Pattern
 */
export const createPersistenceService = (
  config: Partial<PersistenceConfig> = {},
  storage?: StorageInterface
): QueryPersistenceService => {
  const mergedConfig = { ...defaultPersistenceConfig, ...config }
  return new QueryPersistenceService(mergedConfig, storage)
}

/**
 * Default Persistence Service Instance
 * Singleton pattern for application-wide persistence
 */
export const persistenceService = createPersistenceService()

/**
 * Persistence Hook for React Components
 * Provides access to persistence functionality
 * Follows React Hooks patterns
 */
export const usePersistence = () => {
  return {
    clearCache: () => persistenceService.clearPersistedCache(),
    getCacheHealth: () => persistenceService.getCacheHealth(),
    createService: createPersistenceService,
  }
}

/**
 * Utility Types
 */
export type { StorageInterface, PersistenceConfig }
export { QueryPersistenceService, BrowserStorage, MemoryStorage }