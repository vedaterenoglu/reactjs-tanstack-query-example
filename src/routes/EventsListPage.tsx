import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { EventsStateFrame } from '@/components/frames'
import { AutoResizeEventGrid } from '@/components/grids'
import { PaginationControls } from '@/components/navigation/PaginationControls'
import { useEventsQuery, useEventsByCity } from '@/lib/hooks/tanstack/useEventsQuery'
import type { Event } from '@/lib/types/event.types'

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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isChangingPage, setIsChangingPage] = useState(false)
  
  // URL parameter parsing - Single Source of Truth Pattern
  const searchQueryFromUrl = searchParams.get('search')
  
  // Use different query hooks based on whether we have a search parameter (citySlug)
  const allEventsQuery = useEventsQuery()
  const cityEventsQuery = useEventsByCity(searchQueryFromUrl || '', Boolean(searchQueryFromUrl))
  
  // Select the appropriate query result based on search parameter
  const { allEvents, isLoading, error, refetch, hasData } = useMemo(() => {
    const query = searchQueryFromUrl ? cityEventsQuery : allEventsQuery
    return {
      allEvents: query.data?.data || [],
      isLoading: query.isLoading,
      error: query.error,
      refetch: query.refetch,
      hasData: Boolean(query.data),
    }
  }, [searchQueryFromUrl, cityEventsQuery, allEventsQuery])

  // Local pagination state management following React 19 patterns
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // Fixed items per page
  
  // Calculate pagination values
  const totalItems = allEvents.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // Local search state for non-URL search functionality
  const [currentSearchQuery, setCurrentSearchQuery] = useState('')
  
  const clearSearch = useCallback(() => {
    setCurrentSearchQuery('')
  }, [])

  // Server-side filtering: TanStack Query handles filtering via API calls
  // Client-side pagination only for non-search results
  const displayEvents = useMemo(() => {
    // Strategy 1: Search query (citySlug) is active - use server-filtered events directly
    if (searchQueryFromUrl) {
      return allEvents || []
    }
    
    // Strategy 2: No search + local search active - use locally filtered events
    if (currentSearchQuery) {
      const query = currentSearchQuery.toLowerCase()
      return allEvents?.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.organizerName.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      ) || []
    }
    
    // Strategy 3: No search + pagination active - use paginated events
    if (totalPages > 1) {
      return allEvents?.slice(startIndex, endIndex) || []
    }
    
    // Strategy 4: No search + no pagination - use all events
    return allEvents || []
  }, [
    searchQueryFromUrl,
    currentSearchQuery,
    totalPages,
    startIndex,
    endIndex,
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
    void refetch()
  }, [refetch])

  // URL Parameter Sync - Observer Pattern
  // Handle local search state separately from URL search parameter (citySlug)
  useEffect(() => {
    // Only manage local search state, not URL search parameter
    // URL search parameter (citySlug) is handled by TanStack Query hooks directly
    if (!searchQueryFromUrl && currentSearchQuery) {
      // URL has no search parameter, clear local search
      clearSearch()
    }
  }, [searchQueryFromUrl, currentSearchQuery, clearSearch])

  // Scroll to top when page changes
  const handlePageChange = useCallback((page: number) => {
    setIsChangingPage(true)
    setCurrentPage(page)
    
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
    
    // Reset page transition state
    setTimeout(() => setIsChangingPage(false), 300)
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
          error={error ? error.message : null}
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
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
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
