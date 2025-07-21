import { RefreshCw } from 'lucide-react'

import { EventCard } from '@/components/cards'
import { ScrollAnimateWrapper } from '@/components/ui/ScrollAnimateWrapper'
import type { Event } from '@/lib/types/event.types'

/**
 * EventGrid Component - Semantic events list with results header and scroll animations
 *
 * Current Features:
 * - Semantic <section> with proper ARIA labeling for screen readers
 * - Results header with <h3> showing event count and search context
 * - Loading indicator for partial updates (refresh during search/filter)
 * - Semantic <ul>/<li> list structure instead of generic div grid
 * - ScrollAnimateWrapper with fadeUp animation (0.1 threshold, 600ms duration)
 * - EventCard components with click handling and responsive layout
 * - Load more hint when results exceed maxEvents limit
 * - Conditional rendering based on search/filter state vs all events view
 * - Support for custom grid classes and responsive layouts
 *
 * Design Patterns Applied:
 * - Container/Presentational Pattern: Pure presentational grid with semantic list structure
 * - Composition Pattern: Composes ScrollAnimateWrapper around <ul> of EventCard components
 * - Template Method Pattern: getResultsText() handles different result display strategies
 * - Performance Pattern: Conditional rendering and optimized list structure
 * - Event Handler Pattern: Delegates event selection to parent via onEventSelect prop
 *
 * SOLID Principles:
 * - SRP: Handles events list display, results header, loading states, and load more hints
 * - OCP: Extensible via props (gridClasses, maxEvents, showActionButton, className)
 * - LSP: Can substitute other grid implementations with same EventGridProps interface
 * - ISP: Focused interface accepting only grid display and event interaction props
 * - DIP: Depends on EventCard, ScrollAnimateWrapper, and RefreshCw icon abstractions
 *
 * React 19 Patterns:
 * - Props Interface Pattern: Comprehensive EventGridProps with optional properties
 * - Performance Pattern: Early return when !hasResults, lightweight list rendering
 * - Conditional Rendering: Results header, loading indicator, load more hint
 * - Composition Pattern: Reusable grid layout with animated event cards
 * - Accessibility Pattern: Semantic <section>, <ul>/<li>, proper ARIA labels
 *
 * Semantic HTML Structure:
 * - <section> with role="region" and aria-label="Events grid"
 * - Results header with semantic <h3> element for content hierarchy
 * - <ul> with role="list" containing <li> elements for each event
 * - Proper heading hierarchy (h3 for results within page structure)
 */

interface EventGridProps {
  events: Event[]
  hasResults?: boolean
  isLoading?: boolean
  isSearchActive?: boolean
  searchQuery?: string
  filteredCount?: number
  maxEvents?: number | undefined
  gridClasses?: string
  onEventSelect?: ((event: Event) => void) | undefined
  showActionButton?: boolean
  className?: string
  cityContext?: string | undefined // For displaying "Events in {city}" context
}

export const EventGrid = ({
  events,
  hasResults = false,
  isLoading = false,
  isSearchActive = false,
  searchQuery = '',
  filteredCount = 0,
  maxEvents,
  gridClasses = 'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  onEventSelect,
  showActionButton = true,
  className = '',
  cityContext,
}: EventGridProps) => {
  if (!hasResults) {
    return null
  }

  const getResultsText = () => {
    if (isSearchActive) {
      return (
        <>
          Showing {events.length} of {filteredCount} events for "{searchQuery}"
          {cityContext && (
            <span className="text-muted-foreground"> in {cityContext}</span>
          )}
          {maxEvents && filteredCount > maxEvents && (
            <span className="ml-2 text-xs">(limited to first {maxEvents})</span>
          )}
        </>
      )
    }

    return (
      <>
        {events.length} event{events.length !== 1 ? 's' : ''} available
        {cityContext && (
          <span className="text-muted-foreground"> in {cityContext}</span>
        )}
        {maxEvents && filteredCount > maxEvents && (
          <span className="ml-2 text-xs">(showing first {maxEvents})</span>
        )}
      </>
    )
  }

  const shouldShowLoadMoreHint = maxEvents && filteredCount > maxEvents

  return (
    <section className={className} role="region" aria-label="Events grid">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm text-muted-foreground font-normal">
          {getResultsText()}
        </h3>

        {/* Loading Indicator for Partial Updates */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Events Grid */}
      <ScrollAnimateWrapper animation="fadeUp" threshold={0.1} duration={600}>
        <ul className={gridClasses} role="list">
          {events.map(event => (
            <li key={event.slug} className="list-none">
              <EventCard
                event={event}
                onClick={onEventSelect || undefined}
                disabled={isLoading}
                showActionButton={showActionButton}
              />
            </li>
          ))}
        </ul>
      </ScrollAnimateWrapper>

      {/* Load More Hint */}
      {shouldShowLoadMoreHint && (
        <div className="text-center mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {filteredCount - maxEvents} more events available. Try refining your
            search to see specific events.
          </p>
        </div>
      )}
    </section>
  )
}
