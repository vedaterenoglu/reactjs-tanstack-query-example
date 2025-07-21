import { RefreshCw } from 'lucide-react'

/**
 * LoadingState Component - Accessible loading display with spinner animation and status semantics
 *
 * Current Features:
 * - Semantic loading container with role="status" and aria-live="polite"
 * - Animated RefreshCw spinner icon with configurable sizes (sm/md/lg)
 * - Configurable loading title (default: "Loading Destinations")
 * - Descriptive loading message (default: "Fetching available cities for you...")
 * - Hidden screen reader text for non-visual loading indication
 * - Conditional rendering - returns null when isLoading is false
 * - Flexible styling via className prop (default: centered with padding)
 * - Switch-based spinner size calculation for consistent sizing
 *
 * Design Patterns Applied:
 * - Container/Presentational Pattern: Pure presentational component for loading UI
 * - Animation Pattern: CSS animation classes for smooth spinner rotation
 * - Conditional Rendering Pattern: Early return null when not in loading state
 * - Composition Pattern: Composes spinner icon, heading, message, and screen reader text
 * - Strategy Pattern: getSpinnerClass switch for different size strategies
 *
 * SOLID Principles:
 * - SRP: Only handles loading display, spinner animation, and accessibility
 * - OCP: Extensible via props (title, message, className, spinnerSize)
 * - LSP: Can substitute other loading display components with same interface
 * - ISP: Focused LoadingStateProps interface for loading display configuration
 * - DIP: Depends on RefreshCw icon component abstraction
 *
 * React 19 Patterns:
 * - Props Interface Pattern: LoadingStateProps with optional configuration
 * - Performance Pattern: Lightweight component with early null return
 * - Conditional Rendering: Returns null when isLoading prop is false
 * - Strategy Pattern: Switch-based size calculation for spinner classes
 * - Accessibility Pattern: Comprehensive ARIA attributes and screen reader support
 *
 * Semantic HTML & Accessibility:
 * - Container with role="status" for screen reader loading announcements
 * - aria-live="polite" for non-intrusive loading state updates
 * - <h2> for loading title following proper heading hierarchy
 * - <p> for loading message with semantic text structure
 * - Hidden <span> with sr-only class for screen reader loading indication
 * - Spinner icon animation with smooth CSS transitions
 *
 * Spinner Size Options:
 * - 'sm': h-6 w-6 (24px) for compact loading indicators
 * - 'md': h-8 w-8 (32px) for medium loading displays
 * - 'lg': h-12 w-12 (48px) for prominent loading states (default)
 */

interface LoadingStateProps {
  isLoading?: boolean
  title?: string
  message?: string
  className?: string
  spinnerSize?: 'sm' | 'md' | 'lg'
}

export const LoadingState = ({
  isLoading = true,
  title = 'Loading Destinations',
  message = 'Fetching available cities for you...',
  className = 'text-center py-12',
  spinnerSize = 'lg',
}: LoadingStateProps) => {
  if (!isLoading) {
    return null
  }

  const getSpinnerClass = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6'
      case 'md':
        return 'h-8 w-8'
      case 'lg':
        return 'h-12 w-12'
      default:
        return 'h-12 w-12'
    }
  }

  return (
    <div className={className} role="status" aria-live="polite">
      <RefreshCw
        className={`${getSpinnerClass(spinnerSize)} animate-spin text-muted-foreground mx-auto mb-4`}
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground">{message}</p>
      <span className="sr-only">Loading, please wait...</span>
    </div>
  )
}
