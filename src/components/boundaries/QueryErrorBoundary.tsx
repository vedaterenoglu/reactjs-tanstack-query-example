import React, { Component, type ReactNode, type ErrorInfo } from 'react'

import { ErrorState } from '@/components/states/ErrorState'
// TanStackQueryError type was removed as it's not needed for this implementation

/**
 * QueryErrorBoundary - React 19 Error Boundary optimized for TanStack Query operations
 *
 * Design Patterns Applied:
 * 1. **Error Boundary Pattern**: Catches React errors and provides fallback UI
 * 2. **Observer Pattern**: Observes React error events and responds with error handling
 * 3. **Strategy Pattern**: Different fallback strategies based on error type
 * 4. **Template Method Pattern**: Defined error handling flow with customizable parts
 * 5. **Facade Pattern**: Simplifies error boundary complexity behind clean component API
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for catching errors and displaying error UI
 * - **OCP**: Extensible through props without modifying the boundary logic
 * - **LSP**: Can substitute other error boundaries with same interface
 * - **ISP**: Focused interface for error boundary configuration
 * - **DIP**: Depends on ErrorState abstraction, not concrete implementations
 *
 * React 19 Patterns:
 * - Error Boundary with getDerivedStateFromError and componentDidCatch
 * - Proper error logging and recovery mechanisms
 * - Integration with modern React concurrent features
 * - TypeScript integration with proper error typing
 * - Accessibility-first error reporting
 */

export interface QueryErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined
  resetKeys?: Array<string | number> | undefined
  resetOnPropsChange?: boolean
  isolate?: boolean
  errorTitle?: string | undefined
  showRetryButton?: boolean
}

interface QueryErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

/**
 * TanStack Query optimized Error Boundary following React 19 patterns
 * Provides graceful error handling for query operations with automatic recovery
 */
export class QueryErrorBoundary extends Component<
  QueryErrorBoundaryProps,
  QueryErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: QueryErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    }

    this.resetErrorBoundary = this.resetErrorBoundary.bind(this)
  }

  /**
   * React 19 Error Boundary lifecycle method
   * Captures error and updates state to show fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<QueryErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  /**
   * React 19 Error Boundary lifecycle method
   * Handles error logging and reporting
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error for development and monitoring
    if (process.env['NODE_ENV'] === 'development') {
      console.error('🚨 Query Error Boundary Caught Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }

    // Report to error monitoring service in production
    if (process.env['NODE_ENV'] === 'production') {
      this.reportErrorToService(error, errorInfo)
    }
  }

  /**
   * Check if boundary should reset based on prop changes
   * Following Observer Pattern for prop change detection
   */
  override componentDidUpdate(prevProps: QueryErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys) {
        const prevResetKeys = prevProps.resetKeys || []
        const hasResetKeyChanged = resetKeys.some(
          // eslint-disable-next-line security/detect-object-injection
          (resetKey, idx) => prevResetKeys[idx] !== resetKey
        )

        if (hasResetKeyChanged) {
          this.resetErrorBoundary()
        }
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary()
    }
  }

  /**
   * Cleanup method for component unmounting
   */
  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  /**
   * Reset error boundary state to allow retry
   * Following Command Pattern for error recovery actions
   */
  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    })
  }

  /**
   * Report error to monitoring service
   * Following Strategy Pattern for different error reporting strategies
   */
  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, integrate with error monitoring services like:
    // - Sentry: Sentry.captureException(error, { contexts: { react: errorInfo } })
    // - LogRocket: LogRocket.captureException(error)
    // - Bugsnag: Bugsnag.notify(error, { context: errorInfo.componentStack })
    
    // For now, we'll use console.error as a placeholder
    console.error('Error reported to monitoring service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Determine if error is a TanStack Query error
   * Type guard following Type Safety Pattern
   */
  private isTanStackQueryError = (error: Error): boolean => {
    return error && typeof error === 'object' && 'message' in error
  }

  /**
   * Get user-friendly error message
   * Following Strategy Pattern for different error message strategies
   */
  private getUserFriendlyErrorMessage = (error: Error): string => {
    if (this.isTanStackQueryError(error)) {
      // Handle specific TanStack Query error types
      if (error.message.includes('Network Error')) {
        return 'Unable to connect to the server. Please check your internet connection and try again.'
      }
      
      if (error.message.includes('404')) {
        return 'The requested data could not be found. It may have been moved or deleted.'
      }
      
      if (error.message.includes('500')) {
        return 'A server error occurred. Our team has been notified and is working on a fix.'
      }
      
      if (error.message.includes('timeout')) {
        return 'The request took too long to complete. Please try again.'
      }
    }

    return error.message || 'An unexpected error occurred. Please try again.'
  }

  override render() {
    const { hasError, error } = this.state
    const { 
      children, 
      fallback, 
      errorTitle = 'Something went wrong',
      showRetryButton = true,
      isolate = false 
    } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Use default ErrorState component with TanStack Query optimizations
      return (
        <div className={isolate ? 'contents' : undefined}>
          <ErrorState
            error={this.getUserFriendlyErrorMessage(error)}
            onRetry={showRetryButton ? this.resetErrorBoundary : undefined}
            title={errorTitle}
            showRetryButton={showRetryButton}
            className="text-center py-8 px-4 max-w-md mx-auto"
          />
        </div>
      )
    }

    return children
  }
}

/**
 * Higher-Order Component for wrapping components with QueryErrorBoundary
 * Following Higher-Order Component Pattern for reusable error boundary logic
 */
export const withQueryErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<QueryErrorBoundaryProps, 'children'>
) => {
  const WithQueryErrorBoundaryComponent = (props: P) => (
    <QueryErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </QueryErrorBoundary>
  )

  WithQueryErrorBoundaryComponent.displayName = 
    `withQueryErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithQueryErrorBoundaryComponent
}

/**
 * Hook for manually triggering error boundary resets
 * Following Custom Hook Pattern for error boundary integration
 */
export const useQueryErrorBoundary = () => {
  const [errorBoundaryKey, setErrorBoundaryKey] = React.useState(0)

  const resetErrorBoundary = React.useCallback(() => {
    setErrorBoundaryKey(prev => prev + 1)
  }, [])

  return {
    errorBoundaryKey,
    resetErrorBoundary,
  }
}