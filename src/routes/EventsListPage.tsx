import { useCallback, useState } from 'react'

import { EventsStateFrame } from '@/components/frames'
import { EventGrid } from '@/components/grids/EventGrid'
import { useEventsWithInit } from '@/lib/hooks/useEvents'
import type { Event } from '@/lib/types/event.types'

/**
 * EventsListPage Component - Container component for displaying events list
 *
 * Design Patterns Applied:
 * 1. **Container/Presentational Pattern**: This is a container component that:
 *    - Handles data fetching through useEvents hook
 *    - Manages loading, error, and data states
 *    - Delegates presentation to EventGrid component
 *
 * 2. **Custom Hook Pattern**: Uses useEvents for data fetching abstraction
 *
 * 3. **Composition Pattern**: Composes UI from smaller components (EventGrid, EventsStateFrame, LoadingState)
 *
 * 4. **Error Boundary Pattern**: Implements error handling with retry capability
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for orchestrating the events list display
 * - **OCP**: Extensible through composition and props
 * - **LSP**: Can be substituted with other page components
 * - **ISP**: Minimal interface, no unnecessary props
 * - **DIP**: Depends on abstractions (useEvents hook, Event type, EventGrid component)
 *
 * React 19 Patterns:
 * - Suspense-ready with loading states
 * - Error boundaries with graceful degradation
 * - Optimistic UI patterns ready for implementation
 * - Proper semantic HTML structure
 */

export const EventsListPage = () => {
  const { events, isLoading, error, refetch, hasData } = useEventsWithInit()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event)
    // TODO: Navigate to event details page
    console.warn('Event selected:', event.slug)
  }, [])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  // Determine state flags
  const isEmpty = hasData && events.length === 0

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
        <p className="text-muted-foreground">
          Discover and join exciting events happening in your area
        </p>
      </header>

      <main>
        <EventsStateFrame
          error={error}
          onRetry={handleRetry}
          errorTitle="Unable to Load Events"
          isLoading={isLoading && !hasData}
          hasData={hasData}
          isEmpty={isEmpty}
          onRefresh={handleRetry}
        >
          <EventGrid
            events={events || []}
            hasResults={events ? events.length > 0 : false}
            isLoading={isLoading && hasData}
            onEventSelect={handleEventClick}
            gridClasses="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            filteredCount={events ? events.length : 0}
          />
        </EventsStateFrame>
      </main>

      {/* Debug info - remove in production */}
      {selectedEvent && (
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Selected: {selectedEvent.name} (ID: {selectedEvent.slug})
          </p>
        </div>
      )}
    </div>
  )
}
