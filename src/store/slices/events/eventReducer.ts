import { REHYDRATE } from 'redux-persist'

import type { EventsState } from '@/lib/types/event.types'

import { EVENT_ACTIONS, type EventAction } from './eventActions'

import type { Action } from 'redux'

/**
 * Event Reducer - Traditional Redux Reducer with Immutable State Updates
 *
 * Design Patterns Applied:
 * 1. **State Pattern**: Manages different application states (loading, success, error, idle)
 * 2. **Immutable Update Pattern**: Never mutates state directly, returns new state objects
 * 3. **Switch Statement Pattern**: Clean action type handling with exhaustive cases
 * 4. **Command Pattern**: Each action represents a command to transform state
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for event state transformations
 * - **OCP**: New action handlers can be added without modifying existing ones
 * - **LSP**: Follows Redux reducer contract (state, action) => newState
 * - **ISP**: Focused EventsState interface with necessary properties only
 * - **DIP**: Depends on EventAction abstractions, not concrete implementations
 *
 * Performance Optimizations:
 * - Immutable updates prevent unnecessary re-renders
 * - Spread operator for shallow copies
 * - Direct property updates for primitives
 * - Proper Redux Persist integration
 */

// Initial state following EventsState interface with enhanced pagination
const initialState: EventsState = {
  // Existing state
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  searchQuery: '',
  cityFilter: undefined,
  isLoading: false,
  error: null,
  lastFetched: null,
  pagination: null,

  // Enhanced pagination state
  currentPage: 1,
  itemsPerPage: 12, // Fixed at 12 events per page
  totalPages: 0,

  // Page caching system
  cachedPages: {},

  // Prefetch state
  prefetchingPage: null,
  prefetchedPages: [],

  // Enhanced prefetch features
  prefetchQueue: [],
  activePrefetches: {},
  networkStatus: {
    isOnline: true,
    connectionSpeed: 'unknown',
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

  // UI state
  isChangingPage: false,
}

/**
 * Event Reducer - Pure function handling event state transitions
 * Follows traditional Redux pattern with immutable state updates
 * Implements Single Responsibility Principle - only handles event state
 */
export function eventReducer(
  state: EventsState = initialState,
  action: Action
): EventsState {
  switch (action.type) {
    // Redux Persist rehydration
    case REHYDRATE: {
      const rehydrateAction = action as Action & {
        payload?: { events?: EventsState }
      }
      const persistedEventState = rehydrateAction.payload?.events

      if (persistedEventState) {
        return {
          ...initialState, // Start with complete initial state
          ...persistedEventState, // Override with persisted values
          isLoading: false, // Reset loading state after rehydration
          error: null,
        }
      }
      return {
        ...state,
        isLoading: false, // Always reset loading after rehydration
        error: null,
      }
    }

    // Events list async operations
    case EVENT_ACTIONS.FETCH_EVENTS_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case EVENT_ACTIONS.FETCH_EVENTS_SUCCESS: {
      const successAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.FETCH_EVENTS_SUCCESS
      }

      // Calculate total pages when we have total count
      const totalPages =
        successAction.payload.total !== undefined
          ? Math.ceil(successAction.payload.total / state.itemsPerPage)
          : state.totalPages

      const newState = {
        ...state,
        events: successAction.payload.events,
        filteredEvents: successAction.payload.events,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
        totalPages,
        pagination:
          successAction.payload.total !== undefined
            ? {
                limit: state.pagination?.limit || state.itemsPerPage,
                offset: state.pagination?.offset || 0,
                total: successAction.payload.total,
                hasMore: successAction.payload.hasMore,
              }
            : state.pagination,
      }

      return newState
    }

    case EVENT_ACTIONS.FETCH_EVENTS_FAILURE: {
      const failureAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.FETCH_EVENTS_FAILURE
      }
      return {
        ...state,
        isLoading: false,
        error: failureAction.payload.error,
        events: [],
        filteredEvents: [],
      }
    }

    // Single event async operations
    case EVENT_ACTIONS.FETCH_EVENT_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case EVENT_ACTIONS.FETCH_EVENT_SUCCESS: {
      const successAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.FETCH_EVENT_SUCCESS
      }
      const newEvent = successAction.payload.event

      // Check if event already exists in the list
      const existingEventIndex = state.events.findIndex(
        e => e.slug === newEvent.slug
      )
      const updatedEvents =
        existingEventIndex >= 0
          ? state.events.map((event, index) =>
              index === existingEventIndex ? newEvent : event
            )
          : [...state.events, newEvent]

      return {
        ...state,
        events: updatedEvents,
        filteredEvents:
          state.searchQuery || state.cityFilter
            ? state.filteredEvents // Keep current filter if active
            : updatedEvents, // Update filtered list if no filters
        selectedEvent: newEvent,
        isLoading: false,
        error: null,
      }
    }

    case EVENT_ACTIONS.FETCH_EVENT_FAILURE: {
      const failureAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.FETCH_EVENT_FAILURE
      }
      return {
        ...state,
        isLoading: false,
        error: failureAction.payload.error,
      }
    }

    // Search and filtering functionality
    case EVENT_ACTIONS.SET_SEARCH_QUERY: {
      const searchAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SET_SEARCH_QUERY
      }
      return {
        ...state,
        searchQuery: searchAction.payload.query,
      }
    }

    case EVENT_ACTIONS.CLEAR_SEARCH:
      return {
        ...state,
        searchQuery: '',
        filteredEvents: state.events,
      }

    case EVENT_ACTIONS.FILTER_EVENTS: {
      const filterAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.FILTER_EVENTS
      }
      return {
        ...state,
        filteredEvents: filterAction.payload.filteredEvents,
      }
    }

    case EVENT_ACTIONS.SET_CITY_FILTER: {
      const cityFilterAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SET_CITY_FILTER
      }
      return {
        ...state,
        cityFilter: cityFilterAction.payload.citySlug,
      }
    }

    case EVENT_ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        searchQuery: '',
        cityFilter: undefined,
        filteredEvents: state.events,
      }

    // Event selection
    case EVENT_ACTIONS.SELECT_EVENT: {
      const selectAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SELECT_EVENT
      }
      return {
        ...state,
        selectedEvent: selectAction.payload.event,
      }
    }

    case EVENT_ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedEvent: null,
      }

    // Cache management
    case EVENT_ACTIONS.INVALIDATE_CACHE:
      return {
        ...state,
        lastFetched: null,
        events: [],
        filteredEvents: [],
        error: null,
      }

    case EVENT_ACTIONS.SET_LAST_FETCHED: {
      const timestampAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SET_LAST_FETCHED
      }
      return {
        ...state,
        lastFetched: timestampAction.payload.timestamp,
      }
    }

    // Pagination management
    case EVENT_ACTIONS.SET_PAGINATION: {
      const paginationAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SET_PAGINATION
      }
      return {
        ...state,
        pagination: {
          limit: paginationAction.payload.limit,
          offset: paginationAction.payload.offset,
          total: paginationAction.payload.total,
          hasMore: paginationAction.payload.total
            ? paginationAction.payload.offset + paginationAction.payload.limit <
              paginationAction.payload.total
            : undefined,
        },
      }
    }

    // Enhanced pagination cases
    case EVENT_ACTIONS.SET_CURRENT_PAGE: {
      const pageAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SET_CURRENT_PAGE
      }
      return {
        ...state,
        currentPage: pageAction.payload.page,
      }
    }

    case EVENT_ACTIONS.SET_TOTAL_PAGES: {
      const totalPagesAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SET_TOTAL_PAGES
      }
      return {
        ...state,
        totalPages: totalPagesAction.payload.totalPages,
      }
    }

    case EVENT_ACTIONS.CACHE_PAGE_RESULTS: {
      const cacheAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.CACHE_PAGE_RESULTS
      }
      return {
        ...state,
        cachedPages: {
          ...state.cachedPages,
          [cacheAction.payload.page.toString()]: cacheAction.payload.cache,
        },
      }
    }

    case EVENT_ACTIONS.INVALIDATE_PAGE_CACHE: {
      const invalidateAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.INVALIDATE_PAGE_CACHE
      }

      // If specific page provided, remove only that page
      if (invalidateAction.payload.page !== undefined) {
        const newCachedPages = { ...state.cachedPages }
        delete newCachedPages[invalidateAction.payload.page.toString()]
        return {
          ...state,
          cachedPages: newCachedPages,
        }
      }

      // Otherwise, clear all cached pages
      return {
        ...state,
        cachedPages: {},
      }
    }

    case EVENT_ACTIONS.SET_PREFETCHING_PAGE: {
      const prefetchingAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SET_PREFETCHING_PAGE
      }
      return {
        ...state,
        prefetchingPage: prefetchingAction.payload.page,
      }
    }

    case EVENT_ACTIONS.MARK_PAGE_PREFETCHED: {
      const prefetchedAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.MARK_PAGE_PREFETCHED
      }
      return {
        ...state,
        prefetchedPages: [
          ...state.prefetchedPages,
          prefetchedAction.payload.page,
        ],
        prefetchingPage:
          state.prefetchingPage === prefetchedAction.payload.page
            ? null
            : state.prefetchingPage,
      }
    }

    case EVENT_ACTIONS.SET_PAGE_CHANGING: {
      const changingAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.SET_PAGE_CHANGING
      }
      return {
        ...state,
        isChangingPage: changingAction.payload.isChanging,
      }
    }

    case EVENT_ACTIONS.CLEAR_PREFETCH_STATE:
      return {
        ...state,
        prefetchingPage: null,
        prefetchedPages: [],
      }

    default:
      return state
  }
}
