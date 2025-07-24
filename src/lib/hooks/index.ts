/**
 * Custom Hooks Index - Centralized export for all custom hooks
 * Organized by functionality and responsibility following SOLID principles
 * Provides clean API surface for consuming components
 */

// ===== EXISTING HOOKS (Legacy RTK-based) =====
// Theme hooks (existing)
export { useTheme } from './useTheme'

// City management hooks (RTK-based - will be deprecated)
export {
  useCities,
  useCitySearch,
  useCitySelection,
  useCityInitialization,
  useCitiesWithInit,
  useCity,
} from './useCities'

// Event management hooks (RTK-based - will be deprecated)
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

// Single event hook (RTK-based - will be deprecated)
export { useSingleEvent } from './useSingleEvent'

// Animation hooks (independent)
export {
  useScrollAnimation,
  useStaggeredScrollAnimation,
} from './useScrollAnimation'

// ===== NEW TANSTACK QUERY HOOKS =====

// TanStack Query Base Hooks - Direct query layer
export {
  // Events Query Hooks
  useEventsQuery,
  useEventsByCity,
  useEventsSearch,
  useInfiniteEventsQuery,
  useEventQuery,
  useEventSuspenseQuery,
  useEventsWithMeta,
  useEventsPrefetch,
  type EventsQueryResult,
  type EventQueryResult,
  type EventsSearchResult,
  type InfiniteEventsResult,
  type EventsWithMetaResult,
} from './tanstack/useEventsQuery'

export {
  // Events Mutation Hooks
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useEventMutations,
  useBatchEventOperations,
  type CreateEventMutation,
  type UpdateEventMutation,
  type DeleteEventMutation,
  type EventMutationsResult,
  type BatchEventOperationsResult,
} from './tanstack/useEventsMutations'

export {
  // Cities Query Hooks
  useCitiesQuery,
  useCitiesSearch,
  useCityQuery,
  useCitySuspenseQuery,
  useCitiesWithMeta,
  useCityExists,
  useCityValidation,
  useCitiesFilter,
  useCitiesPrefetch,
  useCityOperations,
  type CitiesQueryResult,
  type CityQueryResult,
  type CitiesSearchResult,
  type CitiesWithMetaResult,
  type CityExistsResult,
  type CityValidationResult,
  type CitiesFilterResult,
  type CityOperationsResult,
} from './tanstack/useCitiesQuery'

// Business Logic Hooks - Higher-level abstractions
export {
  // Portfolio Data Management
  usePortfolioData,
  useCityEventManagement,
  useEventDiscovery,
  useDataSynchronization,
  createPortfolioHook,
  type PortfolioDataResult,
  type CityEventManagementResult,
  type EventDiscoveryResult,
  type DataSynchronizationResult,
} from './usePortfolioData'

export {
  // Form Integration Hooks
  useEventForm,
  useCitySelectionForm,
  useMultiStepForm,
  createFormHook,
  type EventFormResult,
  type CitySelectionFormResult,
  type MultiStepFormResult,
} from './useFormIntegration'

export {
  // Performance Optimization Hooks
  useIntelligentPrefetch,
  useCacheOptimization,
  useNetworkOptimization,
  useAssetOptimization,
  usePerformanceOptimization,
  type IntelligentPrefetchResult,
  type CacheOptimizationResult,
  type NetworkOptimizationResult,
  type AssetOptimizationResult,
  type PerformanceOptimizationResult,
} from './usePerformanceOptimization'

export {
  // Pagination and Filtering Hooks
  usePagination,
  useFilters,
  useEventsPagination,
  createPaginationHook,
  useTablePagination,
  type PaginationResult,
  type FilterResult,
  type EventsPaginationResult,
  type TablePaginationResult,
} from './usePaginationFilter'

export {
  // Faceted Search Hooks
  useFacetedSearch,
  useEventFacetedSearch,
  type FacetedSearchResult,
  type EventFacetedSearchResult,
} from './useFacetedSearch'

export {
  // Infinite Scroll Hooks
  useInfiniteScroll,
  useVirtualInfiniteScroll,
  useBidirectionalInfiniteScroll,
  type InfiniteScrollResult,
  type VirtualInfiniteScrollResult,
  type BidirectionalInfiniteScrollResult,
} from './useInfiniteScroll'

// ===== HOOK COLLECTIONS =====

/**
 * Hook Categories for Organized Imports
 * Allows for namespace-style imports in components
 */

// Query Hooks - Direct data access layer
export const QueryHooks = {
  // Events
  useEventsQuery: useEventsQuery,
  useEventsByCity: useEventsByCity,
  useEventsSearch: useEventsSearch,
  useEventQuery: useEventQuery,
  useInfiniteEventsQuery: useInfiniteEventsQuery,
  useEventSuspenseQuery: useEventSuspenseQuery,
  
  // Cities
  useCitiesQuery: useCitiesQuery,
  useCitiesSearch: useCitiesSearch,
  useCityQuery: useCityQuery,
  useCitySuspenseQuery: useCitySuspenseQuery,
  useCityExists: useCityExists,
  
  // Mutations
  useCreateEvent: useCreateEvent,
  useUpdateEvent: useUpdateEvent,
  useDeleteEvent: useDeleteEvent,
  useEventMutations: useEventMutations,
  useBatchEventOperations: useBatchEventOperations,
} as const

// Business Logic Hooks - Domain-specific logic
export const BusinessHooks = {
  usePortfolioData: usePortfolioData,
  useCityEventManagement: useCityEventManagement,
  useEventDiscovery: useEventDiscovery,
  useDataSynchronization: useDataSynchronization,
} as const

// Form Hooks - Form state and validation
export const FormHooks = {
  useEventForm: useEventForm,
  useCitySelectionForm: useCitySelectionForm,
  useMultiStepForm: useMultiStepForm,
} as const

// Performance Hooks - Optimization and caching
export const PerformanceHooks = {
  useIntelligentPrefetch: useIntelligentPrefetch,
  useCacheOptimization: useCacheOptimization,
  useNetworkOptimization: useNetworkOptimization,
  useAssetOptimization: useAssetOptimization,
  usePerformanceOptimization: usePerformanceOptimization,
} as const

// Utility Hooks - Helper and validation functions
export const UtilityHooks = {
  useCityValidation: useCityValidation,
  useCitiesFilter: useCitiesFilter,
  useEventsWithMeta: useEventsWithMeta,
  useCitiesWithMeta: useCitiesWithMeta,
  useEventsPrefetch: useEventsPrefetch,
  useCitiesPrefetch: useCitiesPrefetch,
  useCityOperations: useCityOperations,
} as const

// Pagination Hooks - Pagination and filtering
export const PaginationHooks = {
  usePagination: usePagination,
  useFilters: useFilters,
  useEventsPagination: useEventsPagination,
  useTablePagination: useTablePagination,
  useFacetedSearch: useFacetedSearch,
  useEventFacetedSearch: useEventFacetedSearch,
  useInfiniteScroll: useInfiniteScroll,
  useVirtualInfiniteScroll: useVirtualInfiniteScroll,
  useBidirectionalInfiniteScroll: useBidirectionalInfiniteScroll,
} as const

/**
 * Hook Factories - Dynamic hook creation
 * For advanced use cases requiring configuration
 */
export const HookFactories = {
  createPortfolioHook: createPortfolioHook,
  createFormHook: createFormHook,
  createPaginationHook: createPaginationHook,
} as const

/**
 * Recommended Hook Combinations
 * Pre-configured hook combinations for common use cases
 */
export const useEventManagementSuite = () => ({
  events: useEventsQuery(),
  mutations: useEventMutations(),
  prefetch: useIntelligentPrefetch(),
  performance: usePerformanceOptimization(),
})

export const useCityManagementSuite = () => ({
  cities: useCitiesQuery(),
  operations: useCityOperations(),
  validation: useCityValidation(),
  filter: useCitiesFilter(),
})

export const useFormSuite = () => ({
  eventForm: useEventForm(),
  citySelection: useCitySelectionForm(),
  validation: useCityValidation(),
})

export const usePerformanceSuite = () => ({
  optimization: usePerformanceOptimization(),
  prefetch: useIntelligentPrefetch(),
  cache: useCacheOptimization(),
  network: useNetworkOptimization(),
  assets: useAssetOptimization(),
})

export const usePaginationSuite = () => ({
  eventsPagination: useEventsPagination(),
  facetedSearch: useEventFacetedSearch(),
  filters: useFilters(),
})

/**
 * Development and Debugging Hooks
 * Useful for development and troubleshooting
 */
export const useDebugInfo = () => {
  const performance = usePerformanceOptimization()
  const cache = useCacheOptimization()
  
  return {
    performance: performance.getPerformanceMetrics(),
    cache: cache.getCacheHealth(),
    networkStatus: performance.network.networkStatus,
  }
}
