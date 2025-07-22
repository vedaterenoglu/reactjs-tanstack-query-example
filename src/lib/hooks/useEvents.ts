import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { EventsQueryParams } from '@/lib/types/event.types'
import type { AppDispatch } from '@/store'
import {
  fetchEvents,
  fetchEventBySlug,
  refreshEvents,
  searchEvents,
  filterEventsByCity,
  clearSearch,
  clearFilters,
  selectEvent,
  initializeEvents,
  loadMoreEvents,
  retryEventOperation,
  selectEvents,
  selectFilteredEvents,
  selectSelectedEvent,
  selectSearchQuery,
  selectCityFilter,
  selectIsLoading,
  selectError,
  selectHasData,
  selectHasResults,
  selectShouldRefresh,
  selectEventsCount,
  selectFilteredEventsCount,
  selectHasActiveFilters,
  selectPagination,
  selectHasMore,
  selectSearchContext,
} from '@/store/slices/events'

/**
 * Custom Hooks for Event State Management
 * 
 * Design Patterns Applied:
 * 1. **Custom Hook Pattern**: Extracts stateful logic into reusable hooks
 * 2. **Facade Pattern**: Hides Redux complexity behind clean component API
 * 3. **Observer Pattern**: Components observe specific state slices through selectors
 * 4. **Command Pattern**: Hook methods dispatch Redux actions as commands
 * 5. **Composition Pattern**: Multiple focused hooks for different use cases
 *
 * SOLID Principles:
 * - **SRP**: Each hook has single responsibility for specific event operations
 * - **OCP**: New hooks can be added without modifying existing ones
 * - **LSP**: All hooks follow consistent React hook patterns
 * - **ISP**: Focused hook interfaces for specific component needs
 * - **DIP**: Components depend on hook abstractions, not Redux directly
 *
 * React 19 Patterns:
 * - Custom Hook Pattern for business logic extraction
 * - Performance optimization through memoized selectors
 * - Clean separation of concerns (data/UI)
 * - Reusable stateful logic across components
 */

/**
 * Main events hook - comprehensive event state management
 * Provides complete access to events data and operations
 * Perfect for main event list components
 */
export const useEvents = () => {
  const dispatch = useDispatch<AppDispatch>()

  // Memoized selectors following Observer Pattern
  const events = useSelector(selectEvents)
  const filteredEvents = useSelector(selectFilteredEvents)
  const selectedEvent = useSelector(selectSelectedEvent)
  const searchQuery = useSelector(selectSearchQuery)
  const cityFilter = useSelector(selectCityFilter)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)
  const hasData = useSelector(selectHasData)
  const hasResults = useSelector(selectHasResults)
  const shouldRefresh = useSelector(selectShouldRefresh)
  const eventsCount = useSelector(selectEventsCount)
  const filteredEventsCount = useSelector(selectFilteredEventsCount)
  const hasActiveFilters = useSelector(selectHasActiveFilters)
  const pagination = useSelector(selectPagination)
  const hasMore = useSelector(selectHasMore)

  // Memoized action dispatchers following Command Pattern
  const fetchEventsData = useCallback(
    (params?: EventsQueryParams) => dispatch(fetchEvents(params)),
    [dispatch]
  )

  const fetchEventBySlugData = useCallback(
    (slug: string) => dispatch(fetchEventBySlug(slug)),
    [dispatch]
  )

  const refreshEventsData = useCallback(
    () => dispatch(refreshEvents()),
    [dispatch]
  )

  const searchEventsData = useCallback(
    (query: string) => dispatch(searchEvents(query)),
    [dispatch]
  )

  const filterEventsByCityData = useCallback(
    (citySlug: string) => dispatch(filterEventsByCity(citySlug)),
    [dispatch]
  )

  const clearSearchData = useCallback(
    () => dispatch(clearSearch()),
    [dispatch]
  )

  const clearFiltersData = useCallback(
    () => dispatch(clearFilters()),
    [dispatch]
  )

  const selectEventData = useCallback(
    (eventSlug: string) => dispatch(selectEvent(eventSlug)),
    [dispatch]
  )

  const initializeEventsData = useCallback(
    () => dispatch(initializeEvents()),
    [dispatch]
  )

  const loadMoreEventsData = useCallback(
    () => dispatch(loadMoreEvents()),
    [dispatch]
  )

  const retryEventOperationData = useCallback(
    (lastOperation?: 'fetch' | 'search' | 'filter', query?: string, citySlug?: string) =>
      dispatch(retryEventOperation(lastOperation, query, citySlug)),
    [dispatch]
  )

  // Convenience method for refetching
  const refetch = useCallback(() => {
    return refreshEventsData()
  }, [refreshEventsData])

  return {
    // State data
    events,
    filteredEvents,
    selectedEvent,
    searchQuery,
    cityFilter,
    isLoading,
    error,
    hasData,
    hasResults,
    shouldRefresh,
    eventsCount,
    filteredEventsCount,
    hasActiveFilters,
    pagination,
    hasMore,

    // Action dispatchers
    fetchEvents: fetchEventsData,
    fetchEventBySlug: fetchEventBySlugData,
    refreshEvents: refreshEventsData,
    searchEvents: searchEventsData,
    filterEventsByCity: filterEventsByCityData,
    clearSearch: clearSearchData,
    clearFilters: clearFiltersData,
    selectEvent: selectEventData,
    initializeEvents: initializeEventsData,
    loadMoreEvents: loadMoreEventsData,
    retryOperation: retryEventOperationData,
    refetch, // Alias for refreshEvents
  }
}

/**
 * Hook for event search functionality
 * Focused on search-specific operations following SRP
 * Provides optimized interface for search components
 */
export const useEventSearch = () => {
  const dispatch = useDispatch<AppDispatch>()

  const searchContext = useSelector(selectSearchContext)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)

  const search = useCallback(
    (query: string) => dispatch(searchEvents(query)),
    [dispatch]
  )

  const clearSearchQuery = useCallback(
    () => dispatch(clearSearch()),
    [dispatch]
  )

  const retrySearch = useCallback(
    () => {
      if (searchContext.searchQuery) {
        dispatch(retryEventOperation('search', searchContext.searchQuery))
      }
    },
    [dispatch, searchContext.searchQuery]
  )

  return {
    searchQuery: searchContext.searchQuery,
    filteredEvents: searchContext.filteredCount,
    totalEvents: searchContext.totalCount,
    isSearchActive: searchContext.isSearchActive,
    hasResults: searchContext.hasResults,
    isLoading,
    error,
    search,
    clearSearch: clearSearchQuery,
    retrySearch,
  }
}

/**
 * Hook for event selection functionality
 * Encapsulates selection logic following SRP
 * Optimized for event card and detail components
 */
export const useEventSelection = () => {
  const dispatch = useDispatch<AppDispatch>()

  const selectedEvent = useSelector(selectSelectedEvent)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)

  const selectEventById = useCallback(
    (eventSlug: string) => dispatch(selectEvent(eventSlug)),
    [dispatch]
  )

  const clearSelection = useCallback(
    () => dispatch({ type: 'events/CLEAR_SELECTION' }),
    [dispatch]
  )

  const fetchEventDetails = useCallback(
    (eventSlug: string) => dispatch(fetchEventBySlug(eventSlug)),
    [dispatch]
  )

  return {
    selectedEvent,
    isLoading,
    error,
    selectEvent: selectEventById,
    clearSelection,
    fetchEventDetails,
  }
}

/**
 * Hook for event filtering functionality
 * Handles city-based filtering and filter management
 * Optimized for filter UI components
 */
export const useEventFilters = () => {
  const dispatch = useDispatch<AppDispatch>()

  const cityFilter = useSelector(selectCityFilter)
  const searchQuery = useSelector(selectSearchQuery)
  const hasActiveFilters = useSelector(selectHasActiveFilters)
  const filteredEvents = useSelector(selectFilteredEvents)
  const isLoading = useSelector(selectIsLoading)

  const setCityFilter = useCallback(
    (citySlug: string) => dispatch(filterEventsByCity(citySlug)),
    [dispatch]
  )

  const clearCityFilter = useCallback(
    () => dispatch(clearFilters()),
    [dispatch]
  )

  const clearAllFilters = useCallback(
    () => dispatch(clearFilters()),
    [dispatch]
  )

  return {
    cityFilter,
    searchQuery,
    hasActiveFilters,
    filteredEvents,
    isLoading,
    setCityFilter,
    clearCityFilter,
    clearAllFilters,
  }
}

/**
 * Hook for event data initialization
 * Handles app startup and data refresh scenarios
 * Implements smart loading with error recovery
 */
export const useEventInitialization = () => {
  const dispatch = useDispatch<AppDispatch>()

  const hasData = useSelector(selectHasData)
  const shouldRefresh = useSelector(selectShouldRefresh)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)

  const initialize = useCallback(() => {
    dispatch(initializeEvents())
  }, [dispatch])

  const refresh = useCallback(() => dispatch(refreshEvents()), [dispatch])

  const retry = useCallback(
    () => dispatch(retryEventOperation('fetch')),
    [dispatch]
  )

  // Auto-initialize on mount if needed
  useEffect(() => {
    if (!hasData && !isLoading && !error) {
      initialize()
    }
  }, [hasData, isLoading, error, initialize])

  return {
    hasData,
    shouldRefresh,
    isLoading,
    error,
    initialize,
    refresh,
    retry,
  }
}

/**
 * Hook for event data with automatic initialization
 * High-level hook combining data access and initialization
 * Perfect for main components that need complete event functionality
 */
export const useEventsWithInit = () => {
  const eventData = useEvents()
  const { shouldRefresh } = useEventInitialization()


  // Auto-refresh stale data
  useEffect(() => {
    if (shouldRefresh && !eventData.isLoading) {
      eventData.refreshEvents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRefresh, eventData.isLoading, eventData.refreshEvents])

  // Initialization is handled by useEventInitialization hook
  // Removing duplicate useEffect to prevent infinite loop

  return eventData
}

/**
 * Hook for individual event lookup
 * Optimized for components that work with specific events
 * Returns event data by slug with selection capabilities
 */
export const useEvent = (eventSlug?: string) => {
  const events = useSelector(selectEvents)
  const selectedEvent = useSelector(selectSelectedEvent)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)

  // Find specific event by slug
  const event = eventSlug ? events.find(e => e.slug === eventSlug) : undefined

  // Determine if this event is currently selected
  const isSelected = selectedEvent?.slug === eventSlug

  return {
    event,
    isSelected,
    selectedEvent,
    isLoading,
    error,
    exists: Boolean(event),
  }
}

/**
 * Hook for event pagination
 * Handles loading more events and pagination state
 * Optimized for infinite scroll or pagination components
 */
export const useEventPagination = () => {
  const dispatch = useDispatch<AppDispatch>()

  const pagination = useSelector(selectPagination)
  const hasMore = useSelector(selectHasMore)
  const isLoading = useSelector(selectIsLoading)

  const loadMore = useCallback(
    () => dispatch(loadMoreEvents()),
    [dispatch]
  )

  return {
    pagination,
    hasMore,
    isLoading,
    loadMore,
    currentPage: pagination ? Math.floor(pagination.offset / pagination.limit) + 1 : 1,
    totalPages: pagination?.total ? Math.ceil(pagination.total / pagination.limit) : 1,
  }
}