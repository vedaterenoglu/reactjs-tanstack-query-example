import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

import type { Event } from '@/lib/types/event.types'

import { EventsStateFrame } from '@/components/frames'
import { AutoResizeEventGrid } from '@/components/grids'
import { PaginationControls } from '@/components/navigation/PaginationControls'
import { useEventsWithInit } from '@/lib/hooks/useEvents'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  fetchEventsPage,
  setSearchQuery,
  clearFilters,
} from '@/store/slices/events'
import {
  selectCurrentPageEvents,
  selectTotalPages,
  selectIsChangingPage,
  selectSearchQuery,
  selectFilteredEvents,
} from '@/store/slices/events/eventSelectors'

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
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    events: allEvents,
    isLoading,
    error,
    refetch,
    hasData,
  } = useEventsWithInit()

  // URL parameter parsing - Single Source of Truth Pattern
  const searchQueryFromUrl = searchParams.get('search')

  // Pagination selectors
  const currentPageEvents = useAppSelector(selectCurrentPageEvents)
  const totalPages = useAppSelector(selectTotalPages)
  const isChangingPage = useAppSelector(selectIsChangingPage)
  const currentSearchQuery = useAppSelector(selectSearchQuery)

  // Filtering selectors - Observer Pattern for Redux state
  const filteredEvents = useAppSelector(selectFilteredEvents)

  // Strategy Pattern: Different display strategies based on state
  // Single Source of Truth: Filtered events take precedence when search is active
  const displayEvents = useMemo(() => {
    let result: typeof allEvents = []

    // Strategy 1: Search query is active - use filtered events from Redux
    if (currentSearchQuery) {
      result = filteredEvents
    }
    // Strategy 2: No search + pagination active - use paginated events
    else if (totalPages > 1 && currentPageEvents.length > 0) {
      result = currentPageEvents
    }
    // Strategy 3: No search + no pagination - use all events
    else {
      result = allEvents || []
    }

    return result
  }, [
    currentSearchQuery,
    filteredEvents,
    totalPages,
    currentPageEvents,
    allEvents,
  ])

  const handleEventClick = useCallback(
    (event: Event) => {
      // Command Pattern: Execute navigation command with event slug
      // Strategy Pattern: Navigate to single event page using slug for SEO-friendly URLs
      void navigate(`/events/${encodeURIComponent(event.slug)}`)
    },
    [navigate]
  )

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  // URL Parameter Sync - Observer Pattern
  // Sync Redux state with URL parameters (URL as Single Source of Truth)
  useEffect(() => {
    // Backend filtering using search parameter
    if (searchQueryFromUrl) {
      void dispatch(setSearchQuery(searchQueryFromUrl))
    } else if (!searchQueryFromUrl && currentSearchQuery) {
      // URL has no search parameter, clear filters
      void dispatch(clearFilters())
    }
  }, [searchQueryFromUrl, currentSearchQuery, dispatch, searchParams])

  // Initialize pagination when component mounts and we have data
  useEffect(() => {
    const eventsCount = allEvents?.length || 0
    // Don't initialize pagination during search to prevent overriding search results
    if (hasData && eventsCount > 0 && !currentSearchQuery) {
      void dispatch(fetchEventsPage({ page: 1 }))
    }
  }, [dispatch, hasData, allEvents?.length, totalPages, currentSearchQuery])

  // Scroll to top when page changes
  const handlePageChange = useCallback(() => {
    // Smooth scroll to top of page
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })

    // Optional: Focus management for accessibility
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.focus()
    }
  }, [])

  // Determine state flags
  const isEmpty = hasData && displayEvents.length === 0
  const showPagination =
    totalPages > 1 && hasData && !isEmpty && !currentSearchQuery

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
    </div>
  )
}
