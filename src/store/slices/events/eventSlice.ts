/**
 * Events slice using Redux Toolkit
 * Manages event data, search, selection, pagination, and caching with RTK patterns
 * Part 1: Basic structure with synchronous actions only
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist'

import type { Event, EventsState, PaginationConfig, PageCache, PrefetchQueueItem, ActivePrefetch, FailedPrefetch } from '@/lib/types/event.types'

// Initial state with comprehensive structure
const initialState: EventsState = {
  // Core Data
  events: [],
  filteredEvents: [],
  selectedEvent: null,

  // Search & Filtering
  searchQuery: '',
  cityFilter: undefined,

  // Loading & Error States
  isLoading: false,
  error: null,
  lastFetched: null,

  // Legacy Pagination
  pagination: null,

  // Enhanced Pagination
  currentPage: 1,
  itemsPerPage: 12,
  totalPages: 0,

  // Page Caching System
  cachedPages: {},

  // Prefetch State
  prefetchingPage: null,
  prefetchedPages: [],
  prefetchQueue: [],
  activePrefetches: {},

  // Network Awareness
  networkStatus: {
    isOnline: true,
    connectionSpeed: 'unknown',
    dataSaver: false,
  },

  // Prefetch Configuration
  prefetchConfig: {
    maxConcurrentRequests: 2,
    networkAwareThreshold: 100,
    delayMs: 300,
    enabledStrategies: ['adjacent', 'popular'],
    prefetchEnabled: true,
  },

  // Error Tracking
  failedPrefetches: {},

  // UI State
  isChangingPage: false,
}

// Events slice with synchronous actions only
const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    // Search and Filtering Actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      // Apply search filter to existing events
      if (action.payload.trim() === '') {
        state.filteredEvents = state.events
      } else {
        const query = action.payload.toLowerCase()
        state.filteredEvents = state.events.filter(
          (event: Event) =>
            event.title.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query) ||
            event.category.toLowerCase().includes(query) ||
            event.cityName.toLowerCase().includes(query)
        )
      }
    },

    clearSearch: state => {
      state.searchQuery = ''
      state.filteredEvents = state.events
    },

    filterEvents: (state, action: PayloadAction<Event[]>) => {
      state.filteredEvents = action.payload
    },

    setCityFilter: (state, action: PayloadAction<string>) => {
      state.cityFilter = action.payload
      // Apply city filter to existing events
      if (action.payload) {
        state.filteredEvents = state.events.filter(
          (event: Event) => event.citySlug === action.payload
        )
      } else {
        state.filteredEvents = state.events
      }
    },

    clearFilters: state => {
      state.searchQuery = ''
      state.cityFilter = undefined
      state.filteredEvents = state.events
    },

    // Event Selection Actions
    selectEvent: (state, action: PayloadAction<Event>) => {
      state.selectedEvent = action.payload
    },

    clearSelection: state => {
      state.selectedEvent = null
    },

    // Cache Management Actions
    invalidateCache: state => {
      state.events = []
      state.filteredEvents = []
      state.lastFetched = null
      state.error = null
      state.cachedPages = {}
      state.prefetchedPages = []
      state.activePrefetches = {}
      state.failedPrefetches = {}
    },

    setLastFetched: (state, action: PayloadAction<number>) => {
      state.lastFetched = action.payload
    },

    // Basic Pagination Actions
    setPagination: (state, action: PayloadAction<PaginationConfig>) => {
      state.pagination = action.payload
    },

    // Enhanced Pagination Actions
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },

    setTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload
    },

    cachePageResults: (
      state,
      action: PayloadAction<{
        pageKey: string
        pageData: PageCache
      }>
    ) => {
      const { pageKey, pageData } = action.payload
      state.cachedPages[pageKey] = pageData
    },

    invalidatePageCache: (state, action: PayloadAction<string | null>) => {
      const pageKey = action.payload
      if (pageKey) {
        // Remove specific page from cache
        delete state.cachedPages[pageKey]
      } else {
        // Clear all cached pages
        state.cachedPages = {}
      }
    },

    setPrefetchingPage: (state, action: PayloadAction<number | null>) => {
      state.prefetchingPage = action.payload
    },

    markPagePrefetched: (state, action: PayloadAction<number>) => {
      const page = action.payload
      if (!state.prefetchedPages.includes(page)) {
        state.prefetchedPages.push(page)
      }
      // Clear prefetching status if this was the prefetching page
      if (state.prefetchingPage === page) {
        state.prefetchingPage = null
      }
    },

    setPageChanging: (state, action: PayloadAction<boolean>) => {
      state.isChangingPage = action.payload
    },

    clearPrefetchState: state => {
      state.prefetchingPage = null
      state.prefetchedPages = []
      state.prefetchQueue = []
      state.activePrefetches = {}
      state.failedPrefetches = {}
    },

    // Prefetch Queue Management
    addToPrefetchQueue: (state, action: PayloadAction<PrefetchQueueItem>) => {
      const existingIndex = state.prefetchQueue.findIndex(
        item => item.page === action.payload.page
      )
      if (existingIndex === -1) {
        state.prefetchQueue.push(action.payload)
      }
    },

    removeFromPrefetchQueue: (state, action: PayloadAction<number>) => {
      state.prefetchQueue = state.prefetchQueue.filter(
        item => item.page !== action.payload
      )
    },

    // Active Prefetch Management
    setActivePrefetch: (
      state,
      action: PayloadAction<{
        key: string
        prefetch: ActivePrefetch
      }>
    ) => {
      const { key, prefetch } = action.payload
      state.activePrefetches[key] = prefetch
    },

    removeActivePrefetch: (state, action: PayloadAction<string>) => {
      delete state.activePrefetches[action.payload]
    },

    // Failed Prefetch Tracking
    addFailedPrefetch: (
      state,
      action: PayloadAction<{
        key: string
        failed: FailedPrefetch
      }>
    ) => {
      const { key, failed } = action.payload
      state.failedPrefetches[key] = failed
    },

    clearFailedPrefetches: state => {
      state.failedPrefetches = {}
    },

    // Network Status Management
    updateNetworkStatus: (
      state,
      action: PayloadAction<Partial<EventsState['networkStatus']>>
    ) => {
      state.networkStatus = {
        ...state.networkStatus,
        ...action.payload,
      }
    },

    // Prefetch Configuration
    updatePrefetchConfig: (
      state,
      action: PayloadAction<Partial<EventsState['prefetchConfig']>>
    ) => {
      state.prefetchConfig = {
        ...state.prefetchConfig,
        ...action.payload,
      }
    },
  },
  extraReducers: builder => {
    builder
      // Handle redux-persist rehydrate
      .addMatcher(
        action => action.type === REHYDRATE,
        (state, action) => {
          const rehydrateAction = action as { payload?: { events?: EventsState } }
          if (rehydrateAction.payload?.events) {
            return {
              ...state,
              ...rehydrateAction.payload.events,
              isLoading: false,
              error: null,
            }
          }
          return {
            ...state,
            isLoading: false,
            error: null,
          }
        }
      )
  },
})

// Export actions
export const {
  setSearchQuery,
  clearSearch,
  filterEvents,
  setCityFilter,
  clearFilters,
  selectEvent,
  clearSelection,
  invalidateCache,
  setLastFetched,
  setPagination,
  setCurrentPage,
  setTotalPages,
  cachePageResults,
  invalidatePageCache,
  setPrefetchingPage,
  markPagePrefetched,
  setPageChanging,
  clearPrefetchState,
  addToPrefetchQueue,
  removeFromPrefetchQueue,
  setActivePrefetch,
  removeActivePrefetch,
  addFailedPrefetch,
  clearFailedPrefetches,
  updateNetworkStatus,
  updatePrefetchConfig,
} = eventSlice.actions

// Export reducer
export const eventReducer = eventSlice.reducer