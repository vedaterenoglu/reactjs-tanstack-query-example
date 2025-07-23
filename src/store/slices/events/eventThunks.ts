import type { EventsQueryParams } from '@/lib/types/event.types'
import { eventApiService } from '@/services/api/facades/eventApi'
import type { AppThunk } from '@/store'

import { eventActionCreators } from './eventActions'
import {
  selectCacheAge,
  selectIsCacheStale,
  selectEvents,
  selectCityFilter,
  selectSearchQuery,
  // Enhanced pagination selectors
  selectCurrentPage,
  selectItemsPerPage,
  selectTotalPages,
  selectIsPageCached,
  selectCachedPageData,
  selectNextPageNumber,
  selectPreviousPageNumber,
  selectIsChangingPage,
  selectPrefetchingPage,
} from './eventSelectors'

/**
 * Event Thunks - Async action creators using Redux Thunk
 *
 * Design Patterns Applied:
 * 1. **Thunk Pattern**: Handles async operations in Redux environment
 * 2. **Command Pattern**: Each thunk encapsulates a specific async command
 * 3. **Facade Pattern**: Uses eventApiService to abstract HTTP complexity
 * 4. **Error Handling Pattern**: Consistent error transformation and recovery
 * 5. **Cache Strategy Pattern**: Smart caching to minimize API calls
 *
 * SOLID Principles:
 * - **SRP**: Each thunk handles one specific async operation
 * - **OCP**: New thunks can be added without modifying existing ones
 * - **LSP**: All thunks follow (dispatch, getState) => Promise pattern
 * - **ISP**: Focused thunk interfaces for specific operations
 * - **DIP**: Depends on eventApiService abstraction, not HTTP client
 *
 * Performance Features:
 * - Cache-aware fetching to avoid redundant API calls
 * - Local filtering for better search performance
 * - Smart initialization with cache validation
 * - Error recovery mechanisms for network issues
 */

/**
 * Fetch all events with optional search/filtering and pagination
 * Implements intelligent caching strategy to avoid unnecessary API calls
 */
export const fetchEvents = (params?: EventsQueryParams): AppThunk => {
  return async (dispatch, getState) => {
    try {
      // Check cache validity - avoid redundant API calls
      const state = getState()
      const isCacheStale = selectIsCacheStale(state)
      const currentEvents = selectEvents(state)

      // Skip fetch if cache is fresh and no specific parameters
      if (
        !isCacheStale &&
        currentEvents.length > 0 &&
        !params?.search &&
        !params?.city
      ) {
        return
      }

      // Dispatch request action to show loading state
      const requestMeta: {
        searchQuery?: string
        citySlug?: string
        refresh?: boolean
      } = {}

      if (params?.search) requestMeta.searchQuery = params.search
      if (params?.city) requestMeta.citySlug = params.city
      if (params) requestMeta.refresh = true

      dispatch(
        eventActionCreators.fetchEventsRequest(
          Object.keys(requestMeta).length > 0 ? requestMeta : undefined
        )
      )

      // Call API facade - abstracts HTTP implementation details
      const response = await eventApiService.getEvents(params)

      // Dispatch success action with fetched data
      dispatch(
        eventActionCreators.fetchEventsSuccess(
          response.data,
          response.pagination?.total
        )
      )

      // Update pagination if provided
      if (params?.limit || params?.offset) {
        dispatch(
          eventActionCreators.setPagination(
            params.limit || 12,
            params.offset || 0,
            response.pagination?.total
          )
        )
      }

      // Update search query state if search parameter provided
      if (params?.search) {
        dispatch(eventActionCreators.setSearchQuery(params.search))
        // Trust server-side filtering - response.data already contains filtered results
        dispatch(eventActionCreators.filterEvents(response.data))
      }

      // Update city filter state if city parameter provided
      if (params?.city) {
        dispatch(eventActionCreators.setCityFilter(params.city))
        // Trust server-side filtering - response.data already contains filtered results
        dispatch(eventActionCreators.filterEvents(response.data))
      }
    } catch (error) {
      console.error('[fetchEvents] API call failed:', error)

      // Transform error to user-friendly message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch events. Please try again.'

      dispatch(eventActionCreators.fetchEventsFailure(errorMessage))

      // Re-throw for component-level error handling if needed
      throw error
    }
  }
}

/**
 * Fetch a single event by slug
 * Updates both events list and selected event state
 */
export const fetchEventBySlug = (slug: string): AppThunk => {
  return async (dispatch, getState) => {
    try {
      // Check if event already exists in state
      const state = getState()
      const currentEvents = selectEvents(state)
      const existingEvent = currentEvents.find(event => event.slug === slug)

      if (existingEvent) {
        dispatch(eventActionCreators.selectEvent(existingEvent))
        return existingEvent
      }

      // Dispatch request action
      dispatch(eventActionCreators.fetchEventRequest(slug))

      // Fetch from API
      const event = await eventApiService.getEventBySlug(slug)

      // Dispatch success action
      dispatch(eventActionCreators.fetchEventSuccess(event))

      return event
    } catch (error) {
      console.error('[fetchEventBySlug] API call failed:', error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to fetch event: ${slug}`

      dispatch(eventActionCreators.fetchEventFailure(errorMessage, slug))
      throw error
    }
  }
}

/**
 * Refresh events data - force fetch bypassing cache
 * Used when user explicitly requests fresh data
 */
export const refreshEvents = (): AppThunk => {
  return async dispatch => {
    // Invalidate cache first
    dispatch(eventActionCreators.invalidateCache())

    // Fetch fresh data
    return dispatch(fetchEvents())
  }
}

/**
 * Search events by query - implements backend search via API
 * Always fetches from server to get accurate filtered results
 */
export const searchEvents = (query: string): AppThunk => {
  return async dispatch => {
    try {
      // Update search query in state
      dispatch(eventActionCreators.setSearchQuery(query))

      // Always fetch from backend with search parameter for accurate results
      const fetchParams = {
        search: query,
        limit: 50, // Get more results for search
        offset: 0,
        sortBy: 'date' as const,
        order: 'asc' as const,
      }

      return dispatch(fetchEvents(fetchParams))
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Search failed. Please try again.'

      dispatch(eventActionCreators.fetchEventsFailure(errorMessage))
      throw error
    }
  }
}

/**
 * Filter events by city
 * Combines with existing search if active
 */
export const filterEventsByCity = (citySlug: string): AppThunk => {
  return async (dispatch, getState) => {
    try {
      // Update city filter in state
      dispatch(eventActionCreators.setCityFilter(citySlug))

      const state = getState()
      const allEvents = selectEvents(state)
      const searchQuery = selectSearchQuery(state)

      // No events loaded yet - fetch with city filter
      if (allEvents.length === 0) {
        return dispatch(
          fetchEvents({
            city: citySlug,
            limit: 12,
            offset: 0,
            sortBy: 'date',
            order: 'asc',
          })
        )
      }

      // Start with city-filtered events
      let filteredEvents = eventApiService.filterEventsByCity(
        allEvents,
        citySlug
      )

      // Apply search filter if active
      if (searchQuery.trim()) {
        filteredEvents = eventApiService.searchEventsLocally(
          filteredEvents,
          searchQuery
        )
      }

      dispatch(eventActionCreators.filterEvents(filteredEvents))
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to filter events by city.'

      dispatch(eventActionCreators.fetchEventsFailure(errorMessage))
      throw error
    }
  }
}

/**
 * Clear all filters and show all events
 * Resets both search and city filters
 */
export const clearFilters = (): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(eventActionCreators.clearFilters())

    const state = getState()
    const allEvents = selectEvents(state)

    // Restore full list as filtered list
    dispatch(eventActionCreators.filterEvents(allEvents))
  }
}

/**
 * Clear search filter only, keep city filter if active
 */
export const clearSearch = (): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(eventActionCreators.clearSearch())

    const state = getState()
    const allEvents = selectEvents(state)
    const cityFilter = selectCityFilter(state)

    // Apply city filter if still active, otherwise show all
    if (cityFilter) {
      const filteredEvents = eventApiService.filterEventsByCity(
        allEvents,
        cityFilter
      )
      dispatch(eventActionCreators.filterEvents(filteredEvents))
    } else {
      dispatch(eventActionCreators.filterEvents(allEvents))
    }
  }
}

/**
 * Select an event for detailed view or further actions
 * Implements selection state management
 */
export const selectEvent = (eventSlug: string): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const state = getState()
      const events = selectEvents(state)

      // Find event in local state first
      const event = events.find(e => e.slug === eventSlug)

      if (event) {
        dispatch(eventActionCreators.selectEvent(event))
        return event
      }

      // Event not found locally - fetch from API
      return dispatch(fetchEventBySlug(eventSlug))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to select event'

      dispatch(eventActionCreators.fetchEventsFailure(errorMessage))
      throw error
    }
  }
}

/**
 * Initialize events data - load on app startup or page load
 * Implements smart loading with cache awareness
 */
export const initializeEvents = (): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const state = getState()
      const cacheAge = selectCacheAge(state)
      const currentEvents = selectEvents(state)
      const searchQuery = selectSearchQuery(state)
      const cityFilter = selectCityFilter(state)

      // Don't initialize if there's an active search or city filter
      if (searchQuery || cityFilter) {
        return
      }

      // Load fresh data if no cache or cache is very old (> 1 hour)
      const INITIALIZATION_CACHE_LIMIT = 60 * 60 * 1000 // 1 hour
      const shouldInitialize =
        !cacheAge ||
        cacheAge > INITIALIZATION_CACHE_LIMIT ||
        currentEvents.length === 0

      if (shouldInitialize) {
        dispatch(fetchEvents())
      }
    } catch (error) {
      // Don't throw on initialization - app should still work
      console.error('[initializeEvents] Failed to initialize events:', error)
    }
  }
}

/**
 * Load more events - implements pagination
 * Appends new events to existing list
 */
export const loadMoreEvents = (): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const state = getState()
      const currentEvents = selectEvents(state)
      const searchQuery = selectSearchQuery(state)
      const cityFilter = selectCityFilter(state)

      // Calculate next offset
      const limit = 12
      const offset = currentEvents.length

      const params: EventsQueryParams = {
        limit,
        offset,
        sortBy: 'date',
        order: 'asc',
        ...(searchQuery && { search: searchQuery }),
        ...(cityFilter && { city: cityFilter }),
      }

      // Fetch more events
      const response = await eventApiService.getEvents(params)

      // Append to existing events
      const allEvents = [...currentEvents, ...response.data]
      dispatch(
        eventActionCreators.fetchEventsSuccess(
          allEvents,
          response.pagination?.total
        )
      )

      // Update pagination
      dispatch(
        eventActionCreators.setPagination(
          limit,
          offset,
          response.pagination?.total
        )
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load more events.'

      dispatch(eventActionCreators.fetchEventsFailure(errorMessage))
      throw error
    }
  }
}

// Debounce timers for pagination operations
let pageChangeDebounceTimer: NodeJS.Timeout | null = null
let prefetchDebounceTimer: NodeJS.Timeout | null = null

/**
 * Enhanced pagination thunks with caching and prefetching
 */

/**
 * Fetch specific page with caching support
 * Core pagination function that handles API calls and caching
 */
export const fetchEventsPage = (
  page: number,
  options: {
    useCache?: boolean
    isPrefetch?: boolean
  } = {}
): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const { useCache = true, isPrefetch = false } = options
      const state = getState()

      // Check if page is already cached and cache is valid
      if (useCache && selectIsPageCached(state, page)) {
        const cachedData = selectCachedPageData(state, page)
        if (cachedData) {
          // Use cached data
          dispatch(eventActionCreators.fetchEventsSuccess(cachedData.events))
          return cachedData.events
        }
      }

      const itemsPerPage = selectItemsPerPage(state)
      const offset = (page - 1) * itemsPerPage

      // Mark as prefetching if background operation
      if (isPrefetch) {
        dispatch(eventActionCreators.setPrefetchingPage(page))
      }

      const params: EventsQueryParams = {
        limit: itemsPerPage,
        offset,
        sortBy: 'date',
        order: 'asc',
      }

      const response = await eventApiService.getEvents(params)

      // Cache the results
      dispatch(
        eventActionCreators.cachePageResults(page, {
          events: response.data,
          timestamp: Date.now(),
        })
      )

      // Mark as prefetched if background operation
      if (isPrefetch) {
        dispatch(eventActionCreators.markPagePrefetched(page))
      } else {
        // Update main events list for current page
        dispatch(
          eventActionCreators.fetchEventsSuccess(
            response.data,
            response.pagination?.total
          )
        )
      }

      return response.data
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch events page'

      // Only dispatch failure for non-prefetch operations
      if (!options.isPrefetch) {
        dispatch(eventActionCreators.fetchEventsFailure(errorMessage))
      }

      // Reset prefetching state on error
      dispatch(eventActionCreators.setPrefetchingPage(null))
      throw error
    }
  }
}

/**
 * Change to specific page with loading states and prefetching
 * Main navigation function with debouncing and cache management
 */
export const changePage = (targetPage: number): AppThunk => {
  return async (dispatch, getState) => {
    try {
      // Debounce rapid page changes
      if (pageChangeDebounceTimer) {
        clearTimeout(pageChangeDebounceTimer)
      }

      return new Promise<void>((resolve, reject) => {
        pageChangeDebounceTimer = setTimeout(async () => {
          try {
            const state = getState()
            const currentPage = selectCurrentPage(state)
            const totalPages = selectTotalPages(state)
            const isChanging = selectIsChangingPage(state)

            // Validate page number
            if (
              targetPage < 1 ||
              targetPage > totalPages ||
              targetPage === currentPage ||
              isChanging
            ) {
              resolve()
              return
            }

            // Set changing state
            dispatch(eventActionCreators.setPageChanging(true))
            dispatch(eventActionCreators.setCurrentPage(targetPage))

            // Fetch page data
            await dispatch(fetchEventsPage(targetPage, { useCache: true }))

            // Prefetch adjacent pages in background
            dispatch(prefetchAdjacentPages(targetPage))

            // Reset changing state
            dispatch(eventActionCreators.setPageChanging(false))

            resolve()
          } catch (error) {
            dispatch(eventActionCreators.setPageChanging(false))
            reject(error)
          }
        }, 300) // 300ms debounce
      })
    } catch (error) {
      dispatch(eventActionCreators.setPageChanging(false))
      throw error
    }
  }
}

/**
 * Navigate to next page
 */
export const goToNextPage = (): AppThunk => {
  return async (dispatch, getState) => {
    const state = getState()
    const nextPage = selectNextPageNumber(state)

    if (nextPage) {
      return dispatch(changePage(nextPage))
    }
  }
}

/**
 * Navigate to previous page
 */
export const goToPreviousPage = (): AppThunk => {
  return async (dispatch, getState) => {
    const state = getState()
    const prevPage = selectPreviousPageNumber(state)

    if (prevPage) {
      return dispatch(changePage(prevPage))
    }
  }
}

/**
 * Prefetch adjacent pages in background
 * Smart prefetching strategy for better UX
 */
export const prefetchAdjacentPages = (currentPage: number): AppThunk => {
  return async (dispatch, getState) => {
    // Debounce prefetch operations
    if (prefetchDebounceTimer) {
      clearTimeout(prefetchDebounceTimer)
    }

    prefetchDebounceTimer = setTimeout(async () => {
      try {
        const state = getState()
        const totalPages = selectTotalPages(state)
        const prefetchingPage = selectPrefetchingPage(state)

        // Don't prefetch if already prefetching
        if (prefetchingPage) return

        const pagesToPrefetch: number[] = []

        // Prefetch next page
        if (currentPage < totalPages) {
          pagesToPrefetch.push(currentPage + 1)
        }

        // Prefetch previous page
        if (currentPage > 1) {
          pagesToPrefetch.push(currentPage - 1)
        }

        // Prefetch pages that aren't cached
        for (const page of pagesToPrefetch) {
          const stateForPage = getState() // Fresh state for each check
          if (!selectIsPageCached(stateForPage, page)) {
            try {
              await dispatch(fetchEventsPage(page, { isPrefetch: true }))
              // Small delay between prefetches to avoid overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 100))
            } catch {
              // Silently fail prefetch operations
            }
          }
        }
      } catch {
        // Background prefetch failed silently
      }
    }, 500) // 500ms delay for prefetching
  }
}

/**
 * Invalidate page cache
 * Clear cached pages when data becomes stale
 */
export const invalidatePageCache = (page?: number): AppThunk => {
  return async dispatch => {
    dispatch(eventActionCreators.invalidatePageCache(page))

    // Clear prefetch state if invalidating all pages
    if (page === undefined) {
      dispatch(eventActionCreators.clearPrefetchState())
    }
  }
}

/**
 * Initialize pagination system
 * Set up initial page state and prefetch first pages
 */
export const initializePagination = (): AppThunk => {
  return async dispatch => {
    try {
      // Start with page 1
      dispatch(eventActionCreators.setCurrentPage(1))

      // Fetch first page
      await dispatch(fetchEventsPage(1, { useCache: false }))

      // Prefetch page 2 in background
      dispatch(prefetchAdjacentPages(1))
    } catch (error) {
      console.error(
        '[initializePagination] Failed to initialize pagination:',
        error
      )
      // Don't throw - let the app continue with basic functionality
    }
  }
}

/**
 * Retry failed operations
 * Provides user recovery mechanism for network issues
 */
export const retryEventOperation = (
  lastOperation?: 'fetch' | 'search' | 'filter',
  query?: string,
  citySlug?: string
): AppThunk => {
  return async dispatch => {
    switch (lastOperation) {
      case 'search':
        if (query) {
          return dispatch(searchEvents(query))
        }
        break
      case 'filter':
        if (citySlug) {
          return dispatch(filterEventsByCity(citySlug))
        }
        break
      case 'fetch':
      default:
        return dispatch(fetchEvents())
    }
  }
}
