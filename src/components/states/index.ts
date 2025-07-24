/**
 * States Barrel Export
 *
 * Centralized export for state components following React 19 patterns
 * Includes both general state components and TanStack Query-specific states
 * Enables clean imports and better organization
 */

// General State Components
export { ErrorState } from './ErrorState'
export { LoadingState } from './LoadingState'
export { EmptyState } from './EmptyState'

// TanStack Query-Specific Loading States
export {
  QueryLoadingState,
  MutationLoadingState,
  SkeletonLoading,
  NetworkAwareLoading,
  EventsLoading,
  CitiesLoading,
  EventDetailLoading,
} from './QueryLoadingState'

// TanStack Query-Specific Error States
export {
  QueryErrorState,
  CustomQueryError,
  NetworkAwareError,
  EventsError,
  CitiesError,
  EventDetailError,
} from './QueryErrorState'
