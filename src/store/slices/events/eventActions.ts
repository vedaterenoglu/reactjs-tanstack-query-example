import type { Event, PageCache } from '@/lib/types/event.types'

/**
 * Event Actions - Traditional Redux Action Definitions
 *
 * Design Patterns Applied:
 * 1. **Command Pattern**: Each action represents a command to modify state
 * 2. **Factory Pattern**: Action creators are factories that produce action objects
 * 3. **FSA Pattern**: Flux Standard Action pattern for consistent structure
 * 4. **Type Safety Pattern**: Strong TypeScript typing for all actions
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for action type definitions and creators
 * - **OCP**: New actions can be added without modifying existing ones
 * - **ISP**: Focused action interfaces for specific operations
 * - **DIP**: Actions depend on Event type abstractions
 *
 * Following traditional Redux naming convention and FSA pattern
 * Implements immutable action objects with TypeScript safety
 */

// Action Types - Following traditional Redux naming convention
export const EVENT_ACTIONS = {
  // Async action types for API operations
  FETCH_EVENTS_REQUEST: 'events/FETCH_EVENTS_REQUEST',
  FETCH_EVENTS_SUCCESS: 'events/FETCH_EVENTS_SUCCESS',
  FETCH_EVENTS_FAILURE: 'events/FETCH_EVENTS_FAILURE',

  // Individual event fetch
  FETCH_EVENT_REQUEST: 'events/FETCH_EVENT_REQUEST',
  FETCH_EVENT_SUCCESS: 'events/FETCH_EVENT_SUCCESS',
  FETCH_EVENT_FAILURE: 'events/FETCH_EVENT_FAILURE',

  // Search and filtering actions
  SET_SEARCH_QUERY: 'events/SET_SEARCH_QUERY',
  CLEAR_SEARCH: 'events/CLEAR_SEARCH',
  FILTER_EVENTS: 'events/FILTER_EVENTS',
  SET_CITY_FILTER: 'events/SET_CITY_FILTER',
  CLEAR_FILTERS: 'events/CLEAR_FILTERS',

  // Selection actions
  SELECT_EVENT: 'events/SELECT_EVENT',
  CLEAR_SELECTION: 'events/CLEAR_SELECTION',

  // Cache management
  INVALIDATE_CACHE: 'events/INVALIDATE_CACHE',
  SET_LAST_FETCHED: 'events/SET_LAST_FETCHED',

  // Pagination
  SET_PAGINATION: 'events/SET_PAGINATION',

  // Enhanced pagination actions
  SET_CURRENT_PAGE: 'events/SET_CURRENT_PAGE',
  SET_TOTAL_PAGES: 'events/SET_TOTAL_PAGES',
  CACHE_PAGE_RESULTS: 'events/CACHE_PAGE_RESULTS',
  INVALIDATE_PAGE_CACHE: 'events/INVALIDATE_PAGE_CACHE',
  SET_PREFETCHING_PAGE: 'events/SET_PREFETCHING_PAGE',
  MARK_PAGE_PREFETCHED: 'events/MARK_PAGE_PREFETCHED',
  SET_PAGE_CHANGING: 'events/SET_PAGE_CHANGING',
  CLEAR_PREFETCH_STATE: 'events/CLEAR_PREFETCH_STATE',
} as const

// Action Interfaces following FSA (Flux Standard Action) pattern

interface FetchEventsRequestAction {
  type: typeof EVENT_ACTIONS.FETCH_EVENTS_REQUEST
  meta?: {
    searchQuery?: string
    citySlug?: string
    refresh?: boolean
  }
}

interface FetchEventsSuccessAction {
  type: typeof EVENT_ACTIONS.FETCH_EVENTS_SUCCESS
  payload: {
    events: Event[]
    total?: number
    hasMore?: boolean
  }
}

interface FetchEventsFailureAction {
  type: typeof EVENT_ACTIONS.FETCH_EVENTS_FAILURE
  payload: {
    error: string
  }
  error: true
}

interface FetchEventRequestAction {
  type: typeof EVENT_ACTIONS.FETCH_EVENT_REQUEST
  meta: {
    eventSlug: string
  }
}

interface FetchEventSuccessAction {
  type: typeof EVENT_ACTIONS.FETCH_EVENT_SUCCESS
  payload: {
    event: Event
  }
}

interface FetchEventFailureAction {
  type: typeof EVENT_ACTIONS.FETCH_EVENT_FAILURE
  payload: {
    error: string
    eventSlug: string
  }
  error: true
}

interface SetSearchQueryAction {
  type: typeof EVENT_ACTIONS.SET_SEARCH_QUERY
  payload: {
    query: string
  }
}

interface ClearSearchAction {
  type: typeof EVENT_ACTIONS.CLEAR_SEARCH
}

interface FilterEventsAction {
  type: typeof EVENT_ACTIONS.FILTER_EVENTS
  payload: {
    filteredEvents: Event[]
  }
}

interface SetCityFilterAction {
  type: typeof EVENT_ACTIONS.SET_CITY_FILTER
  payload: {
    citySlug: string
  }
}

interface ClearFiltersAction {
  type: typeof EVENT_ACTIONS.CLEAR_FILTERS
}

interface SelectEventAction {
  type: typeof EVENT_ACTIONS.SELECT_EVENT
  payload: {
    event: Event
  }
}

interface ClearSelectionAction {
  type: typeof EVENT_ACTIONS.CLEAR_SELECTION
}

interface InvalidateCacheAction {
  type: typeof EVENT_ACTIONS.INVALIDATE_CACHE
}

interface SetLastFetchedAction {
  type: typeof EVENT_ACTIONS.SET_LAST_FETCHED
  payload: {
    timestamp: number
  }
}

interface SetPaginationAction {
  type: typeof EVENT_ACTIONS.SET_PAGINATION
  payload: {
    limit: number
    offset: number
    total?: number
  }
}

// Enhanced pagination action interfaces
interface SetCurrentPageAction {
  type: typeof EVENT_ACTIONS.SET_CURRENT_PAGE
  payload: {
    page: number
  }
}

interface SetTotalPagesAction {
  type: typeof EVENT_ACTIONS.SET_TOTAL_PAGES
  payload: {
    totalPages: number
  }
}

interface CachePageResultsAction {
  type: typeof EVENT_ACTIONS.CACHE_PAGE_RESULTS
  payload: {
    page: number
    cache: PageCache
  }
}

interface InvalidatePageCacheAction {
  type: typeof EVENT_ACTIONS.INVALIDATE_PAGE_CACHE
  payload: {
    page?: number // Optional: specific page, or all if undefined
  }
}

interface SetPrefetchingPageAction {
  type: typeof EVENT_ACTIONS.SET_PREFETCHING_PAGE
  payload: {
    page: number | null
  }
}

interface MarkPagePrefetchedAction {
  type: typeof EVENT_ACTIONS.MARK_PAGE_PREFETCHED
  payload: {
    page: number
  }
}

interface SetPageChangingAction {
  type: typeof EVENT_ACTIONS.SET_PAGE_CHANGING
  payload: {
    isChanging: boolean
  }
}

interface ClearPrefetchStateAction {
  type: typeof EVENT_ACTIONS.CLEAR_PREFETCH_STATE
}

// Union type for all event actions
export type EventAction =
  | FetchEventsRequestAction
  | FetchEventsSuccessAction
  | FetchEventsFailureAction
  | FetchEventRequestAction
  | FetchEventSuccessAction
  | FetchEventFailureAction
  | SetSearchQueryAction
  | ClearSearchAction
  | FilterEventsAction
  | SetCityFilterAction
  | ClearFiltersAction
  | SelectEventAction
  | ClearSelectionAction
  | InvalidateCacheAction
  | SetLastFetchedAction
  | SetPaginationAction
  | SetCurrentPageAction
  | SetTotalPagesAction
  | CachePageResultsAction
  | InvalidatePageCacheAction
  | SetPrefetchingPageAction
  | MarkPagePrefetchedAction
  | SetPageChangingAction
  | ClearPrefetchStateAction

// Action Creators - Pure functions that return actions
export const eventActionCreators = {
  // Async action creators (for thunks)
  fetchEventsRequest: (options?: {
    searchQuery?: string
    citySlug?: string
    refresh?: boolean
  }): FetchEventsRequestAction => {
    const action: FetchEventsRequestAction = {
      type: EVENT_ACTIONS.FETCH_EVENTS_REQUEST,
    }
    if (options) {
      action.meta = {
        ...(options.searchQuery !== undefined && {
          searchQuery: options.searchQuery,
        }),
        ...(options.citySlug !== undefined && { citySlug: options.citySlug }),
        ...(options.refresh !== undefined && { refresh: options.refresh }),
      }
    }
    return action
  },

  fetchEventsSuccess: (
    events: Event[],
    total?: number,
    hasMore?: boolean
  ): FetchEventsSuccessAction => ({
    type: EVENT_ACTIONS.FETCH_EVENTS_SUCCESS,
    payload: {
      events,
      ...(total !== undefined && { total }),
      ...(hasMore !== undefined && { hasMore }),
    },
  }),

  fetchEventsFailure: (error: string): FetchEventsFailureAction => ({
    type: EVENT_ACTIONS.FETCH_EVENTS_FAILURE,
    payload: { error },
    error: true,
  }),

  // Single event action creators
  fetchEventRequest: (eventSlug: string): FetchEventRequestAction => ({
    type: EVENT_ACTIONS.FETCH_EVENT_REQUEST,
    meta: { eventSlug },
  }),

  fetchEventSuccess: (event: Event): FetchEventSuccessAction => ({
    type: EVENT_ACTIONS.FETCH_EVENT_SUCCESS,
    payload: { event },
  }),

  fetchEventFailure: (
    error: string,
    eventSlug: string
  ): FetchEventFailureAction => ({
    type: EVENT_ACTIONS.FETCH_EVENT_FAILURE,
    payload: { error, eventSlug },
    error: true,
  }),

  // Search and filter action creators
  setSearchQuery: (query: string): SetSearchQueryAction => ({
    type: EVENT_ACTIONS.SET_SEARCH_QUERY,
    payload: { query },
  }),

  clearSearch: (): ClearSearchAction => ({
    type: EVENT_ACTIONS.CLEAR_SEARCH,
  }),

  filterEvents: (filteredEvents: Event[]): FilterEventsAction => ({
    type: EVENT_ACTIONS.FILTER_EVENTS,
    payload: { filteredEvents },
  }),

  setCityFilter: (citySlug: string): SetCityFilterAction => ({
    type: EVENT_ACTIONS.SET_CITY_FILTER,
    payload: { citySlug },
  }),

  clearFilters: (): ClearFiltersAction => ({
    type: EVENT_ACTIONS.CLEAR_FILTERS,
  }),

  // Selection action creators
  selectEvent: (event: Event): SelectEventAction => ({
    type: EVENT_ACTIONS.SELECT_EVENT,
    payload: { event },
  }),

  clearSelection: (): ClearSelectionAction => ({
    type: EVENT_ACTIONS.CLEAR_SELECTION,
  }),

  // Cache management action creators
  invalidateCache: (): InvalidateCacheAction => ({
    type: EVENT_ACTIONS.INVALIDATE_CACHE,
  }),

  setLastFetched: (timestamp: number): SetLastFetchedAction => ({
    type: EVENT_ACTIONS.SET_LAST_FETCHED,
    payload: { timestamp },
  }),

  // Pagination action creators
  setPagination: (
    limit: number,
    offset: number,
    total?: number
  ): SetPaginationAction => ({
    type: EVENT_ACTIONS.SET_PAGINATION,
    payload: {
      limit,
      offset,
      ...(total !== undefined && { total }),
    },
  }),

  // Enhanced pagination action creators
  setCurrentPage: (page: number): SetCurrentPageAction => ({
    type: EVENT_ACTIONS.SET_CURRENT_PAGE,
    payload: { page },
  }),

  setTotalPages: (totalPages: number): SetTotalPagesAction => ({
    type: EVENT_ACTIONS.SET_TOTAL_PAGES,
    payload: { totalPages },
  }),

  cachePageResults: (
    page: number,
    cache: PageCache
  ): CachePageResultsAction => ({
    type: EVENT_ACTIONS.CACHE_PAGE_RESULTS,
    payload: { page, cache },
  }),

  invalidatePageCache: (page?: number): InvalidatePageCacheAction => ({
    type: EVENT_ACTIONS.INVALIDATE_PAGE_CACHE,
    payload: page !== undefined ? { page } : {},
  }),

  setPrefetchingPage: (page: number | null): SetPrefetchingPageAction => ({
    type: EVENT_ACTIONS.SET_PREFETCHING_PAGE,
    payload: { page },
  }),

  markPagePrefetched: (page: number): MarkPagePrefetchedAction => ({
    type: EVENT_ACTIONS.MARK_PAGE_PREFETCHED,
    payload: { page },
  }),

  setPageChanging: (isChanging: boolean): SetPageChangingAction => ({
    type: EVENT_ACTIONS.SET_PAGE_CHANGING,
    payload: { isChanging },
  }),

  clearPrefetchState: (): ClearPrefetchStateAction => ({
    type: EVENT_ACTIONS.CLEAR_PREFETCH_STATE,
  }),
}
