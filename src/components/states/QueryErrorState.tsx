import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock, 
  Server,
  ShieldAlert,
  HelpCircle 
} from 'lucide-react'
import React from 'react'

import { Button } from '@/components/ui/button'
import type { UseQueryResult, TanStackQueryError } from '@/lib/types/tanstack-query.types'

/**
 * QueryErrorState - TanStack Query specific error states with enhanced UX patterns
 *
 * Design Patterns Applied:
 * 1. **Strategy Pattern**: Different error display strategies based on error type
 * 2. **Factory Pattern**: Error message and icon factories based on error classification
 * 3. **Observer Pattern**: Observes TanStack Query error states and responds accordingly
 * 4. **Command Pattern**: Retry actions encapsulated as commands
 * 5. **Template Method Pattern**: Defined error display flow with customizable parts
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for displaying TanStack Query error states
 * - **OCP**: Extensible through error type detection without modifying core logic
 * - **LSP**: Can substitute other error components with same interface
 * - **ISP**: Focused interfaces for different error state scenarios
 * - **DIP**: Depends on icon and button component abstractions
 *
 * React 19 Patterns:
 * - Conditional rendering based on TanStack Query error types
 * - Performance optimized with error classification and memoization
 * - Accessibility-first error reporting with proper ARIA attributes
 * - TypeScript integration with TanStack Query error types
 * - Modern React patterns with functional components and hooks
 */

interface BaseErrorProps {
  className?: string
  showRetryButton?: boolean
  retryButtonText?: string
}

export interface QueryErrorStateProps extends BaseErrorProps {
  queryResult: UseQueryResult<unknown>
  onRetry?: (() => void) | undefined
  fallbackTitle?: string
  fallbackMessage?: string
}

interface CustomQueryErrorProps extends BaseErrorProps {
  error: TanStackQueryError | Error
  onRetry?: () => void
  title?: string
  message?: string
}

/**
 * Error type classification for different error handling strategies
 */
type ErrorType = 
  | 'network'
  | 'timeout'
  | 'server'
  | 'notFound'
  | 'unauthorized'
  | 'forbidden'
  | 'unknown'

/**
 * Enhanced error state for TanStack Query operations
 * Provides contextual error messages and recovery options based on error type
 */
export const QueryErrorState: React.FC<QueryErrorStateProps> = ({
  queryResult,
  onRetry,
  fallbackTitle = 'Something went wrong',
  fallbackMessage = 'An unexpected error occurred. Please try again.',
  className = 'text-center py-8 px-4',
  showRetryButton = true,
  retryButtonText = 'Try Again',
}) => {
  const { error, refetch } = queryResult

  if (!error) {
    return null
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      void refetch()
    }
  }

  const errorType = classifyError(error)
  const errorConfig = getErrorConfig(errorType)
  const errorMessage = getErrorMessage(error, errorType)

  const ErrorIcon = errorConfig.icon

  return (
    <div className={className} role="alert" aria-live="assertive">
      <ErrorIcon 
        className={`h-12 w-12 mx-auto mb-4 ${errorConfig.iconColor}`}
        aria-hidden="true"
      />
      
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {errorConfig.title || fallbackTitle}
      </h2>
      
      <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
        {errorMessage || fallbackMessage}
      </p>

      {errorConfig.showHelpText && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">
            {errorConfig.helpText}
          </p>
        </div>
      )}

      {showRetryButton && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={handleRetry}
            variant="default"
            className="min-w-[120px]"
            aria-label={`${retryButtonText} - ${errorConfig.title}`}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryButtonText}
          </Button>

          {errorConfig.showSecondaryAction && (
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="min-w-[120px]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          )}
        </div>
      )}

      {import.meta.env.DEV && (
        <details className="mt-6 text-left max-w-md mx-auto">
          <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
            Debug Information
          </summary>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

/**
 * Custom error state with manual error specification
 */
export const CustomQueryError: React.FC<CustomQueryErrorProps> = ({
  error,
  onRetry,
  title,
  message,
  className = 'text-center py-8 px-4',
  showRetryButton = true,
  retryButtonText = 'Try Again',
}) => {
  if (!error) {
    return null
  }

  const errorType = classifyError(error)
  const errorConfig = getErrorConfig(errorType)
  const ErrorIcon = errorConfig.icon

  return (
    <div className={className} role="alert" aria-live="assertive">
      <ErrorIcon 
        className={`h-12 w-12 mx-auto mb-4 ${errorConfig.iconColor}`}
        aria-hidden="true"
      />
      
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {title || errorConfig.title}
      </h2>
      
      <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
        {message || getErrorMessage(error, errorType)}
      </p>

      {showRetryButton && onRetry && (
        <Button
          onClick={onRetry}
          variant="default"
          className="min-w-[120px]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {retryButtonText}
        </Button>
      )}
    </div>
  )
}

/**
 * Network-aware error state with offline handling
 */
export const NetworkAwareError: React.FC<{
  queryResult: UseQueryResult<unknown>
  onRetry?: () => void
  isOnline?: boolean
}> = ({
  queryResult,
  onRetry,
  isOnline = navigator.onLine,
}) => {
  const { error } = queryResult

  if (!error) {
    return null
  }

  if (!isOnline) {
    return (
      <div className="text-center py-8 px-4" role="alert">
        <WifiOff className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          You're Offline
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Please check your internet connection and try again.
        </p>
        <Button
          onClick={onRetry || (() => queryResult.refetch())}
          variant="default"
        >
          <Wifi className="mr-2 h-4 w-4" />
          Retry when online
        </Button>
      </div>
    )
  }

  return (
    <QueryErrorState
      queryResult={queryResult}
      onRetry={onRetry}
    />
  )
}

/**
 * Specialized error states for different domains
 */
export const EventsError: React.FC<{ queryResult: UseQueryResult<unknown> }> = ({
  queryResult,
}) => (
  <QueryErrorState
    queryResult={queryResult}
    fallbackTitle="Unable to Load Events"
    fallbackMessage="We couldn't load the events right now. Please check your connection and try again."
  />
)

export const CitiesError: React.FC<{ queryResult: UseQueryResult<unknown> }> = ({
  queryResult,
}) => (
  <QueryErrorState
    queryResult={queryResult}
    fallbackTitle="Unable to Load Destinations"
    fallbackMessage="We couldn't load the destinations right now. Please check your connection and try again."
  />
)

export const EventDetailError: React.FC<{ queryResult: UseQueryResult<unknown> }> = ({
  queryResult,
}) => (
  <QueryErrorState
    queryResult={queryResult}
    fallbackTitle="Event Not Found"
    fallbackMessage="The event you're looking for might have been moved or doesn't exist."
    className="text-center py-12 px-4"
  />
)

/**
 * Utility functions for error classification and configuration
 */

function classifyError(error: TanStackQueryError | Error): ErrorType {
  const message = error.message.toLowerCase()

  if (message.includes('network') || message.includes('fetch')) {
    return 'network'
  }
  
  if (message.includes('timeout') || message.includes('aborted')) {
    return 'timeout'
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return 'notFound'
  }
  
  if (message.includes('401') || message.includes('unauthorized')) {
    return 'unauthorized'
  }
  
  if (message.includes('403') || message.includes('forbidden')) {
    return 'forbidden'
  }
  
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return 'server'
  }

  return 'unknown'
}

function getErrorConfig(errorType: ErrorType) {
  const configs = {
    network: {
      icon: WifiOff,
      iconColor: 'text-amber-500',
      title: 'Connection Problem',
      showHelpText: true,
      helpText: 'Check your internet connection and try again.',
      showSecondaryAction: false,
    },
    timeout: {
      icon: Clock,
      iconColor: 'text-amber-500',
      title: 'Request Timed Out',
      showHelpText: true,
      helpText: 'The request took too long. This might be due to a slow connection.',
      showSecondaryAction: false,
    },
    server: {
      icon: Server,
      iconColor: 'text-red-500',
      title: 'Server Error',
      showHelpText: true,
      helpText: 'Our servers are having issues. Please try again in a few minutes.',
      showSecondaryAction: true,
    },
    notFound: {
      icon: HelpCircle,
      iconColor: 'text-blue-500',
      title: 'Not Found',
      showHelpText: false,
      helpText: '',
      showSecondaryAction: false,
    },
    unauthorized: {
      icon: ShieldAlert,
      iconColor: 'text-red-500',
      title: 'Access Denied',
      showHelpText: true,
      helpText: 'You need to be logged in to access this content.',
      showSecondaryAction: false,
    },
    forbidden: {
      icon: ShieldAlert,
      iconColor: 'text-red-500',
      title: 'Access Forbidden',
      showHelpText: true,
      helpText: 'You don\'t have permission to access this content.',
      showSecondaryAction: false,
    },
    unknown: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      title: 'Something went wrong',
      showHelpText: false,
      helpText: '',
      showSecondaryAction: true,
    },
  }

  // eslint-disable-next-line security/detect-object-injection
  return configs[errorType]
}

function getErrorMessage(error: TanStackQueryError | Error, errorType: ErrorType): string {
  const userFriendlyMessages = {
    network: 'Unable to connect to our servers. Please check your internet connection and try again.',
    timeout: 'The request took too long to complete. Please try again.',
    server: 'Our servers are experiencing issues. Please try again in a few minutes.',
    notFound: 'The content you\'re looking for could not be found.',
    unauthorized: 'Please log in to access this content.',
    forbidden: 'You don\'t have permission to access this content.',
    unknown: error.message || 'An unexpected error occurred. Please try again.',
  }

  // eslint-disable-next-line security/detect-object-injection
  return userFriendlyMessages[errorType]
}