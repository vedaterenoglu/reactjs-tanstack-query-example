import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  useEventsQuery,
} from '@/lib/hooks/tanstack/useEventsQuery'

/**
 * Custom Hooks for Event State Management with TanStack Query
 *
 * Design Patterns Applied:
 * 1. **Custom Hook Pattern**: Extracts stateful logic into reusable hooks
 * 2. **Facade Pattern**: Hides TanStack Query complexity behind clean component API
 * 3. **Observer Pattern**: Components observe server state through TanStack Query
 * 4. **Command Pattern**: Hook methods trigger mutations and queries
 * 5. **Composition Pattern**: Multiple focused hooks for different use cases
 *
 * SOLID Principles:
 * - **SRP**: Each hook has single responsibility for specific event operations
 * - **OCP**: New hooks can be added without modifying existing ones
 * - **LSP**: All hooks follow consistent React hook patterns
 * - **ISP**: Focused hook interfaces for specific component needs
 * - **DIP**: Components depend on hook abstractions, not TanStack Query directly
 *
 * React 19 Patterns:
 * - Custom Hook Pattern for business logic extraction
 * - Performance optimization through memoized selectors
 * - Clean separation of concerns (server/client state)
 * - Reusable stateful logic across components
 */

/**
 * Main events hook - comprehensive event state management with TanStack Query
 * Provides complete access to events data and operations
 * Perfect for main event list components
 */
export const useEvents = () => {
  // Local state for client-side filtering and selection
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  // TanStack Query for server state
  const eventsQuery = useEventsQuery()

  // Derived state - filtered events based on search and city filter
  const filteredEvents = useMemo(() => {
    const events = eventsQuery.data?.data || []
    let filtered = events

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.organizerName.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      )
    }

    // City filter
    if (cityFilter) {
      filtered = filtered.filter(event => event.citySlug === cityFilter)
    }

    return filtered
  }, [eventsQuery.data?.data, searchQuery, cityFilter])

  // Computed state following Single Responsibility
  const events = useMemo(() => eventsQuery.data?.data || [], [eventsQuery.data])
  const isLoading = eventsQuery.isLoading
  const error = eventsQuery.error
  const hasData = Boolean(events.length)
  const hasResults = Boolean(filteredEvents.length)
  const shouldRefresh = eventsQuery.isStale
  const eventsCount = events.length
  const filteredEventsCount = filteredEvents.length
  const hasActiveFilters = Boolean(searchQuery || cityFilter)
  
  // Pagination state (simplified - could be enhanced with actual pagination)
  const pagination = useMemo(() => ({
    page: 1,
    limit: 20,
    total: filteredEventsCount,
    totalPages: Math.ceil(filteredEventsCount / 20),
    offset: 0,
  }), [filteredEventsCount])
  
  const hasMore = false // Simple implementation, could be enhanced

  // Memoized action handlers following Command Pattern
  const fetchEventsData = useCallback(
    async () => {
      await eventsQuery.refetch()
    },
    [eventsQuery]
  )

  const fetchEventBySlugData = useCallback(
    (slug: string) => {
      setSelectedEvent(slug)
      // Could trigger individual event query here if needed
    },
    []
  )

  const refreshData = useCallback(async () => {
    await eventsQuery.refetch()
  }, [eventsQuery])

  const searchEventsData = useCallback(
    (query: string) => {
      setSearchQuery(query)
    },
    []
  )

  const filterEventsByCityData = useCallback(
    (citySlug: string) => {
      setCityFilter(citySlug)
    },
    []
  )

  const clearSearchData = useCallback(
    () => {
      setSearchQuery('')
    },
    []
  )

  const clearFiltersData = useCallback(() => {
    setSearchQuery('')
    setCityFilter('')
  }, [])

  const selectEventData = useCallback(
    (eventSlug: string) => {
      setSelectedEvent(eventSlug)
    },
    []
  )

  const initializeEventsData = useCallback(
    async () => {
      if (!hasData && !isLoading) {
        await eventsQuery.refetch()
      }
    },
    [hasData, isLoading, eventsQuery]
  )

  const loadMoreEventsData = useCallback(
    async () => {
      // For now, just refetch - could be enhanced with infinite query
      await eventsQuery.refetch()
    },
    [eventsQuery]
  )

  const retry = useCallback(async () => {
    await eventsQuery.refetch()
  }, [eventsQuery])

  // Convenience method for refetching
  const refetch = useCallback(() => {
    return retry()
  }, [retry])

  return {
    // State data
    events,
    filteredEvents,
    selectedEvent,
    searchQuery,
    cityFilter,
    isLoading,
    error,
    hasData,
    hasResults,
    shouldRefresh,
    eventsCount,
    filteredEventsCount,
    hasActiveFilters,
    pagination,
    hasMore,

    // Action dispatchers
    fetchEvents: fetchEventsData,
    fetchEventBySlug: fetchEventBySlugData,
    refreshEvents: refreshData,
    searchEvents: searchEventsData,
    filterEventsByCity: filterEventsByCityData,
    clearSearch: clearSearchData,
    clearFilters: clearFiltersData,
    selectEvent: selectEventData,
    initializeEvents: initializeEventsData,
    loadMoreEvents: loadMoreEventsData,
    retryOperation: refreshData,
    refetch, // Alias for refreshEvents
  }
}

/**
 * Hook for event search functionality with TanStack Query
 * Focused on search-specific operations following SRP
 * Provides optimized interface for search components
 */
export const useEventSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const eventsQuery = useEventsQuery()

  // Filtered events based on search query
  const filteredEvents = useMemo(() => {
    const events = eventsQuery.data?.data || []
    if (!searchQuery.trim()) return events

    const query = searchQuery.toLowerCase()
    return events.filter(event =>
      event.name.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.organizerName.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query)
    )
  }, [eventsQuery.data?.data, searchQuery])

  const isLoading = eventsQuery.isLoading
  const error = eventsQuery.error

  const search = useCallback(
    (query: string) => {
      setSearchQuery(query)
    },
    []
  )

  const clearSearchQuery = useCallback(
    () => {
      setSearchQuery('')
    },
    []
  )

  const retrySearch = useCallback(async () => {
    await eventsQuery.refetch()
  }, [eventsQuery])

  return {
    searchQuery,
    filteredEvents: filteredEvents.length,
    totalEvents: eventsQuery.data?.data?.length || 0,
    isSearchActive: Boolean(searchQuery.trim()),
    hasResults: filteredEvents.length > 0,
    isLoading,
    error,
    search,
    clearSearch: clearSearchQuery,
    retrySearch,
  }
}

/**
 * Hook for event selection functionality with TanStack Query
 * Encapsulates selection logic following SRP
 * Optimized for event card and detail components
 */
export const useEventSelection = () => {
  const [selectedEvent, setSelectedEvent] = useState<{ slug: string } | null>(null)
  const eventsQuery = useEventsQuery()

  const isLoading = eventsQuery.isLoading
  const error = eventsQuery.error

  const selectEventById = useCallback(
    (eventSlug: string) => {
      const events = eventsQuery.data?.data || []
      const event = events.find(e => e.slug === eventSlug)
      if (event) {
        setSelectedEvent({ slug: eventSlug })
      }
    },
    [eventsQuery.data]
  )

  const clearSelection = useCallback(
    () => {
      setSelectedEvent(null)
    },
    []
  )

  const fetchEventDetails = useCallback(
    (eventSlug: string) => {
      selectEventById(eventSlug)
    },
    [selectEventById]
  )

  return {
    selectedEvent,
    isLoading,
    error,
    selectEvent: selectEventById,
    clearSelection,
    fetchEventDetails,
  }
}

/**
 * Hook for event filtering functionality with TanStack Query
 * Handles city-based filtering and filter management
 * Optimized for filter UI components
 */
export const useEventFilters = () => {
  const [cityFilter, setCityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const eventsQuery = useEventsQuery()

  const isLoading = eventsQuery.isLoading

  // Filtered events based on current filters
  const filteredEvents = useMemo(() => {
    const events = eventsQuery.data?.data || []
    let filtered = events

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.organizerName.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      )
    }

    // City filter
    if (cityFilter) {
      filtered = filtered.filter(event => event.citySlug === cityFilter)
    }

    return filtered
  }, [eventsQuery.data?.data, searchQuery, cityFilter])

  const hasActiveFilters = Boolean(searchQuery || cityFilter)

  const setCityFilterData = useCallback(
    (citySlug: string) => {
      setCityFilter(citySlug)
    },
    []
  )

  const clearCityFilter = useCallback(
    () => {
      setCityFilter('')
    },
    []
  )

  const clearAllFilters = useCallback(
    () => {
      setSearchQuery('')
      setCityFilter('')
    },
    []
  )

  return {
    cityFilter,
    searchQuery,
    hasActiveFilters,
    filteredEvents,
    isLoading,
    setCityFilter: setCityFilterData,
    clearCityFilter,
    clearAllFilters,
  }
}

/**
 * Hook for event data initialization with TanStack Query
 * Handles app startup and data refresh scenarios
 * Implements smart loading with error recovery
 */
export const useEventInitialization = () => {
  const eventsQuery = useEventsQuery()

  const hasData = Boolean(eventsQuery.data?.data?.length)
  const shouldRefresh = eventsQuery.isStale
  const isLoading = eventsQuery.isLoading
  const error = eventsQuery.error

  const initialize = useCallback(async () => {
    if (!hasData && !isLoading) {
      await eventsQuery.refetch()
    }
  }, [hasData, isLoading, eventsQuery])

  const refresh = useCallback(async () => {
    await eventsQuery.refetch()
  }, [eventsQuery])

  const retry = useCallback(async () => {
    await eventsQuery.refetch()
  }, [eventsQuery])

  // Auto-initialize on mount if needed
  useEffect(() => {
    if (!hasData && !isLoading && !error) {
      void initialize()
    }
  }, [hasData, isLoading, error, initialize])

  return {
    hasData,
    shouldRefresh,
    isLoading,
    error,
    initialize,
    refresh,
    retry,
  }
}

/**
 * Hook for event data with automatic initialization
 * High-level hook combining data access and initialization
 * Perfect for main components that need complete event functionality
 */
export const useEventsWithInit = () => {
  const eventData = useEvents()
  const { shouldRefresh } = useEventInitialization()

  // Auto-refresh stale data
  useEffect(() => {
    if (shouldRefresh && !eventData.isLoading) {
      void eventData.refreshEvents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRefresh, eventData.isLoading, eventData.refreshEvents])

  // Initialization is handled by useEventInitialization hook
  // Removing duplicate useEffect to prevent infinite loop

  return eventData
}

/**
 * Hook for individual event lookup with TanStack Query
 * Optimized for components that work with specific events
 * Returns event data by slug with selection capabilities
 */
export const useEvent = (eventSlug?: string) => {
  const eventsQuery = useEventsQuery()
  const { selectedEvent } = useEventSelection()

  const events = eventsQuery.data?.data || []
  const isLoading = eventsQuery.isLoading
  const error = eventsQuery.error

  // Find specific event by slug
  const event = eventSlug ? events.find(e => e.slug === eventSlug) : undefined

  // Determine if this event is currently selected
  const isSelected = selectedEvent?.slug === eventSlug

  return {
    event,
    isSelected,
    selectedEvent,
    isLoading,
    error,
    exists: Boolean(event),
  }
}

/**
 * Hook for event pagination with TanStack Query
 * Handles loading more events and pagination state
 * Optimized for infinite scroll or pagination components
 */
export const useEventPagination = () => {
  const eventsQuery = useEventsQuery()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const events = eventsQuery.data?.data || []
  const isLoading = eventsQuery.isLoading
  const totalItems = events.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const hasMore = currentPage < totalPages
  const offset = (currentPage - 1) * itemsPerPage

  const pagination = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    total: totalItems,
    totalPages,
    offset,
  }), [currentPage, itemsPerPage, totalItems, totalPages, offset])

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      setCurrentPage(prev => prev + 1)
    }
  }, [hasMore, isLoading])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])

  return {
    pagination,
    hasMore,
    isLoading,
    loadMore,
    goToPage,
    resetPagination,
    currentPage,
    totalPages,
  }
}
