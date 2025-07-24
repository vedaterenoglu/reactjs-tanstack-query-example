import { RefreshCw } from 'lucide-react'

import { EventCard } from '@/components/cards'
import { ScrollAnimateWrapper } from '@/components/ui/ScrollAnimateWrapper'
import type { Event } from '@/lib/types/event.types'

/**
 * EventGrid - Responsive events grid with animations
 * 
 * Displays events in a responsive grid layout with scroll animations,
 * results header, loading states, and event selection handling.
 * 
 * Design Patterns Applied:
 * - Presentational Component Pattern: Pure UI rendering with props
 * - Composition Pattern: ScrollAnimateWrapper + EventCard components
 * - Template Method Pattern: getResultsText for different result displays
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
