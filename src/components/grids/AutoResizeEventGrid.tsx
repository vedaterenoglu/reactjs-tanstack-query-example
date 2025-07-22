import { RefreshCw } from 'lucide-react'

import { EventCard } from '@/components/cards'
import { ScrollAnimateWrapper } from '@/components/ui/ScrollAnimateWrapper'
import type { Event } from '@/lib/types/event.types'

/**
 * AutoResizeEventGrid Component - Auto-resizing responsive grid for 3:2 aspect ratio event cards
 *
 * Design Patterns Applied:
 * 1. **Auto-Layout Grid Pattern**: CSS Grid with auto-fit for responsive column count
 * 2. **Container Query Pattern**: Grid adapts to available container space
 * 3. **Responsive Design Pattern**: Fluid grid with minimum/maximum card sizes
 * 4. **Template Method Pattern**: Consistent results header and loading patterns
 * 5. **Composition Pattern**: Composes ScrollAnimateWrapper with responsive grid
 *
 * SOLID Principles:
 * - **SRP**: Handles only auto-resizing event grid layout and display
 * - **OCP**: Extensible via props without modifying core grid logic
 * - **LSP**: Can substitute EventGrid with same interface contract
 * - **ISP**: Focused interface for auto-resizing grid operations
 * - **DIP**: Depends on EventCard and ScrollAnimateWrapper abstractions
 *
 * React 19 Patterns:
 * - **Custom Hook Integration**: Ready for useGrid custom hook
 * - **Performance Pattern**: Efficient grid rendering with minimal re-layouts
 * - **Accessibility Pattern**: Semantic HTML with proper ARIA labels
 * - **Composition Pattern**: Reusable grid layout with event cards
 *
 * Key Features:
 * - Auto-resizing grid columns based on available space
 * - Maintains 3:2 aspect ratio for all event cards
 * - Responsive breakpoints: 280px (mobile) to 400px (desktop) card width
 * - Semantic HTML structure with proper accessibility
 * - Loading states and result headers
 * - Smooth scroll animations with intersection observer
 */

interface AutoResizeEventGridProps {
  events: Event[]
  hasResults?: boolean
  isLoading?: boolean
  isSearchActive?: boolean
  searchQuery?: string
  filteredCount?: number
  maxEvents?: number | undefined
  onEventSelect?: ((event: Event) => void) | undefined
  showActionButton?: boolean
  className?: string
  cityContext?: string | undefined
  variant?: 'default' | 'compact'
}

export const AutoResizeEventGrid = ({
  events,
  hasResults = false,
  isLoading = false,
  isSearchActive = false,
  searchQuery = '',
  filteredCount = 0,
  maxEvents,
  onEventSelect,
  showActionButton = true,
  className = '',
  cityContext,
  variant = 'default',
}: AutoResizeEventGridProps) => {
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

  // Auto-resizing grid classes with CSS Grid auto-fit
  // Responsive card sizes: 280px (mobile) to 400px (desktop)
  const gridClasses = variant === 'compact'
    ? 'grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] auto-rows-fr'
    : 'grid gap-6 grid-cols-[repeat(auto-fit,minmax(320px,400px))] auto-rows-fr justify-center'

  return (
    <section className={className} role="region" aria-label="Auto-resizing events grid">
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

      {/* Auto-Resizing Events Grid */}
      <ScrollAnimateWrapper animation="fadeUp" threshold={0.1} duration={600}>
        <div className={gridClasses} role="grid" aria-label="Events grid container">
          {events.map(event => (
            <div 
              key={event.slug} 
              className="min-h-0" 
              role="gridcell"
              aria-label={`Event: ${event.name}`}
            >
              <EventCard
                event={event}
                onClick={onEventSelect || undefined}
                disabled={isLoading}
                showActionButton={showActionButton}
                variant={variant}
                className="h-full"
              />
            </div>
          ))}
        </div>
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