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

export const selectUpcomingEvents = createSelector(
  [selectEvents],
  events => {
    const now = new Date()
    return events
      .filter(event => new Date(event.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
)

export const selectEventsByDateRange = createSelector(
  [selectEvents, (_state: RootState, startDate: Date, endDate: Date) => ({ startDate, endDate })],
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
  [selectSearchQuery, selectCityFilter, selectFilteredEventsCount, selectEventsCount],
  (searchQuery, cityFilter, filteredCount, totalCount) => ({
    searchQuery,
    cityFilter,
    filteredCount,
    totalCount,
    isSearchActive: Boolean(searchQuery || cityFilter),
    hasResults: filteredCount > 0,
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