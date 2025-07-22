import { useCallback, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { EventsStateFrame } from '@/components/frames'
import { AutoResizeEventGrid } from '@/components/grids'
import { PaginationControls } from '@/components/navigation/PaginationControls'
import { useEventsWithInit } from '@/lib/hooks/useEvents'
import type { Event } from '@/lib/types/event.types'
import type { AppDispatch } from '@/store'
import {
  selectCurrentPageEvents,
  selectTotalPages,
  selectIsChangingPage,
} from '@/store/slices/events/eventSelectors'
import { initializePagination } from '@/store/slices/events/eventThunks'

/**
 * EventsListPage Component - Container component for displaying events list
 *
 * Design Patterns Applied:
 * 1. **Container/Presentational Pattern**: This is a container component that:
 *    - Handles data fetching through useEvents hook
 *    - Manages loading, error, and data states
 *    - Delegates presentation to AutoResizeEventGrid component
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
  const dispatch = useDispatch<AppDispatch>()
  const { events: allEvents, isLoading, error, refetch, hasData } = useEventsWithInit()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  
  // Pagination selectors
  const currentPageEvents = useSelector(selectCurrentPageEvents)
  const totalPages = useSelector(selectTotalPages)
  const isChangingPage = useSelector(selectIsChangingPage)
  
  // Use paginated events if available, otherwise fallback to all events
  // Safety check: only use pagination if properly initialized
  const displayEvents = (totalPages > 1 && currentPageEvents.length > 0) 
    ? currentPageEvents 
    : (allEvents || [])

  const handleEventClick = useCallback((event: Event) => {
    setSelectedEvent(event)
    // TODO: Navigate to event details page
  }, [])

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])
  
  // Initialize pagination when component mounts and we have data
  useEffect(() => {
    const eventsCount = allEvents?.length || 0
    if (hasData && eventsCount > 0) {
      void dispatch(initializePagination())
    }
  }, [dispatch, hasData, allEvents?.length, totalPages])
  
  // Scroll to top when page changes
  const handlePageChange = useCallback(() => {
    // Smooth scroll to top of page
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    })
    
    // Optional: Focus management for accessibility
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.focus()
    }
  }, [])

  // Determine state flags
  const isEmpty = hasData && displayEvents.length === 0
  const showPagination = totalPages > 1 && hasData && !isEmpty

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
          {/* Content with Fade Transition */}
          <div 
            className={`transition-all duration-500 ease-in-out ${
              isChangingPage 
                ? 'opacity-40 scale-[0.98] blur-[1px]' 
                : 'opacity-100 scale-100 blur-0'
            }`}
          >
            <AutoResizeEventGrid
              events={displayEvents}
              hasResults={displayEvents.length > 0}
              isLoading={(isLoading && hasData) || isChangingPage}
              onEventSelect={handleEventClick}
              filteredCount={displayEvents.length}
            />
          </div>
          
          {/* Pagination Controls */}
          {showPagination && (
            <div className="mt-8">
              <PaginationControls
                onPageChange={handlePageChange}
                className="justify-center"
                showInfo={true}
              />
            </div>
          )}
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
