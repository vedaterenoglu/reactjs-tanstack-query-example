import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { EventsStateFrame } from '@/components/frames'
import { AutoResizeEventGrid } from '@/components/grids'
import { SearchSection } from '@/components/sections'
import { useEventsByCity, useInfiniteEventsQuery } from '@/lib/hooks/tanstack/useEventsQuery'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import type { Event } from '@/lib/types/event.types'

/**
 * EventsListPage - Events listing with infinite scroll and search
 * 
 * Displays paginated events list with infinite scroll, city filtering,
 * free-text search, and refresh functionality. Uses URL state management.
 * 
 * Design Patterns Applied:
 * - Container Pattern: Orchestrates data fetching and URL state management
 * - Strategy Pattern: Different query strategies based on search parameters
 * - Custom Hook Pattern: useInfiniteEventsQuery, useEventsByCity, useInfiniteScroll
 * - Observer Pattern: useInfiniteScroll for scroll position monitoring
 */

export const EventsListPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // URL parameter parsing - Single Source of Truth Pattern
  const citySlugFromUrl = searchParams.get('search') // City filtering via 'search' parameter
  const freeTextSearchFromUrl = searchParams.get('q') || '' // Free-text search via 'q' parameter
  
  // Select query strategy based on search parameters - following Strategy Pattern
  const allEventsInfiniteQuery = useInfiniteEventsQuery({}, 18) // 18 items per page
  const cityEventsQuery = useEventsByCity(citySlugFromUrl || '', Boolean(citySlugFromUrl))
  
  // Select the appropriate query result based on search parameters
  const { allEvents, isLoading, error, refetch, hasData } = useMemo(() => {
    if (citySlugFromUrl) {
      // City filtering: use regular query (server-side filtered, no pagination needed)
      return {
        allEvents: cityEventsQuery.data?.data || [],
        isLoading: cityEventsQuery.isLoading,
        error: cityEventsQuery.error,
        refetch: cityEventsQuery.refetch,
        hasData: Boolean(cityEventsQuery.data),
      }
    } else {
      // All events: use infinite query with flattened data
      const flattenedEvents = allEventsInfiniteQuery.data?.pages.flatMap(page => page.data) || []
      return {
        allEvents: flattenedEvents,
        isLoading: allEventsInfiniteQuery.isLoading,
        error: allEventsInfiniteQuery.error,
        refetch: allEventsInfiniteQuery.refetch,
        hasData: Boolean(allEventsInfiniteQuery.data),
      }
    }
  }, [citySlugFromUrl, cityEventsQuery, allEventsInfiniteQuery])

  // Infinite scroll hook integration - following Observer Pattern
  const infiniteScroll = useInfiniteScroll(allEventsInfiniteQuery, {
    rootMargin: '200px', // Trigger loading 200px before reaching bottom
    loadMoreDelay: 100, // Reduced delay for faster loading
    enabled: !citySlugFromUrl, // Only enable for all events, not city filtering
  })

  // URL-based search state management following Single Source of Truth Pattern
  const handleSearchChange = useCallback((searchQuery: string) => {
    const newParams = new URLSearchParams(searchParams)
    
    if (searchQuery.trim()) {
      newParams.set('q', searchQuery.trim())
    } else {
      newParams.delete('q')
    }
    
    // Reset infinite scroll when search changes
    if (!citySlugFromUrl) {
      infiniteScroll.reset()
    }
    
    setSearchParams(newParams)
  }, [searchParams, setSearchParams, citySlugFromUrl, infiniteScroll])
  
  const handleRefresh = useCallback(() => {
    // Clear search query from URL parameters
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('q')
    setSearchParams(newParams)
    
    // Refetch data to refresh the events
    void refetch()
  }, [refetch, searchParams, setSearchParams])

  // Server-side filtering: TanStack Query handles city filtering via API calls
  // Client-side search works on both all events and city-filtered events
  const displayEvents = useMemo(() => {
    let eventsToFilter = allEvents || []
    
    // Apply free-text search filtering if search query exists
    if (freeTextSearchFromUrl) {
      const query = freeTextSearchFromUrl.toLowerCase()
      eventsToFilter = eventsToFilter.filter(event =>
        event.name?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.organizerName?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)
      )
    }
    
    return eventsToFilter
  }, [
    freeTextSearchFromUrl,
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

  // Reset infinite scroll when search parameters change - Observer Pattern
  useEffect(() => {
    if (!citySlugFromUrl) {
      infiniteScroll.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlugFromUrl, freeTextSearchFromUrl])

  // Determine state flags for infinite scroll
  const isEmpty = hasData && displayEvents.length === 0
  const showLoadMoreIndicator = infiniteScroll.shouldShowLoader && !citySlugFromUrl

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
        <p className="text-muted-foreground">
          Discover and join exciting events happening in your area
        </p>
      </header>

      {/* Search Section */}
      <SearchSection
        onRefresh={handleRefresh}
        placeholder="Search events by name, description, organizer, or location..."
        debounceMs={300}
        autoFocus={false}
        showRefreshButton={true}
        searchQuery={freeTextSearchFromUrl}
        onSearchChange={handleSearchChange}
      />

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
          {/* Events Grid */}
          <AutoResizeEventGrid
            events={displayEvents}
            hasResults={displayEvents.length > 0}
            isLoading={isLoading && hasData}
            onEventSelect={handleEventClick}
            filteredCount={displayEvents.length}
          />

          {/* Infinite Scroll Sentinel Element - Only for all events, not city filtering */}
          {!citySlugFromUrl && (
            <div 
              ref={infiniteScroll.sentinelRef}
              className="mt-8 p-4 flex justify-center min-h-[100px]"
            >
              {showLoadMoreIndicator && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                  <span>Loading more events...</span>
                </div>
              )}
              {infiniteScroll.canLoadMore && !showLoadMoreIndicator && (
                <div className="text-muted-foreground text-sm">
                  Scroll down for more events...
                </div>
              )}
              {infiniteScroll.hasLoadedAll && displayEvents.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  You've reached the end of the events list
                </p>
              )}
            </div>
          )}
        </EventsStateFrame>
      </main>
    </div>
  )
}
