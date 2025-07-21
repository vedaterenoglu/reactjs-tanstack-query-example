import { ErrorState, LoadingState, EmptyState } from '@/components/states'

/**
 * StateFrame Component - Unified state management wrapper with clear precedence hierarchy
 * 
 * Current Features:
 * - Single wrapper component handling error, loading, empty, and content states
 * - Clear state precedence: Error > Loading > Empty > Content (children)
 * - Flexible error state with configurable title and retry handler
 * - Loading state with customizable title and message
 * - Empty state with search-aware messaging (isSearchActive, searchQuery)
 * - Content rendering via children prop when all states are inactive
 * - Container className support for consistent styling
 * - TypeScript interfaces with proper optional property types
 * 
 * Design Patterns Applied:
 * - State Pattern: Encapsulates UI states (error, loading, empty, content) in single frame
 * - Strategy Pattern: Different rendering strategies based on state conditions with precedence
 * - Guard Clause Pattern: Early returns for each state with clear hierarchical precedence
 * - Composition Pattern: Composes ErrorState, LoadingState, EmptyState within wrapper
 * - Wrapper Pattern: Wraps children content when not in error/loading/empty states
 * 
 * SOLID Principles:
 * - SRP: Only handles state precedence logic and conditional state component rendering
 * - OCP: Extensible via props (new titles, messages, handlers) without modifying logic
 * - LSP: Can substitute other state management frames with same interface
 * - ISP: Focused StateFrameProps interface for state management and content rendering
 * - DIP: Depends on ErrorState, LoadingState, EmptyState component abstractions
 * 
 * React 19 Patterns:
 * - Conditional Rendering Pattern: Clean precedence-based rendering with early returns
 * - Performance Pattern: Renders only active state component, zero overhead for inactive states
 * - Props Interface Pattern: Comprehensive StateFrameProps with optional configuration
 * - Composition Pattern: Reusable state frame for any loading/error/empty scenario
 * - Children Pattern: Renders children content when not in special states
 * 
 * State Precedence Hierarchy (highest to lowest priority):
 * 1. Error State (error prop truthy) - Critical failures needing immediate attention
 * 2. Loading State (isLoading && !hasData) - Active operations blocking interaction
 * 3. Empty State (isEmpty) - No data scenarios requiring user guidance
 * 4. Content State (children) - Successful data display when all above are false
 * 
 * Usage Pattern:
 * <StateFrame error={error} isLoading={loading} isEmpty={empty} onRetry={retry}>
 *   <ActualContent /> <!-- Only renders when no error/loading/empty -->
 * </StateFrame>
 */

interface StateFrameProps {
  // Error state props
  error?: string | null
  onRetry?: (() => void) | undefined
  errorTitle?: string
  
  // Loading state props
  isLoading?: boolean
  hasData?: boolean
  loadingTitle?: string
  loadingMessage?: string
  
  // Empty state props
  isEmpty?: boolean
  isSearchActive?: boolean
  searchQuery?: string
  onRefresh?: (() => void) | undefined
  
  // Content to render when not in error/loading/empty state
  children?: React.ReactNode
  
  // Container props
  className?: string
}

export const StateFrame = ({
  // Error state
  error,
  onRetry,
  errorTitle = "Unable to Load Data",
  
  // Loading state
  isLoading = false,
  hasData = false,
  loadingTitle = "Loading",
  loadingMessage = "Please wait...",
  
  // Empty state
  isEmpty = false,
  isSearchActive = false,
  searchQuery = '',
  onRefresh,
  
  // Content and container
  children,
  className = '',
}: StateFrameProps) => {
  
  // State precedence: Error > Loading > Empty > Content
  
  // 1. Error State (highest priority)
  if (error) {
    return (
      <div className={className}>
        <ErrorState 
          error={error}
          onRetry={onRetry}
          title={errorTitle}
        />
      </div>
    )
  }
  
  // 2. Loading State (blocks interaction)
  if (isLoading && !hasData) {
    return (
      <div className={className}>
        <LoadingState 
          isLoading={true}
          title={loadingTitle}
          message={loadingMessage}
        />
      </div>
    )
  }
  
  // 3. Empty State (no data to display)
  if (isEmpty) {
    return (
      <div className={className}>
        <EmptyState 
          isEmpty={true}
          isSearchActive={isSearchActive}
          searchQuery={searchQuery}
          onRefresh={onRefresh}
        />
      </div>
    )
  }
  
  // 4. Content State (successful data display)
  return (
    <div className={className}>
      {children}
    </div>
  )
}