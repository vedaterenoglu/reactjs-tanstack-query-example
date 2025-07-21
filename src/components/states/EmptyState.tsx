import { MapPin, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * EmptyState Component - Context-aware empty state with search-specific messaging and actions
 * 
 * Current Features:
 * - Semantic container with role="status" and aria-live="polite"
 * - Context-aware messaging: different text for search vs general empty states
 * - MapPin icon for visual empty state indication
 * - Dynamic heading and description based on search activity
 * - Optional refresh button with RefreshCw icon and ARIA labeling
 * - Search query display when no results found for specific search
 * - Conditional rendering - returns null when isEmpty is false
 * - Flexible styling via className prop (default: centered with padding)
 * - Screen reader optimized with proper status announcements
 * 
 * Design Patterns Applied:
 * - Container/Presentational Pattern: Pure presentational component for empty state UI
 * - Conditional Messaging Pattern: Different messages based on search vs general empty
 * - Event Handler Pattern: Delegates refresh action to parent via onRefresh callback
 * - Composition Pattern: Composes MapPin icon, headings, descriptions, and Button
 * - State Discrimination Pattern: Behavior changes based on isSearchActive prop
 * 
 * SOLID Principles:
 * - SRP: Only handles empty state display and context-aware messaging
 * - OCP: Extensible via props (className, showRefreshButton, onRefresh)
 * - LSP: Can substitute other empty state components with same interface
 * - ISP: Focused EmptyStateProps interface for empty state configuration
 * - DIP: Depends on Button component and icon component abstractions
 * 
 * React 19 Patterns:
 * - Props Interface Pattern: EmptyStateProps with optional configuration
 * - Performance Pattern: Lightweight component with early null return
 * - Conditional Rendering: Returns null when isEmpty prop is false
 * - Props Discrimination: Different rendering based on isSearchActive state
 * - Accessibility Pattern: Comprehensive ARIA attributes and semantic HTML
 * 
 * Semantic HTML & Accessibility:
 * - Container with role="status" for screen reader empty state announcements
 * - aria-live="polite" for non-intrusive empty state notifications
 * - <h2> for empty state title following proper heading hierarchy
 * - <p> for empty state description with semantic text structure
 * - Button with descriptive text and refresh action
 * - MapPin icon with proper visual indication role
 * 
 * Context-Aware Messaging:
 * - Search Active: "No results found" with search query display
 * - General Empty: "No destinations available" with generic messaging
 * - Actionable refresh button for data reloading in both contexts
 */

interface EmptyStateProps {
  isEmpty?: boolean
  isSearchActive?: boolean
  searchQuery?: string
  onRefresh?: (() => void) | undefined
  className?: string
  showRefreshButton?: boolean
}

export const EmptyState = ({
  isEmpty = false,
  isSearchActive = false,
  searchQuery = '',
  onRefresh,
  className = "text-center py-12",
  showRefreshButton = true
}: EmptyStateProps) => {
  if (!isEmpty) {
    return null
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  const getTitle = () => {
    return isSearchActive ? 'No Cities Found' : 'No Cities Available'
  }

  const getMessage = () => {
    if (isSearchActive) {
      return `No destinations match "${searchQuery}". Try a different search term.`
    }
    return 'There are currently no cities available for booking.'
  }

  const shouldShowRefreshButton = showRefreshButton && !isSearchActive && onRefresh

  return (
    <div className={className} role="status" aria-live="polite">
      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {getTitle()}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {getMessage()}
      </p>
      {shouldShowRefreshButton && (
        <Button 
          onClick={handleRefresh} 
          variant="outline"
          aria-label="Refresh cities data"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Cities
        </Button>
      )}
    </div>
  )
}