/**
 * Custom Hooks Index - Centralized export for all custom hooks
 * Organized by functionality and responsibility following SOLID principles
 * Provides clean API surface for consuming components
 */

// Theme hooks (existing)
export { useTheme } from './useTheme'

// City management hooks (TanStack Query-based)
export {
  useCities,
  useCitySearch,
  useCitySelection,
  useCityInitialization,
  useCitiesWithInit,
  useCity,
} from './useCities'

// Event management hooks (TanStack Query-based)
export {
  useEvents,
  useEventSearch,
  useEventSelection,
  useEventFilters,
  useEventInitialization,
  useEventsWithInit,
  useEvent,
  useEventPagination,
} from './useEvents'

// Animation hooks (independent)
export {
  useScrollAnimation,
  useStaggeredScrollAnimation,
} from './useScrollAnimation'

// ===== TANSTACK QUERY HOOKS =====

// TanStack Query Base Hooks - Direct query layer
export {
  // Events Query Hooks
  useEventsQuery,
  useEventsByCity,
  useEventQuery,
} from './tanstack/useEventsQuery'

export {
  // Events Mutation Hooks
  useEventMutations,
} from './tanstack/useEventsMutations'

export {
  // Cities Query Hooks
  useCitiesQuery,
} from './tanstack/useCitiesQuery'

// Pagination and Search Hooks
export {
  useInfiniteScroll,
} from './useInfiniteScroll'

// Persistence Hooks
export {
  usePersistence,
} from './usePersistence'

/**
 * Recommended Hook Combinations
 * Components can import and use multiple hooks as needed
 * Example: const events = useEventsQuery(); const mutations = useEventMutations()
 */