import { createSelector } from 'reselect'

import type { EventsState } from '@/lib/types/event.types'
import type { RootState } from '@/store'

/**
 * Event Selectors - Memoized state selectors using Reselect
 *
 * Design Patterns Applied:
 * 1. **Selector Pattern**: Encapsulates state access logic and provides clean API
 * 2. **Memoization Pattern**: Uses Reselect for performance optimization
 * 3. **Computed Property Pattern**: Derives complex values from base state
 * 4. **Observer Pattern**: Enables components to observe specific state slices
 * 5. **Factory Pattern**: createSelector creates memoized selector functions
 *
 * SOLID Principles:
 * - **SRP**: Each selector has single responsibility for specific data access
 * - **OCP**: New selectors can be added without modifying existing ones
 * - **LSP**: All selectors follow same (state, ...args) => result pattern
 * - **ISP**: Focused selector interfaces for specific component needs
 * - **DIP**: Components depend on selector abstractions, not state shape
 *
 * Performance Benefits:
 * - Memoization prevents unnecessary re-computations
 * - Components only re-render when their specific data changes
 * - Complex derived state calculations are cached
 * - Reselect handles shallow equality checks automatically
 */

// Base selectors - Direct state access with stable fallback defaults
const defaultEventsState: EventsState = {
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  searchQuery: '',
  cityFilter: undefined,
  isLoading: false,
  error: null,
  lastFetched: null,
  pagination: null,
  // Enhanced pagination defaults
  currentPage: 1,
  itemsPerPage: 12,
  totalPages: 0,
  cachedPages: {},
  prefetchingPage: null,
  prefetchedPages: [],
  isChangingPage: false,
  // Enhanced prefetch state defaults
  prefetchQueue: [],
  activePrefetches: {},
  networkStatus: {
    isOnline: true,
    connectionSpeed: 'unknown' as const,
    dataSaver: false,
  },
  prefetchConfig: {
    maxConcurrentRequests: 2,
    networkAwareThreshold: 1000,
    delayMs: 500,
    enabledStrategies: ['immediate', 'delayed'],
    prefetchEnabled: true,
  },
  failedPrefetches: {},
}

export const selectEventsState = (state: RootState): EventsState =>
  state.events || defaultEventsState

export const selectEvents = createSelector(
  [selectEventsState],
  eventsState => eventsState.events
)

export const selectFilteredEvents = createSelector(
  [selectEventsState],
  eventsState => eventsState.filteredEvents
)

export const selectSelectedEvent = createSelector(
  [selectEventsState],
  eventsState => eventsState.selectedEvent
)

export const selectSearchQuery = createSelector(
  [selectEventsState],
  eventsState => eventsState.searchQuery
)

export const selectCityFilter = createSelector(
  [selectEventsState],
  eventsState => eventsState.cityFilter
)

export const selectIsLoading = createSelector(
  [selectEventsState],
  eventsState => eventsState.isLoading
)

export const selectError = createSelector(
  [selectEventsState],
  eventsState => eventsState.error
)

export const selectLastFetched = createSelector(
  [selectEventsState],
  eventsState => eventsState.lastFetched
)

export const selectPagination = createSelector(
  [selectEventsState],
  eventsState => eventsState.pagination
)

// Derived selectors - Computed values from base state
export const selectEventsCount = createSelector(
  [selectEvents],
  events => events.length
)

export const selectFilteredEventsCount = createSelector(
  [selectFilteredEvents],
  filteredEvents => filteredEvents.length
)

export const selectHasSearchQuery = createSelector(
  [selectSearchQuery],
  searchQuery => searchQuery.length > 0
)

export const selectHasCityFilter = createSelector(
  [selectCityFilter],
  cityFilter => Boolean(cityFilter)
)

export const selectHasActiveFilters = createSelector(
  [selectHasSearchQuery, selectHasCityFilter],
  (hasSearch, hasCityFilter) => hasSearch || hasCityFilter
)

export const selectHasError = createSelector(
  [selectError],
  error => error !== null
)

export const selectHasData = createSelector(
  [selectEvents],
  events => events.length > 0
)

export const selectHasResults = createSelector(
  [selectFilteredEvents],
  filteredEvents => filteredEvents.length > 0
)

// Cache selectors
export const selectCacheAge = createSelector(
  [selectLastFetched],
  lastFetched => {
    if (!lastFetched) return null
    return Date.now() - lastFetched
  }
)

export const selectIsCacheStale = createSelector([selectCacheAge], cacheAge => {
  if (cacheAge === null) return true
  // Consider cache stale after 5 minutes
  const CACHE_EXPIRY = 5 * 60 * 1000
  return cacheAge > CACHE_EXPIRY
})

// Enhanced pagination selectors
export const selectCurrentPage = createSelector(
  [selectEventsState],
  eventsState => eventsState.currentPage
)

export const selectItemsPerPage = createSelector(
  [selectEventsState],
  eventsState => eventsState.itemsPerPage
)

export const selectTotalPages = createSelector(
  [selectEventsState],
  eventsState => eventsState.totalPages
)

export const selectCachedPages = createSelector(
  [selectEventsState],
  eventsState => eventsState.cachedPages
)

export const selectPrefetchingPage = createSelector(
  [selectEventsState],
  eventsState => eventsState.prefetchingPage
)

export const selectPrefetchedPages = createSelector(
  [selectEventsState],
  eventsState => eventsState.prefetchedPages
)

export const selectIsChangingPage = createSelector(
  [selectEventsState],
  eventsState => eventsState.isChangingPage
)

// Derived pagination selectors
export const selectCanGoPrevious = createSelector(
  [selectCurrentPage],
  currentPage => currentPage > 1
)

export const selectCanGoNext = createSelector(
  [selectCurrentPage, selectTotalPages],
  (currentPage, totalPages) => currentPage < totalPages
)

export const selectPageOffset = createSelector(
  [selectCurrentPage, selectItemsPerPage],
  (currentPage, itemsPerPage) => (currentPage - 1) * itemsPerPage
)

// State-based selector - uses currentPage from Redux state
export const selectIsCurrentPageCached = createSelector(
  [selectCachedPages, selectCurrentPage],
  (cachedPages, currentPage) => {
    if (!currentPage) return false
    return currentPage.toString() in cachedPages
  }
)

// Parameter-based selector - for thunk usage with explicit page
export const selectIsPageCached = createSelector(
  [selectCachedPages, (_state: RootState, page: number) => page],
  (cachedPages, page) => {
    if (page === undefined || page === null) return false
    return page.toString() in cachedPages
  }
)

// State-based selector - uses currentPage from Redux state
export const selectCurrentCachedPageData = createSelector(
  [selectCachedPages, selectCurrentPage],
  (cachedPages, currentPage) => {
    if (!currentPage) return undefined
    return cachedPages[currentPage.toString()]
  }
)

// Parameter-based selector - for thunk usage with explicit page
export const selectCachedPageData = createSelector(
  [selectCachedPages, (_state: RootState, page: number) => page],
  (cachedPages, page) => {
    if (page === undefined || page === null) return undefined
    return cachedPages[page.toString()]
  }
)

export const selectIsPagePrefetched = createSelector(
  [selectPrefetchedPages, (_state: RootState, page: number) => page],
  (prefetchedPages, page) => prefetchedPages.includes(page)
)

export const selectCurrentPageEvents = createSelector(
  [selectEvents, selectCurrentPage, selectItemsPerPage, selectCachedPages],
  (events, currentPage, itemsPerPage, cachedPages) => {
    // Safety checks
    if (!currentPage || currentPage < 1 || !itemsPerPage) {
      return events.slice(0, itemsPerPage || 12) // Return first page as fallback
    }

    // Check if current page is cached
    const cachedPage = cachedPages[currentPage.toString()]
    if (cachedPage && cachedPage.events) {
      return cachedPage.events
    }

    // Otherwise, slice from current events (fallback)
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return events.slice(start, end)
  }
)

// State-based selector - uses currentPage from Redux state
export const selectCurrentPageCacheAge = createSelector(
  [selectCachedPages, selectCurrentPage],
  (cachedPages, currentPage) => {
    if (!currentPage) return null
    const cached = cachedPages[currentPage.toString()]
    if (!cached) return null
    return Date.now() - cached.timestamp
  }
)

// Parameter-based selector - for thunk usage with explicit page
export const selectPageCacheAge = createSelector(
  [selectCachedPages, (_state: RootState, page: number) => page],
  (cachedPages, page) => {
    if (page === undefined || page === null) return null
    const cached = cachedPages[page.toString()]
    if (!cached) return null
    return Date.now() - cached.timestamp
  }
)

export const selectIsPageCacheStale = createSelector(
  [selectPageCacheAge],
  cacheAge => {
    if (cacheAge === null) return true
    // Consider page cache stale after 5 minutes
    const CACHE_EXPIRY = 5 * 60 * 1000
    return cacheAge > CACHE_EXPIRY
  }
)

export const selectNextPageNumber = createSelector(
  [selectCurrentPage, selectTotalPages],
  (currentPage, totalPages) => {
    const next = currentPage + 1
    return next <= totalPages ? next : null
  }
)

export const selectPreviousPageNumber = createSelector(
  [selectCurrentPage],
  currentPage => {
    const prev = currentPage - 1
    return prev >= 1 ? prev : null
  }
)

export const selectPaginationInfo = createSelector(
  [selectCurrentPage, selectTotalPages, selectItemsPerPage, selectPageOffset],
  (currentPage, totalPages, itemsPerPage, offset) => ({
    currentPage,
    totalPages,
    itemsPerPage,
    offset,
    startItem: offset + 1,
    endItem: Math.min(offset + itemsPerPage, totalPages * itemsPerPage),
  })
)

// Legacy pagination selectors (for backward compatibility)
export const selectHasMore = createSelector(
  [selectPagination],
  pagination => pagination?.hasMore || false
)

// Event lookup selectors
export const selectEventBySlug = createSelector(
  [selectEvents, (_state: RootState, slug: string) => slug],
  (events, slug) => events.find(event => event.slug === slug)
)

export const selectEventsByCity = createSelector(
  [selectEvents, (_state: RootState, citySlug: string) => citySlug],
  (events, citySlug) => events.filter(event => event.citySlug === citySlug)
)

export const selectEventsBySearchTerm = createSelector(
  [selectEvents, (_state: RootState, searchTerm: string) => searchTerm],
  (events, searchTerm) => {
    if (!searchTerm.trim()) return events

    const term = searchTerm.toLowerCase().trim()
    return events.filter(
      event =>
        event.name.toLowerCase().includes(term) ||
        event.city.toLowerCase().includes(term) ||
        event.location.toLowerCase().includes(term) ||
        event.organizerName.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term)
    )
  }
)

export const selectUpcomingEvents = createSelector([selectEvents], events => {
  const now = new Date()
  return events
    .filter(event => new Date(event.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

export const selectEventsByDateRange = createSelector(
  [
    selectEvents,
    (_state: RootState, startDate: Date, endDate: Date) => ({
      startDate,
      endDate,
    }),
  ],
  (events, { startDate, endDate }) => {
    return events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= startDate && eventDate <= endDate
    })
  }
)

// UI state selectors
export const selectIsEmpty = createSelector(
  [selectHasData, selectIsLoading],
  (hasData, isLoading) => !hasData && !isLoading
)

export const selectShouldShowEmptyState = createSelector(
  [selectIsEmpty, selectHasError],
  (isEmpty, hasError) => isEmpty && !hasError
)

export const selectShouldShowEmptyResults = createSelector(
  [selectHasData, selectHasResults, selectHasActiveFilters, selectIsLoading],
  (hasData, hasResults, hasFilters, isLoading) =>
    hasData && !hasResults && hasFilters && !isLoading
)

export const selectShouldRefresh = createSelector(
  [selectIsCacheStale, selectHasError, selectIsLoading],
  (isCacheStale, hasError, isLoading) =>
    (isCacheStale || hasError) && !isLoading
)

// Search context selectors
export const selectSearchContext = createSelector(
  [
    selectSearchQuery,
    selectCityFilter,
    selectFilteredEventsCount,
    selectEventsCount,
  ],
  (searchQuery, cityFilter, filteredCount, totalCount) => ({
    searchQuery,
    cityFilter,
    filteredCount,
    totalCount,
    isSearchActive: Boolean(searchQuery || cityFilter),
    hasResults: filteredCount > 0,
  })
)

// Enhanced Prefetch Selectors - Memoized state tracking for intelligent prefetching
// Using Reselect patterns for optimal performance and React 19 integration

/**
 * Enhanced Prefetch State Selectors - Memoization Pattern + Single Responsibility
 * Each selector focuses on one specific aspect of prefetch state
 */

// Base prefetch state selectors
export const selectPrefetchQueue = createSelector(
  [selectEventsState],
  eventsState => eventsState.prefetchQueue || []
)

export const selectActivePrefetches = createSelector(
  [selectEventsState],
  eventsState => eventsState.activePrefetches || {}
)

export const selectNetworkStatus = createSelector(
  [selectEventsState],
  eventsState =>
    eventsState.networkStatus || {
      isOnline: true,
      connectionSpeed: 'unknown' as const,
      dataSaver: false,
    }
)

export const selectPrefetchConfig = createSelector(
  [selectEventsState],
  eventsState =>
    eventsState.prefetchConfig || {
      maxConcurrentRequests: 2,
      networkAwareThreshold: 1000,
      delayMs: 500,
      enabledStrategies: ['immediate', 'delayed'],
      prefetchEnabled: true,
    }
)

export const selectFailedPrefetches = createSelector(
  [selectEventsState],
  eventsState => eventsState.failedPrefetches || {}
)

// Derived prefetch selectors - Computed values following Open/Closed Principle
export const selectPrefetchQueueLength = createSelector(
  [selectPrefetchQueue],
  queue => queue.length
)

export const selectActivePrefetchCount = createSelector(
  [selectActivePrefetches],
  activePrefetches => Object.keys(activePrefetches).length
)

export const selectFailedPrefetchCount = createSelector(
  [selectFailedPrefetches],
  failedPrefetches => Object.keys(failedPrefetches).length
)

export const selectIsPrefetchEnabled = createSelector(
  [selectPrefetchConfig, selectNetworkStatus],
  (config, networkStatus) =>
    config.prefetchEnabled && networkStatus.isOnline && !networkStatus.dataSaver
)

export const selectCanPrefetchMore = createSelector(
  [selectActivePrefetchCount, selectPrefetchConfig],
  (activeCount, config) => activeCount < config.maxConcurrentRequests
)

// Priority-based queue selectors - Strategy Pattern implementation
export const selectHighPriorityPrefetches = createSelector(
  [selectPrefetchQueue],
  queue => queue.filter(item => item.priority === 'high')
)

export const selectNormalPriorityPrefetches = createSelector(
  [selectPrefetchQueue],
  queue => queue.filter(item => item.priority === 'normal')
)

export const selectLowPriorityPrefetches = createSelector(
  [selectPrefetchQueue],
  queue => queue.filter(item => item.priority === 'low')
)

// Network-aware selectors - Observer Pattern integration
export const selectIsOnline = createSelector(
  [selectNetworkStatus],
  networkStatus => networkStatus.isOnline
)

export const selectConnectionSpeed = createSelector(
  [selectNetworkStatus],
  networkStatus => networkStatus.connectionSpeed
)

export const selectDataSaverEnabled = createSelector(
  [selectNetworkStatus],
  networkStatus => networkStatus.dataSaver
)

export const selectShouldUseFastStrategy = createSelector(
  [selectConnectionSpeed],
  speed => speed === 'fast'
)

export const selectShouldUseConservativeStrategy = createSelector(
  [selectConnectionSpeed, selectDataSaverEnabled],
  (speed, dataSaver) => speed === 'slow' || dataSaver
)

// Page-specific prefetch selectors - Parameter-based with memoization
export const selectIsPageInQueue = createSelector(
  [selectPrefetchQueue, (_state: RootState, page: number) => page],
  (queue, page) => queue.some(item => item.page === page)
)

export const selectIsPagePrefetching = createSelector(
  [selectActivePrefetches, (_state: RootState, page: number) => page],
  (activePrefetches, page) =>
    Object.values(activePrefetches).some(prefetch => prefetch.page === page)
)

export const selectPagePrefetchStatus = createSelector(
  [
    selectIsPagePrefetched,
    selectIsPageInQueue,
    selectIsPagePrefetching,
    (_state: RootState, page: number) => page,
  ],
  (isPrefetched, isQueued, isPrefetching, page) => ({
    page,
    isPrefetched,
    isQueued,
    isPrefetching,
    status: isPrefetching
      ? 'prefetching'
      : isQueued
        ? 'queued'
        : isPrefetched
          ? 'prefetched'
          : 'none',
  })
)

// Failed prefetch tracking - Error handling selectors
export const selectPagePrefetchErrors = createSelector(
  [selectFailedPrefetches, (_state: RootState, page: number) => page],
  (failedPrefetches, page) => {
    return Object.entries(failedPrefetches)
      .filter(([, failure]) => failure.page === page)
      .map(([key, failure]) => ({ requestId: key, ...failure }))
  }
)

export const selectHasPagePrefetchFailed = createSelector(
  [selectPagePrefetchErrors],
  errors => errors.length > 0
)

export const selectPagePrefetchRetryCount = createSelector(
  [selectPagePrefetchErrors],
  errors => errors.reduce((max, error) => Math.max(max, error.retryCount), 0)
)

// Strategy-based selectors - Strategy Pattern for prefetch behavior
export const selectCurrentPrefetchStrategy = createSelector(
  [selectNetworkStatus],
  networkStatus => {
    if (!networkStatus.isOnline || networkStatus.dataSaver) {
      return 'disabled'
    }

    if (networkStatus.connectionSpeed === 'fast') {
      return 'aggressive'
    }

    if (networkStatus.connectionSpeed === 'slow') {
      return 'conservative'
    }

    return 'normal'
  }
)

export const selectPrefetchDelay = createSelector(
  [selectPrefetchConfig, selectCurrentPrefetchStrategy],
  (config, strategy) => {
    switch (strategy) {
      case 'aggressive':
        return Math.min(config.delayMs, 200)
      case 'conservative':
        return Math.max(config.delayMs, 2000)
      case 'disabled':
        return 0
      default:
        return config.delayMs
    }
  }
)

export const selectMaxConcurrentPrefetches = createSelector(
  [selectPrefetchConfig, selectCurrentPrefetchStrategy],
  (config, strategy) => {
    switch (strategy) {
      case 'aggressive':
        return Math.min(config.maxConcurrentRequests, 3)
      case 'conservative':
        return 1
      case 'disabled':
        return 0
      default:
        return config.maxConcurrentRequests
    }
  }
)

// Next/Previous page prefetch recommendations - Strategy Pattern
export const selectNextPagePrefetchRecommendation = createSelector(
  [
    selectNextPageNumber,
    selectIsPagePrefetched,
    selectIsPageInQueue,
    selectIsPrefetchEnabled,
    selectCanPrefetchMore,
  ],
  (
    nextPage,
    isPagePrefetched,
    isPageInQueue,
    prefetchEnabled,
    canPrefetchMore
  ) => {
    if (!nextPage || !prefetchEnabled || !canPrefetchMore) {
      return { shouldPrefetch: false, reason: 'conditions-not-met' }
    }

    // Use state for parameter-based selector
    const isPrefetched = isPagePrefetched
    const isQueued = isPageInQueue

    if (isPrefetched) {
      return { shouldPrefetch: false, reason: 'already-prefetched' }
    }

    if (isQueued) {
      return { shouldPrefetch: false, reason: 'already-queued' }
    }

    return {
      shouldPrefetch: true,
      page: nextPage,
      priority: 'normal' as const,
      strategy: 'immediate' as const,
    }
  }
)

export const selectPreviousPagePrefetchRecommendation = createSelector(
  [
    selectPreviousPageNumber,
    selectIsPagePrefetched,
    selectIsPageInQueue,
    selectIsPrefetchEnabled,
    selectCanPrefetchMore,
  ],
  (
    prevPage,
    isPagePrefetched,
    isPageInQueue,
    prefetchEnabled,
    canPrefetchMore
  ) => {
    if (!prevPage || !prefetchEnabled || !canPrefetchMore) {
      return { shouldPrefetch: false, reason: 'conditions-not-met' }
    }

    const isPrefetched = isPagePrefetched
    const isQueued = isPageInQueue

    if (isPrefetched) {
      return { shouldPrefetch: false, reason: 'already-prefetched' }
    }

    if (isQueued) {
      return { shouldPrefetch: false, reason: 'already-queued' }
    }

    return {
      shouldPrefetch: true,
      page: prevPage,
      priority: 'low' as const,
      strategy: 'delayed' as const,
    }
  }
)

// Performance monitoring selectors - Memoization for React DevTools
export const selectPrefetchPerformanceMetrics = createSelector(
  [
    selectPrefetchQueueLength,
    selectActivePrefetchCount,
    selectFailedPrefetchCount,
    selectPrefetchedPages,
    selectCurrentPrefetchStrategy,
  ],
  (queueLength, activeCount, failedCount, prefetchedPages, strategy) => ({
    queueLength,
    activeCount,
    failedCount,
    prefetchedCount: prefetchedPages.length,
    strategy,
    efficiency:
      prefetchedPages.length > 0
        ? (prefetchedPages.length / (prefetchedPages.length + failedCount)) *
          100
        : 0,
    timestamp: Date.now(),
  })
)

// Debug selectors for development - Single Responsibility for debugging
export const selectPrefetchDebugInfo = createSelector(
  [
    selectEventsState,
    selectPrefetchPerformanceMetrics,
    selectCurrentPrefetchStrategy,
  ],
  (eventsState, metrics, strategy) => ({
    state: {
      prefetchQueue: eventsState.prefetchQueue || [],
      activePrefetches: eventsState.activePrefetches || {},
      networkStatus: eventsState.networkStatus,
      config: eventsState.prefetchConfig,
    },
    metrics,
    strategy,
    recommendations: {
      shouldOptimize: metrics.efficiency < 80,
      shouldReduceConcurrency: metrics.failedCount > 3,
      shouldIncreaseConcurrency:
        metrics.efficiency > 95 && metrics.activeCount < 2,
    },
  })
)

// Performance selector for event cards
export const selectEventCardData = createSelector(
  [selectFilteredEvents, selectSelectedEvent, selectIsLoading],
  (events, selectedEvent, isLoading) =>
    events.map(event => ({
      ...event,
      isSelected: selectedEvent?.slug === event.slug,
      isLoading,
    }))
)
