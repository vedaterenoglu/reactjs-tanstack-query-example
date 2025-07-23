/**
 * Events slice using Redux Toolkit
 * Manages event data, search, selection, pagination, and caching with RTK patterns
 * Complete implementation with async thunks
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist'

import type {
  Event,
  EventsState,
  PageCache,
  EventsQueryParams,
} from '@/lib/types/event.types'
import { eventApiService } from '@/services/eventApiService'
import type { RootState } from '@/store'

import type { PayloadAction } from '@reduxjs/toolkit'

// Extract types from EventsState for better type safety
type PrefetchQueueItem = EventsState['prefetchQueue'][number]
type ActivePrefetch = EventsState['activePrefetches'][string]
type FailedPrefetch = EventsState['failedPrefetches'][string]
type PaginationConfig = NonNullable<EventsState['pagination']>

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

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Async thunks
export const fetchEvents = createAsyncThunk<
  { events: Event[]; total?: number },
  Partial<EventsQueryParams> | undefined,
  { state: RootState }
>('events/fetchEvents', async (params = {}, { getState, dispatch }) => {
  const state = getState()
  const lastFetched = state.events.lastFetched
  const currentTime = Date.now()

  // Check cache validity
  const isCacheStale =
    !lastFetched || currentTime - lastFetched > CACHE_DURATION
  if (
    !isCacheStale &&
    state.events.events.length > 0 &&
    !params.search &&
    !params.city
  ) {
    return { events: state.events.events }
  }

  // Fetch from API with required defaults
  const queryParams = {
    limit: params.limit || 12,
    offset: params.offset || 0,
    sortBy: params.sortBy || ('date' as const),
    order: params.order || ('asc' as const),
    ...(params.city && { city: params.city }),
    ...(params.search && { search: params.search }),
  }
  const response = await eventApiService.getEvents(queryParams)

  // Update search/filter state if params provided
  if (params.search) {
    dispatch(eventSlice.actions.setSearchQuery(params.search))
  }
  if (params.city) {
    dispatch(eventSlice.actions.setCityFilter(params.city))
  }

  return {
    events: response.data,
    ...(response.pagination?.total && { total: response.pagination.total }),
  }
})

export const fetchEventBySlug = createAsyncThunk<
  Event,
  string,
  { state: RootState }
>('events/fetchEventBySlug', async (slug, { getState }) => {
  const state = getState()

  // Check if event exists in local cache first
  const cachedEvent = state.events.events.find(event => event.slug === slug)
  if (cachedEvent) {
    return cachedEvent
  }

  const response = await eventApiService.getEventBySlug(slug)
  return response
})

export const fetchEventsPage = createAsyncThunk<
  { events: Event[]; page: number; total?: number },
  { page: number; useCache?: boolean; isPrefetch?: boolean },
  { state: RootState }
>(
  'events/fetchEventsPage',
  async (
    { page, useCache = true, isPrefetch = false },
    { getState, dispatch }
  ) => {
    const state = getState()
    const pageKey = `page-${page}`

    // Check page cache
    // eslint-disable-next-line security/detect-object-injection
    if (useCache && state.events.cachedPages[pageKey]) {
      // eslint-disable-next-line security/detect-object-injection
      const cached = state.events.cachedPages[pageKey]
      const isStale = Date.now() - cached.timestamp > CACHE_DURATION
      if (!isStale) {
        return {
          events: cached.events,
          page,
          total: state.events.totalPages * state.events.itemsPerPage,
        }
      }
    }

    // Mark as prefetching if it's a prefetch operation
    if (isPrefetch) {
      dispatch(eventSlice.actions.setPrefetchingPage(page))
    }

    const offset = (page - 1) * state.events.itemsPerPage
    const response = await eventApiService.getEvents({
      limit: state.events.itemsPerPage,
      offset,
      sortBy: 'date',
      order: 'asc',
    })

    // Cache the results
    dispatch(
      eventSlice.actions.cachePageResults({
        pageKey,
        pageData: {
          events: response.data,
          timestamp: Date.now(),
        },
      })
    )

    // Mark as prefetched
    if (isPrefetch) {
      dispatch(eventSlice.actions.markPagePrefetched(page))
    }

    return {
      events: response.data,
      page,
      ...(response.pagination?.total && { total: response.pagination.total }),
    }
  }
)

export const refreshEvents = createAsyncThunk<
  { events: Event[]; total?: number },
  void,
  { state: RootState }
>('events/refreshEvents', async (_, { dispatch }) => {
  dispatch(eventSlice.actions.invalidateCache())
  const response = await dispatch(fetchEvents())
  return response.payload as { events: Event[]; total?: number }
})

// NEW: Search events thunk for backend filtering (mirrors traditional Redux)
export const searchEvents = createAsyncThunk<
  { events: Event[]; total?: number },
  string,
  { state: RootState }
>('events/searchEvents', async (searchQuery, { dispatch }) => {
  // Update search query in state first
  dispatch(eventSlice.actions.setSearchQuery(searchQuery))

  // Make backend API call with search parameter (same as traditional Redux)
  const fetchParams: EventsQueryParams = {
    search: searchQuery, // Backend filters by city
    limit: 50, // Get more results for search
    offset: 0,
    sortBy: 'date',
    order: 'asc',
  }

  const response = await eventApiService.getEvents(fetchParams)

  return {
    events: response.data,
    ...(response.pagination?.total && { total: response.pagination.total }),
  }
})

// Events slice with synchronous and asynchronous actions
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
            event.name.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query) ||
            event.city.toLowerCase().includes(query)
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
      // eslint-disable-next-line security/detect-object-injection
      state.cachedPages[pageKey] = pageData
    },

    invalidatePageCache: (state, action: PayloadAction<string | null>) => {
      const pageKey = action.payload
      if (pageKey) {
        // Remove specific page from cache
        // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // eslint-disable-next-line security/detect-object-injection
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
      // Fetch events
      .addCase(fetchEvents.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false
        state.events = action.payload.events
        state.filteredEvents = state.searchQuery
          ? action.payload.events.filter(
              (event: Event) =>
                event.name
                  .toLowerCase()
                  .includes(state.searchQuery.toLowerCase()) ||
                event.description
                  .toLowerCase()
                  .includes(state.searchQuery.toLowerCase()) ||
                event.city
                  .toLowerCase()
                  .includes(state.searchQuery.toLowerCase())
            )
          : action.payload.events

        if (action.payload.total) {
          state.totalPages = Math.ceil(
            action.payload.total / state.itemsPerPage
          )
        }

        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch events'
        console.error('Failed to fetch events:', state.error)
      })

      // Fetch single event
      .addCase(fetchEventBySlug.fulfilled, (state, action) => {
        // Set the selected event (CRITICAL FIX)
        state.selectedEvent = action.payload

        // Update or add the event to the events array
        const existingIndex = state.events.findIndex(
          e => e.slug === action.payload.slug
        )
        if (existingIndex >= 0) {
          // eslint-disable-next-line security/detect-object-injection
          state.events[existingIndex] = action.payload
        } else {
          state.events.push(action.payload)
        }

        // Update filtered events if filters are active
        if (state.searchQuery || state.cityFilter) {
          const matchesSearch =
            !state.searchQuery ||
            action.payload.name
              .toLowerCase()
              .includes(state.searchQuery.toLowerCase()) ||
            action.payload.description
              .toLowerCase()
              .includes(state.searchQuery.toLowerCase()) ||
            action.payload.city
              .toLowerCase()
              .includes(state.searchQuery.toLowerCase())

          const matchesCity =
            !state.cityFilter || action.payload.citySlug === state.cityFilter

          if (matchesSearch && matchesCity) {
            const filteredIndex = state.filteredEvents.findIndex(
              e => e.slug === action.payload.slug
            )
            if (filteredIndex >= 0) {
              // eslint-disable-next-line security/detect-object-injection
              state.filteredEvents[filteredIndex] = action.payload
            } else {
              state.filteredEvents.push(action.payload)
            }
          }
        } else {
          // No filters, add to filtered events too
          const filteredIndex = state.filteredEvents.findIndex(
            e => e.slug === action.payload.slug
          )
          if (filteredIndex >= 0) {
            // eslint-disable-next-line security/detect-object-injection
            state.filteredEvents[filteredIndex] = action.payload
          } else {
            state.filteredEvents.push(action.payload)
          }
        }
      })
      .addCase(fetchEventBySlug.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch event'
        console.error('Failed to fetch event:', state.error)
      })

      // Fetch events page
      .addCase(fetchEventsPage.pending, state => {
        state.isChangingPage = true
        state.error = null
      })
      .addCase(fetchEventsPage.fulfilled, (state, action) => {
        state.isChangingPage = false
        state.events = action.payload.events
        state.filteredEvents = action.payload.events
        state.currentPage = action.payload.page

        if (action.payload.total) {
          state.totalPages = Math.ceil(
            action.payload.total / state.itemsPerPage
          )
        }

        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchEventsPage.rejected, (state, action) => {
        state.isChangingPage = false
        state.error = action.error.message || 'Failed to fetch events page'
        console.error('Failed to fetch events page:', state.error)
      })

      // Refresh events
      .addCase(refreshEvents.fulfilled, (state, action) => {
        state.events = action.payload.events
        state.filteredEvents = action.payload.events
        if (action.payload.total) {
          state.totalPages = Math.ceil(
            action.payload.total / state.itemsPerPage
          )
        }
        state.lastFetched = Date.now()
      })

      // Search events (backend filtering)
      .addCase(searchEvents.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.isLoading = false
        state.events = action.payload.events
        state.filteredEvents = action.payload.events // Backend already filtered

        if (action.payload.total) {
          state.totalPages = Math.ceil(
            action.payload.total / state.itemsPerPage
          )
        }
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to search events'
        console.error('Failed to search events:', state.error)
      })

      // Handle redux-persist rehydrate
      .addMatcher(
        action => action.type === REHYDRATE,
        (state, action) => {
          const rehydrateAction = action as {
            payload?: { events?: EventsState }
          }
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
