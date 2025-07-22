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

// Initial state following EventsState interface
const initialState: EventsState = {
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  searchQuery: '',
  cityFilter: undefined,
  isLoading: false,
  error: null,
  lastFetched: null,
  pagination: null,
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
          ...persistedEventState,
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
      console.warn('[eventReducer] FETCH_EVENTS_REQUEST - clearing error, setting loading=true')
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case EVENT_ACTIONS.FETCH_EVENTS_SUCCESS: {
      const successAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.FETCH_EVENTS_SUCCESS
      }
      return {
        ...state,
        events: successAction.payload.events,
        filteredEvents: successAction.payload.events,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
        pagination: successAction.payload.total !== undefined ? {
          limit: state.pagination?.limit || 12,
          offset: state.pagination?.offset || 0,
          total: successAction.payload.total,
          hasMore: successAction.payload.hasMore,
        } : state.pagination,
      }
    }

    case EVENT_ACTIONS.FETCH_EVENTS_FAILURE: {
      const failureAction = action as EventAction & {
        type: typeof EVENT_ACTIONS.FETCH_EVENTS_FAILURE
      }
      console.warn('[eventReducer] FETCH_EVENTS_FAILURE - setting error:', failureAction.payload.error)
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
      const existingEventIndex = state.events.findIndex(e => e.slug === newEvent.slug)
      const updatedEvents = existingEventIndex >= 0
        ? state.events.map((event, index) => 
            index === existingEventIndex ? newEvent : event
          )
        : [...state.events, newEvent]

      return {
        ...state,
        events: updatedEvents,
        filteredEvents: state.searchQuery || state.cityFilter 
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
            ? (paginationAction.payload.offset + paginationAction.payload.limit) < paginationAction.payload.total
            : undefined,
        },
      }
    }

    default:
      return state
  }
}