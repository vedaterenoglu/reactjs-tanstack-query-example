/**
 * Events Redux Slice - Redux Toolkit Implementation
 *
 * Design Patterns Applied:
 * 1. **Module Pattern**: Encapsulates all event-related Redux logic
 * 2. **Barrel Export Pattern**: Single point of import for external consumers
 * 3. **Facade Pattern**: Hides internal complexity behind clean exports
 *
 * SOLID Principles:
 * - **SRP**: Each exported module has single responsibility
 * - **OCP**: Extensible through new actions without modifying existing
 * - **ISP**: Focused exports for specific use cases
 * - **DIP**: Consumers depend on interfaces, not implementations
 *
 * Exports:
 * - Actions from createSlice
 * - Reducer function
 * - Memoized selectors
 * - Async thunk operations
 *
 * Following Redux Toolkit patterns with less boilerplate
 * Implements SOLID principles and immutable state management with Immer
 */

export {
  eventReducer,
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
  fetchEvents,
  fetchEventBySlug,
  fetchEventsPage,
  refreshEvents,
  searchEvents,
} from './eventSlice'
export * from './eventSelectors'
