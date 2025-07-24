/**
 * useEventsQuery - TanStack Query hooks for events data fetching
 * 
 * Provides comprehensive React Query hooks for events API integration including
 * standard queries, infinite queries, suspense queries, and specialized hooks
 * for city-specific and search-based event fetching with proper caching.
 * 
 * Design Patterns Applied:
 * - Custom Hook Pattern: Encapsulates TanStack Query logic for reuse
 * - Query Key Pattern: Consistent query key generation for cache management
 * - Infinite Query Pattern: Pagination support with automatic data merging
 * - Suspense Pattern: Suspense-compatible queries for loading boundaries
 */

import {
  useQuery,
  useInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  fetchEvents,
  fetchEventsByCity,
  fetchEventsWithSearch,
  fetchPaginatedEvents,
  fetchEventBySlug,
} from '@/lib/api/queryFunctions'
import { queryKeys } from '@/lib/query/queryClient'
import type { Event, EventsQueryParams } from '@/lib/types/event.types'

/**
 * Hook for fetching events with pagination and filtering
 * Follows React 19 Custom Hook Pattern with data logic abstraction
 */
export function useEventsQuery(params?: EventsQueryParams) {
  const queryParams = useMemo(() => {
    const defaultParams: EventsQueryParams = {
      limit: 20,
      offset: 0,
      sortBy: 'date',
      order: 'asc',
    }
    return { ...defaultParams, ...params }
  }, [params])

  const queryKey = useMemo(() => {
    const filters = Object.fromEntries(
      Object.entries(queryParams).filter(([, value]) => value !== undefined)
    )
    return queryKeys.eventsList(filters)
  }, [queryParams])

  return useQuery({
    queryKey,
    queryFn: () => fetchEvents(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for fetching events by city slug
 * CRITICAL: Uses search parameter with citySlug value
 * Example: useEventsByCity('austin') -> GET /api/events?search=austin
 */
export function useEventsByCity(citySlug: string, enabled = true) {
  const queryKey = useMemo(
    () => queryKeys.eventsList({ search: citySlug }),
    [citySlug]
  )

  return useQuery({
    queryKey,
    queryFn: () => fetchEventsByCity(citySlug),
    enabled: enabled && Boolean(citySlug),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for searching events
 * Uses search parameter for text-based searching
 */
export function useEventsSearch(searchQuery: string, enabled = true) {
  const queryKey = useMemo(
    () => queryKeys.eventsList({ search: searchQuery }),
    [searchQuery]
  )

  return useQuery({
    queryKey,
    queryFn: () => fetchEventsWithSearch(searchQuery),
    enabled: enabled && Boolean(searchQuery.trim()),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for infinite pagination of events
 * Implements infinite scrolling pattern with TanStack Query
 */
export function useInfiniteEventsQuery(
  baseParams: Partial<Omit<EventsQueryParams, 'limit' | 'offset'>> = {},
  itemsPerPage = 20
) {
  const queryKey = useMemo(() => {
    const params = Object.fromEntries(
      Object.entries({ ...baseParams, limit: itemsPerPage }).filter(
        ([, value]) => value !== undefined
      )
    )
    return queryKeys.eventsList(params)
  }, [baseParams, itemsPerPage])

  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => {
      const params: Parameters<typeof fetchPaginatedEvents>[0] = {
        page: pageParam as number,
        limit: itemsPerPage,
        sortBy: baseParams.sortBy || 'date',
        order: baseParams.order || 'asc',
      }
      if (baseParams.search) {
        params.search = baseParams.search
      }
      return fetchPaginatedEvents(params)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.pagination) return undefined

      const { total, limit } = lastPage.pagination
      const currentPage = allPages.length
      const hasMore = currentPage * limit < total

      return hasMore ? currentPage + 1 : undefined
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for fetching a single event by slug
 * Follows single responsibility principle with focused functionality
 */
export function useEventQuery(slug: string, enabled = true) {
  const queryKey = useMemo(() => queryKeys.event(slug), [slug])

  return useQuery({
    queryKey,
    queryFn: () => fetchEventBySlug(slug),
    enabled: enabled && Boolean(slug),
    staleTime: 10 * 60 * 1000, // 10 minutes for individual events
    refetchOnWindowFocus: false,
  })
}

/**
 * Suspense-enabled hook for fetching single event
 * Uses React 19 Suspense integration pattern
 */
export function useEventSuspenseQuery(slug: string) {
  const queryKey = useMemo(() => queryKeys.event(slug), [slug])

  return useSuspenseQuery({
    queryKey,
    queryFn: () => fetchEventBySlug(slug),
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Utility hook for combining events data with computed values
 * Follows React 19 pattern of extracting logic into custom hooks
 */
export function useEventsWithMeta(params?: EventsQueryParams) {
  const eventsQuery = useEventsQuery(params)

  const computedData = useMemo(() => {
    if (!eventsQuery.data?.data) {
      return {
        events: [],
        totalCount: 0,
        hasEvents: false,
        eventsByCity: new Map<string, Event[]>(),
      }
    }

    const events = eventsQuery.data.data
    const totalCount = eventsQuery.data.pagination?.total || events.length

    // Group events by city for enhanced filtering
    const eventsByCity = events.reduce((acc, event) => {
      const citySlug = event.citySlug
      if (!acc.has(citySlug)) {
        acc.set(citySlug, [])
      }
      acc.get(citySlug)!.push(event)
      return acc
    }, new Map<string, Event[]>())

    return {
      events,
      totalCount,
      hasEvents: events.length > 0,
      eventsByCity,
    }
  }, [eventsQuery.data])

  return {
    ...eventsQuery,
    ...computedData,
  }
}

/**
 * Hook for prefetching events
 * Enables optimistic data loading patterns
 */
export function useEventsPrefetch() {
  return {
    prefetchEvents: (params: EventsQueryParams) => {
      const filters = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
      )
      const queryKey = queryKeys.eventsList(filters)
      // Note: Actual prefetch implementation would use queryClient.prefetchQuery
      // This is a placeholder for the prefetch pattern
      return { queryKey, params }
    },

    prefetchEventsByCity: (citySlug: string) => {
      const queryKey = queryKeys.eventsList({ search: citySlug })
      return { queryKey, citySlug }
    },

    prefetchEvent: (slug: string) => {
      const queryKey = queryKeys.event(slug)
      return { queryKey, slug }
    },
  }
}

/**
 * Utility types for hook consumers
 */
export type EventsQueryResult = ReturnType<typeof useEventsQuery>
export type EventQueryResult = ReturnType<typeof useEventQuery>
export type EventsSearchResult = ReturnType<typeof useEventsSearch>
export type InfiniteEventsResult = ReturnType<typeof useInfiniteEventsQuery>
export type EventsWithMetaResult = ReturnType<typeof useEventsWithMeta>
