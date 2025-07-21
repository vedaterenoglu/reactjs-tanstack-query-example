import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * ErrorState Component - Accessible error display with retry functionality and alert semantics
 * 
 * Current Features:
 * - Semantic error container with role="alert" and aria-live="polite"
 * - AlertCircle icon for visual error indication
 * - Configurable error title (default: "Unable to Load Cities")
 * - Error message display with proper paragraph semantics
 * - Optional retry button with RefreshCw icon and ARIA labeling
 * - Conditional rendering - returns null when no error prop
 * - Flexible styling via className prop (default: centered with padding)
 * - Screen reader optimized with proper ARIA attributes
 * 
 * Design Patterns Applied:
 * - Container/Presentational Pattern: Pure presentational component for error UI
 * - Error Boundary Ready Pattern: Designed to integrate with error boundaries
 * - Event Handler Pattern: Delegates retry action to parent via onRetry callback
 * - Composition Pattern: Composes AlertCircle icon, heading, text, and Button
 * - Conditional Rendering Pattern: Early return null when no error to display
 * 
 * SOLID Principles:
 * - SRP: Only handles error message display and retry action delegation
 * - OCP: Extensible via props (title, className, showRetryButton, onRetry)
 * - LSP: Can substitute other error display components with same interface
 * - ISP: Focused ErrorStateProps interface for error display configuration
 * - DIP: Depends on Button component abstraction and icon components
 * 
 * React 19 Patterns:
 * - Props Interface Pattern: ErrorStateProps with optional configuration
 * - Performance Pattern: Lightweight component with early null return
 * - Conditional Rendering: Returns null when error prop is falsy
 * - Event Handling: Optional retry handler with proper conditional execution
 * - Accessibility Pattern: Comprehensive ARIA attributes and semantic HTML
 * 
 * Semantic HTML & Accessibility:
 * - Container with role="alert" for immediate screen reader announcement
 * - aria-live="polite" for non-intrusive error notifications
 * - <h2> for error title following proper heading hierarchy
 * - <p> for error message with semantic text structure
 * - Button with aria-label for descriptive retry action context
 * - AlertCircle and RefreshCw icons with proper semantic roles
 */

interface ErrorStateProps {
  error?: string | null
  onRetry?: (() => void) | undefined
  title?: string
  className?: string
  showRetryButton?: boolean
}

export const ErrorState = ({
  error,
  onRetry,
  title = "Unable to Load Cities",
  className = "text-center py-12",
  showRetryButton = true
}: ErrorStateProps) => {
  if (!error) {
    return null
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    }
  }

  return (
    <div className={className} role="alert" aria-live="polite">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {error}
      </p>
      {showRetryButton && onRetry && (
        <Button 
          onClick={handleRetry} 
          variant="outline"
          aria-label="Retry loading data"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}