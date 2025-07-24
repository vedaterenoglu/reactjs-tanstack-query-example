# 🔄 Data Management Architecture

## Overview

The Data Management Architecture is built on **TanStack Query 5.62.9**, showcasing modern server state management patterns. It provides intelligent caching, background synchronization, and powerful developer tools with declarative data fetching.

## 🎯 Core Features

### TanStack Query Architecture

- **useQuery**: Declarative data fetching with automatic caching
- **useInfiniteQuery**: Infinite scroll pagination with memory efficiency
- **useMutation**: Optimistic updates with rollback capabilities
- **Query Persistence**: TanStack Query Persist 5.83.0 integration

### Advanced Query Patterns

- **Smart Caching**: Stale-while-revalidate with automatic invalidation
- **Computed Queries**: Derived data through select transformations
- **Loading States**: Built-in loading, error, and success states
- **Error Handling**: Automatic retry mechanisms and error boundaries

### Developer Experience

- **TanStack Query DevTools**: Full query inspection and cache debugging
- **Type Safety**: Complete TypeScript integration with query inference
- **Hot Reloading**: Query state preservation during development
- **Declarative API**: Simple, intuitive query definitions

## 🏗️ Technical Implementation

### Query Client Configuration

```typescript
// TanStack Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes
      retry: 3,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Persistence configuration
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'tanstack-query-cache',
  storage,
  whitelist: ['cities', 'events'], // Persist these slices
}
```

### Slice Architecture

```typescript
// RTK createSlice implementation
const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    entities: [], // Raw data storage
    filteredEvents: [], // Computed filtered data
    selectedEvent: null, // Current selection
    pagination: {
      // Pagination state
      currentPage: 1,
      totalPages: 0,
      itemsPerPage: 12,
      totalItems: 0,
    },
    filters: {
      // Filter state
      citySlug: null,
      searchQuery: '',
      dateRange: null,
    },
    ui: {
      // UI state
      isLoading: false,
      isChangingPage: false,
      error: null,
      lastFetched: null,
    },
  },
  reducers: {
    // Synchronous actions
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload
    },
    clearError: state => {
      state.ui.error = null
    },
  },
  extraReducers: builder => {
    // Async action handlers
    builder
      .addCase(fetchEventsByCity.pending, state => {
        state.ui.isLoading = true
        state.ui.error = null
      })
      .addCase(fetchEventsByCity.fulfilled, (state, action) => {
        state.entities = action.payload.events
        state.filteredEvents = action.payload.events
        state.pagination = action.payload.pagination
        state.ui.isLoading = false
        state.ui.lastFetched = Date.now()
      })
      .addCase(fetchEventsByCity.rejected, (state, action) => {
        state.ui.isLoading = false
        state.ui.error = action.payload as string
      })
  },
})
```

### Async Thunk Patterns

```typescript
// Comprehensive async action
export const fetchEventsByCity = createAsyncThunk(
  'events/fetchByCity',
  async (
    params: { citySlug: string; page?: number },
    { rejectWithValue, getState }
  ) => {
    try {
      // Get current state for caching logic
      const state = getState() as RootState
      const lastFetched = state.events.ui.lastFetched
      const cacheValid = lastFetched && Date.now() - lastFetched < 5 * 60 * 1000

      if (cacheValid && state.events.filters.citySlug === params.citySlug) {
        return state.events // Return cached data
      }

      // Fetch fresh data
      const response = await eventApi.getEventsByCity(
        params.citySlug,
        params.page
      )
      return {
        events: response.events,
        pagination: response.pagination,
        filters: { citySlug: params.citySlug },
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

// Optimistic update pattern
export const updateEventLike = createAsyncThunk(
  'events/updateLike',
  async (
    { eventId, isLiked }: { eventId: number; isLiked: boolean },
    { dispatch, rejectWithValue }
  ) => {
    // Optimistic update
    dispatch(setEventLike({ eventId, isLiked }))

    try {
      await eventApi.updateEventLike(eventId, isLiked)
      return { eventId, isLiked }
    } catch (error) {
      // Rollback on failure
      dispatch(setEventLike({ eventId, isLiked: !isLiked }))
      return rejectWithValue(getErrorMessage(error))
    }
  }
)
```

### Memoized Selectors

```typescript
// Base selectors
const selectEventsState = (state: RootState) => state.events
const selectCitiesState = (state: RootState) => state.cities

// Memoized computed selectors
export const selectFilteredEvents = createSelector(
  [selectEventsState],
  eventsState => eventsState.filteredEvents
)

export const selectPaginationInfo = createSelector(
  [selectEventsState],
  eventsState => ({
    ...eventsState.pagination,
    hasNextPage:
      eventsState.pagination.currentPage < eventsState.pagination.totalPages,
    hasPreviousPage: eventsState.pagination.currentPage > 1,
  })
)

export const selectEventById = createSelector(
  [selectEventsState, (state: RootState, eventId: number) => eventId],
  (eventsState, eventId) =>
    eventsState.entities.find(event => event.id === eventId)
)

// Complex derived state
export const selectEventsWithMetadata = createSelector(
  [selectFilteredEvents, selectPaginationInfo],
  (events, pagination) => ({
    events,
    isEmpty: events.length === 0,
    isFirstPage: pagination.currentPage === 1,
    isLastPage: pagination.currentPage === pagination.totalPages,
    totalResults: pagination.totalItems,
  })
)
```

## 🎨 Design Patterns Applied

### SOLID Principles

- **SRP**: Each slice handles single domain (cities, events)
- **OCP**: Slices extensible through additional reducers
- **LSP**: All actions follow Flux Standard Action pattern
- **ISP**: Focused selectors for specific data needs
- **DIP**: Components depend on selector abstractions

### Redux Toolkit Patterns

- **createSlice**: Automatic action creators and reducers
- **createAsyncThunk**: Built-in async handling with pending/fulfilled/rejected
- **Immer Integration**: Immutable updates with mutable syntax
- **RTK Query**: Data fetching and caching (demonstrated in event search)

### Performance Patterns

- **Memoization**: Reselect prevents unnecessary recalculations
- **Structural Sharing**: Redux preserves unchanged references
- **Batch Updates**: Multiple actions processed in single render
- **Lazy Loading**: Components connect to specific state slices

### Error Handling Patterns

- **Error Boundaries**: Component-level error containment
- **Error Normalization**: Consistent error object structure
- **Retry Mechanisms**: Automatic retry for failed actions
- **Graceful Degradation**: Fallback states for failures

## 🔄 Data Flow Architecture

### Unidirectional Data Flow

```
User Action →
  Action Creator →
    Middleware (Thunk) →
      Reducer →
        Store Update →
          Selector →
            Component Re-render
```

### Async Data Flow

```
Component →
  useAppDispatch(asyncThunk) →
    Thunk Middleware →
      API Service →
        Response Validation →
          Action Dispatch →
            Reducer Update →
              State Change →
                Component Update
```

### Cache Management Flow

```
Data Request →
  Cache Check →
    [Cache Hit] → Return Cached Data
    [Cache Miss] → API Request → Validation → Cache Update → Return Fresh Data
```

## 🧩 Custom Hooks Integration

### State Access Hooks

```typescript
// Encapsulated state access
export const useEvents = () => {
  const dispatch = useAppDispatch()
  const events = useAppSelector(selectFilteredEvents)
  const isLoading = useAppSelector(selectEventsLoading)
  const error = useAppSelector(selectEventsError)
  const pagination = useAppSelector(selectPaginationInfo)

  const actions = useMemo(
    () => ({
      fetchByCity: (citySlug: string) =>
        dispatch(fetchEventsByCity({ citySlug })),
      changePage: (page: number) => dispatch(changePage(page)),
      selectEvent: (event: Event) => dispatch(setSelectedEvent(event)),
      clearError: () => dispatch(clearError()),
    }),
    [dispatch]
  )

  return {
    events,
    isLoading,
    error,
    pagination,
    actions,
  }
}

// Optimized hook for specific data
export const useEventById = (eventId: number) => {
  return useAppSelector(state => selectEventById(state, eventId))
}

// Hook with automatic data fetching
export const useEventsWithAutoFetch = (citySlug: string) => {
  const { events, isLoading, error, actions } = useEvents()

  useEffect(() => {
    if (citySlug && !events.length && !isLoading) {
      actions.fetchByCity(citySlug)
    }
  }, [citySlug, events.length, isLoading, actions])

  return { events, isLoading, error, actions }
}
```

## 🔧 Middleware Integration

### Custom Middleware

```typescript
// Logging middleware for development
const loggerMiddleware: Middleware = store => next => action => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`Action: ${action.type}`)
    console.log('Previous State:', store.getState())
    console.log('Action:', action)
    const result = next(action)
    console.log('Next State:', store.getState())
    console.groupEnd()
    return result
  }
  return next(action)
}

// Error tracking middleware
const errorTrackingMiddleware: Middleware = store => next => action => {
  try {
    return next(action)
  } catch (error) {
    console.error('Redux Error:', error)
    // Send to error tracking service
    // trackError(error, { action, state: store.getState() })
    throw error
  }
}
```

### Persistence Middleware

```typescript
// Selective persistence configuration
const persistConfig = {
  key: 'events-app',
  version: 1,
  storage,
  whitelist: ['cities', 'events'], // Only persist these slices
  blacklist: [], // Never persist these
  transforms: [
    // Transform data before persisting
    createTransform(
      // Outbound: store → storage
      (inboundState: EventsState) => ({
        ...inboundState,
        ui: { ...inboundState.ui, isLoading: false }, // Reset loading states
      }),
      // Inbound: storage → store
      (outboundState: EventsState) => outboundState,
      { whitelist: ['events'] }
    ),
  ],
}
```

## 🧪 Testing Strategy

### Reducer Testing

```typescript
describe('eventsReducer', () => {
  it('should handle fetchEventsByCity.fulfilled', () => {
    const initialState = getInitialState()
    const mockEvents = [mockEvent1, mockEvent2]
    const action = fetchEventsByCity.fulfilled(
      {
        events: mockEvents,
        pagination: mockPagination,
      },
      'requestId',
      { citySlug: 'test-city' }
    )

    const newState = eventsReducer(initialState, action)

    expect(newState.entities).toEqual(mockEvents)
    expect(newState.ui.isLoading).toBe(false)
    expect(newState.ui.error).toBeNull()
  })
})
```

### Selector Testing

```typescript
describe('eventSelectors', () => {
  it('should select filtered events', () => {
    const mockState = {
      events: {
        entities: mockEvents,
        filteredEvents: mockEvents.slice(0, 2),
      },
    } as RootState

    const result = selectFilteredEvents(mockState)
    expect(result).toHaveLength(2)
    expect(result).toEqual(mockEvents.slice(0, 2))
  })
})
```

### Thunk Testing

```typescript
describe('fetchEventsByCity', () => {
  it('should fetch events successfully', async () => {
    const mockResponse = { events: mockEvents, pagination: mockPagination }
    jest.mocked(eventApi.getEventsByCity).mockResolvedValue(mockResponse)

    const result = await store.dispatch(
      fetchEventsByCity({ citySlug: 'test-city' })
    )

    expect(result.type).toBe('events/fetchByCity/fulfilled')
    expect(result.payload).toEqual(mockResponse)
  })
})
```

## 📊 Performance Optimization

### Selector Optimization

- **Memoization**: Reselect prevents unnecessary recalculations
- **Shallow Equality**: Components re-render only on reference changes
- **Granular Selectors**: Select only needed data portions
- **Composition**: Build complex selectors from simple ones

### State Structure Optimization

- **Normalization**: Flat structure for efficient updates
- **Reference Stability**: Maintain object references when possible
- **Minimal State**: Store only essential data, derive the rest
- **Batched Updates**: Group related state changes

### Memory Management

- **Cleanup Actions**: Clear unused data proactively
- **Cache Invalidation**: Remove stale data based on TTL
- **Selective Persistence**: Persist only necessary state slices
- **Garbage Collection**: Let unused references be collected

## 🔮 Future Enhancements

### Advanced Features

- **Real-time Updates**: WebSocket integration with Redux
- **Optimistic UI**: More comprehensive optimistic update patterns
- **Offline Support**: Redux Offline for offline-first experience
- **State Synchronization**: Multi-tab state synchronization

### Performance Improvements

- **Code Splitting**: Lazy load reducers for route-based chunks
- **Worker Integration**: Web Workers for heavy computations
- **Streaming Updates**: Streaming data updates for large datasets
- **Virtual Store**: Virtual scrolling integration with Redux

### Developer Tools

- **Custom DevTools**: Domain-specific debugging tools
- **Performance Monitoring**: Redux action performance tracking
- **State Analytics**: State usage and optimization analytics
- **Testing Utilities**: Enhanced testing helper functions

---

**Status**: ✅ **Production-Ready with Advanced Patterns**
