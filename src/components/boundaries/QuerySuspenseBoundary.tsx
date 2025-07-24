import React, { Suspense, type ReactNode } from 'react'

import { LoadingState } from '@/components/states/LoadingState'

/**
 * QuerySuspenseBoundary - React 19 Suspense Boundary optimized for TanStack Query operations
 *
 * Design Patterns Applied:
 * 1. **Suspense Pattern**: Leverages React 19 Suspense for loading state management
 * 2. **Boundary Pattern**: Creates loading boundaries around async query operations  
 * 3. **Composition Pattern**: Composes Suspense with custom loading fallbacks
 * 4. **Strategy Pattern**: Different loading strategies based on query type and context
 * 5. **Template Method Pattern**: Defined loading flow with customizable fallback components
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for handling loading states and Suspense boundaries
 * - **OCP**: Extensible through fallback props without modifying boundary logic
 * - **LSP**: Can substitute other suspense boundaries with same interface
 * - **ISP**: Focused interface for suspense boundary configuration
 * - **DIP**: Depends on LoadingState abstraction, not concrete implementations
 *
 * React 19 Patterns:
 * - Modern Suspense integration with concurrent features
 * - Declarative loading state management
 * - Error boundary integration for comprehensive async handling
 * - TypeScript integration with proper component typing
 * - Performance optimized with proper fallback strategies
 */

export interface QuerySuspenseBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  loadingTitle?: string
  loadingMessage?: string
  spinnerSize?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * TanStack Query optimized Suspense Boundary
 * Provides declarative loading states for query operations with React 19 Suspense
 */
export const QuerySuspenseBoundary: React.FC<QuerySuspenseBoundaryProps> = ({
  children,
  fallback,
  loadingTitle = 'Loading...',
  loadingMessage = 'Fetching data, please wait...',
  spinnerSize = 'md',
  className,
}) => {
  // Use custom fallback if provided, otherwise use default LoadingState
  const loadingFallback = fallback || (
    <LoadingState
      isLoading={true}
      title={loadingTitle}
      message={loadingMessage}
      className={className || ''}
      spinnerSize={spinnerSize}
    />
  )

  return (
    <Suspense fallback={loadingFallback}>
      {children}
    </Suspense>
  )
}

/**
 * Specialized Suspense Boundary for Events queries
 * Following Domain-Specific Pattern for events-related loading states
 */
export const EventsSuspenseBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => (
  <QuerySuspenseBoundary
    fallback={fallback}
    loadingTitle="Loading Events"
    loadingMessage="Fetching upcoming events in your area..."
    spinnerSize="lg"
    className="text-center py-16"
  >
    {children}
  </QuerySuspenseBoundary>
)

/**
 * Specialized Suspense Boundary for Cities queries  
 * Following Domain-Specific Pattern for cities-related loading states
 */
export const CitiesSuspenseBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => (
  <QuerySuspenseBoundary
    fallback={fallback}
    loadingTitle="Loading Destinations"
    loadingMessage="Discovering amazing cities for you..."
    spinnerSize="lg"
    className="text-center py-16"
  >
    {children}
  </QuerySuspenseBoundary>
)

/**
 * Specialized Suspense Boundary for single Event queries
 * Following Domain-Specific Pattern for event detail loading states
 */
export const EventDetailSuspenseBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => (
  <QuerySuspenseBoundary
    fallback={fallback}
    loadingTitle="Loading Event Details"
    loadingMessage="Getting event information..."
    spinnerSize="md"
    className="text-center py-12"
  >
    {children}
  </QuerySuspenseBoundary>
)

/**
 * Lightweight Suspense Boundary for inline loading states
 * Following Minimal Interface Pattern for small loading indicators
 */
export const InlineSuspenseBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => (
  <QuerySuspenseBoundary
    fallback={fallback}
    loadingTitle="Loading..."
    loadingMessage=""
    spinnerSize="sm"
    className="text-center py-4"
  >
    {children}
  </QuerySuspenseBoundary>
)

// withQuerySuspense HOC moved to QuerySuspenseHooks.tsx to fix react-refresh warnings

/**
 * Combined Error and Suspense Boundary for comprehensive async handling
 * Following Composition Pattern for error + loading state management
 */
interface QueryBoundaryProps extends QuerySuspenseBoundaryProps {
  errorFallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
  errorTitle?: string
}

export const QueryBoundary: React.FC<QueryBoundaryProps> = ({
  children,
  fallback,
  errorFallback,
  onError,
  resetKeys,
  errorTitle,
  ...suspenseProps
}) => {
  // Import QueryErrorBoundary dynamically to avoid circular dependencies
  const QueryErrorBoundary = React.lazy(() => 
    import('./QueryErrorBoundary').then(module => ({
      default: module.QueryErrorBoundary
    }))
  )

  return (
    <QuerySuspenseBoundary {...suspenseProps} fallback={fallback}>
      <QueryErrorBoundary
        fallback={errorFallback}
        onError={onError}
        resetKeys={resetKeys}
        errorTitle={errorTitle || undefined}
      >
        {children}
      </QueryErrorBoundary>
    </QuerySuspenseBoundary>
  )
}

// useQuerySuspense hook moved to QuerySuspenseHooks.tsx to fix react-refresh warnings