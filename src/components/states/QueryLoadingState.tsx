import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import React from 'react'

import type { UseQueryResult, UseMutationResult } from '@/lib/types/tanstack-query.types'

/**
 * QueryLoadingState - TanStack Query specific loading states with enhanced UX patterns
 *
 * Design Patterns Applied:
 * 1. **State Pattern**: Different visual states based on TanStack Query status
 * 2. **Strategy Pattern**: Different loading strategies for various query operations
 * 3. **Observer Pattern**: Observes TanStack Query state changes and responds accordingly
 * 4. **Composition Pattern**: Composes different loading indicators and messages
 * 5. **Template Method Pattern**: Defined loading display flow with customizable parts
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for displaying TanStack Query loading states
 * - **OCP**: Extensible through props without modifying core loading logic
 * - **LSP**: Can substitute other loading components with same interface
 * - **ISP**: Focused interfaces for different loading state scenarios
 * - **DIP**: Depends on icon component abstractions, not concrete implementations
 *
 * React 19 Patterns:
 * - Conditional rendering based on TanStack Query states
 * - Performance optimized with early returns and memoization
 * - Accessibility-first loading indicators with proper ARIA attributes
 * - TypeScript integration with TanStack Query result types
 * - Modern React patterns with functional components and hooks
 */

interface BaseQueryLoadingProps {
  className?: string
  showLoadingText?: boolean
  spinnerSize?: 'sm' | 'md' | 'lg'
}

interface QueryLoadingStateProps extends BaseQueryLoadingProps {
  queryResult: UseQueryResult<unknown>
  loadingTitle?: string
  loadingMessage?: string
  refetchingMessage?: string
}

interface MutationLoadingStateProps extends BaseQueryLoadingProps {
  mutationResult: UseMutationResult<unknown, unknown, unknown>
  loadingTitle?: string
  loadingMessage?: string
}

/**
 * Enhanced loading state for TanStack Query operations
 * Provides contextual loading indicators based on query state
 */
export const QueryLoadingState: React.FC<QueryLoadingStateProps> = ({
  queryResult,
  loadingTitle = 'Loading',
  loadingMessage = 'Fetching data...',
  refetchingMessage = 'Updating data...',
  className = 'text-center py-8',
  showLoadingText = true,
  spinnerSize = 'md',
}) => {
  const { isLoading, isFetching, error } = queryResult

  // Don't show loading state if there's an error
  if (error) {
    return null
  }

  // Don't show loading state if not in any loading state
  if (!isLoading && !isFetching) {
    return null
  }

  const getSpinnerIcon = () => {
    if (isFetching && !isLoading) {
      return RefreshCw
    }
    return Loader2
  }

  const getSpinnerSize = () => {
    switch (spinnerSize) {
      case 'sm':
        return 'h-4 w-4'
      case 'md':
        return 'h-6 w-6'
      case 'lg':
        return 'h-8 w-8'
      default:
        return 'h-6 w-6'
    }
  }

  const getMessage = () => {
    if (isFetching && !isLoading) {
      return refetchingMessage
    }
    return loadingMessage
  }

  const getTitle = () => {
    if (isFetching && !isLoading) {
      return 'Refreshing'
    }
    return loadingTitle
  }

  const SpinnerIcon = getSpinnerIcon()

  return (
    <div className={className} role="status" aria-live="polite">
      <SpinnerIcon
        className={`${getSpinnerSize()} animate-spin text-primary mx-auto mb-3`}
        aria-hidden="true"
      />
      {showLoadingText && (
        <>
          <h3 className="text-lg font-medium text-foreground mb-1">
            {getTitle()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getMessage()}
          </p>
        </>
      )}
      <span className="sr-only">{getMessage()}</span>
    </div>
  )
}

/**
 * Enhanced loading state for TanStack Query mutations
 * Provides contextual loading indicators for mutation operations
 */
export const MutationLoadingState: React.FC<MutationLoadingStateProps> = ({
  mutationResult,
  loadingTitle = 'Processing',
  loadingMessage = 'Please wait...',
  className = 'text-center py-4',
  showLoadingText = true,
  spinnerSize = 'sm',
}) => {
  const { isLoading } = mutationResult

  if (!isLoading) {
    return null
  }

  const getSpinnerSize = () => {
    switch (spinnerSize) {
      case 'sm':
        return 'h-4 w-4'
      case 'md':
        return 'h-6 w-6'
      case 'lg':
        return 'h-8 w-8'
      default:
        return 'h-4 w-4'
    }
  }

  return (
    <div className={className} role="status" aria-live="polite">
      <Loader2
        className={`${getSpinnerSize()} animate-spin text-primary mx-auto mb-2`}
        aria-hidden="true"
      />
      {showLoadingText && (
        <>
          <h4 className="text-sm font-medium text-foreground mb-1">
            {loadingTitle}
          </h4>
          <p className="text-xs text-muted-foreground">
            {loadingMessage}
          </p>
        </>
      )}
      <span className="sr-only">{loadingMessage}</span>
    </div>
  )
}

/**
 * Skeleton loading state for content placeholders
 * Following Skeleton Pattern for content loading placeholders
 */
interface SkeletonLoadingProps {
  lines?: number
  className?: string
  showAvatar?: boolean
  showImage?: boolean
}

export const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({
  lines = 3,
  className = 'p-4',
  showAvatar = false,
  showImage = false,
}) => {
  return (
    <div className={className} role="status" aria-live="polite">
      {showImage && (
        <div className="w-full h-48 bg-muted rounded-lg mb-4 animate-pulse" />
      )}
      
      <div className="flex items-start space-x-3">
        {showAvatar && (
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse flex-shrink-0" />
        )}
        
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={`h-4 bg-muted rounded animate-pulse ${
                index === lines - 1 ? 'w-3/4' : 'w-full'
              }`}
            />
          ))}
        </div>
      </div>
      
      <span className="sr-only">Loading content...</span>
    </div>
  )
}

/**
 * Network-aware loading state with offline indicators
 * Following Network-Aware Pattern for offline/online state management
 */
interface NetworkAwareLoadingProps extends BaseQueryLoadingProps {
  isOnline?: boolean
  queryResult: UseQueryResult<unknown>
  offlineMessage?: string
  onlineMessage?: string
}

export const NetworkAwareLoading: React.FC<NetworkAwareLoadingProps> = ({
  isOnline = navigator.onLine,
  queryResult,
  offlineMessage = 'You appear to be offline. Data may be outdated.',
  onlineMessage = 'Loading latest data...',
  className = 'text-center py-6',
  spinnerSize = 'md',
}) => {
  const { isLoading, isFetching, error } = queryResult

  if (error || (!isLoading && !isFetching)) {
    return null
  }

  const getSpinnerSize = () => {
    switch (spinnerSize) {
      case 'sm':
        return 'h-4 w-4'
      case 'md':
        return 'h-6 w-6'
      case 'lg':
        return 'h-8 w-8'
      default:
        return 'h-6 w-6'
    }
  }

  const NetworkIcon = isOnline ? Wifi : WifiOff
  const message = isOnline ? onlineMessage : offlineMessage
  const iconColor = isOnline ? 'text-green-500' : 'text-amber-500'

  return (
    <div className={className} role="status" aria-live="polite">
      <div className="flex items-center justify-center space-x-2 mb-3">
        <Loader2
          className={`${getSpinnerSize()} animate-spin text-primary`}
          aria-hidden="true"
        />
        <NetworkIcon
          className={`h-4 w-4 ${iconColor}`}
          aria-hidden="true"
        />
      </div>
      
      <p className={`text-sm ${isOnline ? 'text-muted-foreground' : 'text-amber-600'}`}>
        {message}
      </p>
      
      <span className="sr-only">{message}</span>
    </div>
  )
}

/**
 * Specialized loading states for different query types
 */

export const EventsLoading: React.FC<{ queryResult: UseQueryResult<unknown> }> = ({
  queryResult,
}) => (
  <QueryLoadingState
    queryResult={queryResult}
    loadingTitle="Loading Events"
    loadingMessage="Discovering amazing events in your area..."
    refetchingMessage="Refreshing event listings..."
    spinnerSize="lg"
  />
)

export const CitiesLoading: React.FC<{ queryResult: UseQueryResult<unknown> }> = ({
  queryResult,
}) => (
  <QueryLoadingState
    queryResult={queryResult}
    loadingTitle="Loading Destinations"
    loadingMessage="Finding exciting destinations for you..."
    refetchingMessage="Updating destination information..."
    spinnerSize="lg"
  />
)

export const EventDetailLoading: React.FC<{ queryResult: UseQueryResult<unknown> }> = ({
  queryResult,
}) => (
  <QueryLoadingState
    queryResult={queryResult}
    loadingTitle="Loading Event Details"
    loadingMessage="Getting event information..."
    refetchingMessage="Updating event details..."
    spinnerSize="md"
    className="text-center py-12"
  />
)