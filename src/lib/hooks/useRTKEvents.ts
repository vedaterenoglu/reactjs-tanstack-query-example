/**
 * RTK Query Events Hook - Enhanced data fetching with automatic caching
 * Demonstrates RTK Query integration alongside existing async thunks
 *
 * Design Patterns Applied:
 * - Facade Pattern: Clean interface hiding RTK Query complexity
 * - Adapter Pattern: Adapts RTK Query hooks to match existing hook patterns
 * - Strategy Pattern: Different fetching strategies based on use case
 * - Observer Pattern: Automatic updates when server data changes
 */

import { useMemo } from 'react'

import type { EventsQueryParams } from '@/lib/types/event.types'
import {
  useGetEventsQuery,
  useLazyGetEventsQuery,
  useGetEventBySlugQuery,
  useLazyGetEventBySlugQuery,
} from '@/store/api/apiSlice'

/**
 * Enhanced events hook using RTK Query for optimal caching and performance
 * Perfect for components that need automatic background updates
 */
export const useRTKEvents = (params: Partial<EventsQueryParams> = {}) => {
  // Automatic query with intelligent caching
  const {
    data: events = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetEventsQuery(params, {
    // Advanced RTK Query options
    refetchOnMountOrArgChange: 30, // Refetch if data is older than 30 seconds
    refetchOnFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  })

  // Derived state for backward compatibility with existing hooks
  const derivedState = useMemo(
    () => ({
      // Data state
      events,
      hasData: events.length > 0,
      isEmpty: events.length === 0,
      eventsCount: events.length,

      // Loading states (RTK Query provides more granular loading states)
      isLoading, // Initial load
      isFetching, // Any fetch operation (including background)
      isRefreshing: isFetching && !isLoading, // Background refresh

      // Error state
      isError,
      error: error
        ? (error as { message?: string }).message || 'Failed to fetch events'
        : null,

      // Actions
      refetch, // Manual refetch
    }),
    [events, isLoading, isFetching, isError, error, refetch]
  )

  return derivedState
}

/**
 * Lazy events hook for on-demand fetching
 * Perfect for search, filtering, or conditional data loading
 */
export const useLazyRTKEvents = () => {
  const [trigger, result] = useLazyGetEventsQuery()

  const fetchEvents = useMemo(
    () =>
      (params: Partial<EventsQueryParams> = {}) => {
        return trigger(params, true) // Subscribe to cache updates
      },
    [trigger]
  )

  const derivedState = useMemo(
    () => ({
      // Data state
      events: result.data || [],
      hasData: (result.data?.length || 0) > 0,
      isEmpty: (result.data?.length || 0) === 0,
      eventsCount: result.data?.length || 0,

      // Loading states
      isLoading: result.isLoading,
      isFetching: result.isFetching,
      isUninitialized: result.isUninitialized,

      // Error state
      isError: result.isError,
      error: result.error
        ? (result.error as { message?: string }).message ||
          'Failed to fetch events'
        : null,

      // Actions
      fetchEvents,
    }),
    [result, fetchEvents]
  )

  return derivedState
}

/**
 * Single event hook with automatic caching
 * Perfect for event detail pages with optimistic navigation
 */
export const useRTKEvent = (slug: string, options: { skip?: boolean } = {}) => {
  const {
    data: event,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetEventBySlugQuery(slug, {
    skip: options.skip ?? false,
    refetchOnMountOrArgChange: 60, // Individual events change less frequently
  })

  const derivedState = useMemo(
    () => ({
      // Data state
      event: event || null,
      hasEvent: !!event,

      // Loading states
      isLoading,
      isFetching,

      // Error state
      isError,
      error: error
        ? (error as { message?: string }).message || 'Event not found'
        : null,

      // Actions
      refetch,
    }),
    [event, isLoading, isFetching, isError, error, refetch]
  )

  return derivedState
}

/**
 * Lazy single event hook for conditional loading
 */
export const useLazyRTKEvent = () => {
  const [trigger, result] = useLazyGetEventBySlugQuery()

  const fetchEvent = useMemo(
    () => (slug: string) => {
      return trigger(slug, true)
    },
    [trigger]
  )

  const derivedState = useMemo(
    () => ({
      // Data state
      event: result.data || null,
      hasEvent: !!result.data,

      // Loading states
      isLoading: result.isLoading,
      isFetching: result.isFetching,
      isUninitialized: result.isUninitialized,

      // Error state
      isError: result.isError,
      error: result.error
        ? (result.error as { message?: string }).message || 'Event not found'
        : null,

      // Actions
      fetchEvent,
    }),
    [result, fetchEvent]
  )

  return derivedState
}

/**
 * RTK Query integration utilities
 * Provides cache management and invalidation controls
 */
export const useRTKEventsUtils = () => {
  // These would be used for cache management
  // Currently returning placeholder functions for demonstration

  const utils = useMemo(
    () => ({
      // Cache invalidation
      invalidateEvents: () => {
        // apiSlice.util.invalidateTags(['EventList'])
        console.warn('Would invalidate events cache')
      },

      // Prefetch for performance
      prefetchEvent: (slug: string) => {
        // dispatch(apiSlice.util.prefetch('getEventBySlug', slug))
        console.warn(`Would prefetch event: ${slug}`)
      },

      // Cache inspection (for debugging)
      getCacheStatus: () => {
        // return apiSlice.util.selectCachedArgsForQuery(state, 'getEvents')
        return { cached: true, timestamp: Date.now() }
      },
    }),
    []
  )

  return utils
}

/**
 * Example usage patterns for RTK Query hooks:
 *
 * // Automatic data fetching with caching
 * const { events, isLoading, refetch } = useRTKEvents({ limit: 10 })
 *
 * // Lazy loading for search
 * const { fetchEvents, events, isLoading } = useLazyRTKEvents()
 *
 * // Single event with cache
 * const { event, isLoading } = useRTKEvent('event-slug')
 *
 * // Cache management
 * const { invalidateEvents, prefetchEvent } = useRTKEventsUtils()
 */
