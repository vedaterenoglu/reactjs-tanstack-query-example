/**
 * Boundary Components Index - Centralized exports for error boundaries and suspense boundaries
 * 
 * Design Patterns Applied:
 * - Barrel Export Pattern: Single entry point for all boundary components
 * - Interface Segregation: Focused exports for different boundary types
 * - Facade Pattern: Simplified API for importing boundary components
 */

// Error Boundaries
export {
  QueryErrorBoundary,
  withQueryErrorBoundary,
  useQueryErrorBoundary,
} from './QueryErrorBoundary'

// Suspense Boundaries
export {
  QuerySuspenseBoundary,
  EventsSuspenseBoundary,
  CitiesSuspenseBoundary,
  EventDetailSuspenseBoundary,
  InlineSuspenseBoundary,
  withQuerySuspense,
  QueryBoundary,
  useQuerySuspense,
} from './QuerySuspenseBoundary'