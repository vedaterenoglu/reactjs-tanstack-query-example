/**
 * useEventsMutations - TanStack Query mutation hooks for events CRUD operations
 * 
 * Provides mutation hooks for creating, updating, and deleting events with
 * optimistic updates, proper error handling, and automatic cache invalidation.
 * Implements consistent patterns for all event mutation operations.
 * 
 * Design Patterns Applied:
 * - Custom Hook Pattern: Encapsulates mutation logic for reuse across components
 * - Optimistic Updates Pattern: Immediate UI updates with rollback on failure
 * - Command Pattern: Mutation operations as executable commands with undo
 * - Cache Invalidation Pattern: Strategic cache updates after successful mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { createEvent, updateEvent, deleteEvent } from '@/lib/api/queryFunctions'
import { queryKeys, invalidateQueries } from '@/lib/query/queryClient'
import type {
  Event,
  CreateEventDto,
  UpdateEventDto,
} from '@/lib/types/event.types'

/**
 * Hook for creating new events with optimistic updates
 * Follows React 19 Custom Hook Pattern with proper error handling
 */
export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEvent,

    // Optimistic update: Add event to cache immediately
    onMutate: async (newEventData: CreateEventDto) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.events() })

      // Snapshot the previous value for rollback
      const previousEvents = queryClient.getQueryData(queryKeys.eventsList({}))

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.eventsList({}), (old: unknown) => {
        const typedOld = old as
          | { data?: Event[]; pagination?: { total: number } }
          | undefined
        if (!typedOld?.data) return typedOld

        // Create temporary event with optimistic data
        const tempEvent: Event = {
          id: Date.now(), // Temporary ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...newEventData,
          slug: newEventData.slug || `temp-${Date.now()}`, // Use provided slug or temporary
        }

        return {
          ...typedOld,
          data: [tempEvent, ...typedOld.data],
          pagination: typedOld.pagination
            ? {
                ...typedOld.pagination,
                total: typedOld.pagination.total + 1,
              }
            : undefined,
        }
      })

      // Return context for rollback
      return { previousEvents }
    },

    // On success: Invalidate and refetch to get real data
    onSuccess: async newEvent => {
      // Invalidate all events queries to ensure fresh data
      await invalidateQueries(queryKeys.events())

      // Optionally set the specific event data
      queryClient.setQueryData(queryKeys.event(newEvent.slug), newEvent)
    },

    // On error: Rollback optimistic update
    onError: (_error, _variables, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(
          queryKeys.eventsList({}),
          context.previousEvents
        )
      }
    },

    // Always run after mutation
    onSettled: () => {
      // Ensure cache is consistent
      void invalidateQueries(queryKeys.events())
    },
  })
}

/**
 * Hook for updating events with optimistic updates
 * Implements proper cache management and rollback strategies
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEvent,

    // Optimistic update: Update event in cache immediately
    onMutate: async ({ slug, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.event(slug) })
      await queryClient.cancelQueries({ queryKey: queryKeys.events() })

      // Snapshot previous values for rollback
      const previousEvent = queryClient.getQueryData(queryKeys.event(slug))
      const previousEventsList = queryClient.getQueryData(
        queryKeys.eventsList({})
      )

      // Optimistically update single event cache
      queryClient.setQueryData(queryKeys.event(slug), (old: unknown) => {
        const typedOld = old as Event | undefined
        if (!typedOld) return typedOld
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([, value]) => value !== undefined)
        )
        return {
          ...typedOld,
          ...cleanUpdates,
          updatedAt: new Date().toISOString(),
        }
      })

      // Optimistically update events list cache
      queryClient.setQueryData(queryKeys.eventsList({}), (old: unknown) => {
        const typedOld = old as { data?: Event[] } | undefined
        if (!typedOld?.data) return typedOld

        return {
          ...typedOld,
          data: typedOld.data.map((event: Event) => {
            if (event.slug === slug) {
              const cleanUpdates = Object.fromEntries(
                Object.entries(updates).filter(
                  ([, value]) => value !== undefined
                )
              )
              return {
                ...event,
                ...cleanUpdates,
                updatedAt: new Date().toISOString(),
              }
            }
            return event
          }),
        }
      })

      return { previousEvent, previousEventsList, slug }
    },

    // On success: Set the real updated data
    onSuccess: async (updatedEvent, { slug }) => {
      // Set the actual updated event
      queryClient.setQueryData(queryKeys.event(slug), updatedEvent)

      // Update in events list
      queryClient.setQueryData(queryKeys.eventsList({}), (old: unknown) => {
        const typedOld = old as { data?: Event[] } | undefined
        if (!typedOld?.data) return typedOld

        return {
          ...typedOld,
          data: typedOld.data.map((event: Event) =>
            event.slug === slug ? updatedEvent : event
          ),
        }
      })

      // Invalidate related queries
      await invalidateQueries(queryKeys.events())
    },

    // On error: Rollback optimistic updates
    onError: (_error, { slug }, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(queryKeys.event(slug), context.previousEvent)
      }
      if (context?.previousEventsList) {
        queryClient.setQueryData(
          queryKeys.eventsList({}),
          context.previousEventsList
        )
      }
    },

    // Always run after mutation
    onSettled: (_data, _error, { slug }) => {
      // Ensure specific event is up to date
      void queryClient.invalidateQueries({ queryKey: queryKeys.event(slug) })
      void invalidateQueries(queryKeys.events())
    },
  })
}

/**
 * Hook for deleting events with optimistic updates
 * Implements proper removal and cache cleanup
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEvent,

    // Optimistic update: Remove event from cache immediately
    onMutate: async (slug: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.event(slug) })
      await queryClient.cancelQueries({ queryKey: queryKeys.events() })

      // Snapshot previous values for rollback
      const previousEvent = queryClient.getQueryData(queryKeys.event(slug))
      const previousEventsList = queryClient.getQueryData(
        queryKeys.eventsList({})
      )

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.event(slug) })

      // Optimistically remove from events list
      queryClient.setQueryData(queryKeys.eventsList({}), (old: unknown) => {
        const typedOld = old as
          | { data?: Event[]; pagination?: { total: number } }
          | undefined
        if (!typedOld?.data) return typedOld

        const filteredData = typedOld.data.filter(
          (event: Event) => event.slug !== slug
        )

        return {
          ...typedOld,
          data: filteredData,
          pagination: typedOld.pagination
            ? {
                ...typedOld.pagination,
                total: typedOld.pagination.total - 1,
              }
            : undefined,
        }
      })

      return { previousEvent, previousEventsList, slug }
    },

    // On success: Clean up cache
    onSuccess: async (_, slug) => {
      // Ensure event is completely removed
      queryClient.removeQueries({ queryKey: queryKeys.event(slug) })

      // Invalidate events lists to ensure consistency
      await invalidateQueries(queryKeys.events())
    },

    // On error: Restore optimistic updates
    onError: (_error, slug, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(queryKeys.event(slug), context.previousEvent)
      }
      if (context?.previousEventsList) {
        queryClient.setQueryData(
          queryKeys.eventsList({}),
          context.previousEventsList
        )
      }
    },

    // Always run after mutation
    onSettled: () => {
      // Ensure all events queries are consistent
      void invalidateQueries(queryKeys.events())
    },
  })
}

/**
 * Compound hook that provides all event mutations
 * Follows Compound Components pattern for related functionality
 */
export function useEventMutations() {
  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const deleteMutation = useDeleteEvent()

  // Memoized handlers to prevent unnecessary re-renders
  const createEventHandler = useCallback(
    (eventData: CreateEventDto) => createMutation.mutate(eventData),
    [createMutation]
  )

  const updateEventHandler = useCallback(
    (slug: string, updates: UpdateEventDto) => {
      // Filter out undefined values to satisfy exactOptionalPropertyTypes
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== undefined)
      ) as Partial<Event>
      updateMutation.mutate({ slug, updates: cleanUpdates })
    },
    [updateMutation]
  )

  const deleteEventHandler = useCallback(
    (slug: string) => deleteMutation.mutate(slug),
    [deleteMutation]
  )

  return {
    // Individual mutations
    createMutation,
    updateMutation,
    deleteMutation,

    // Convenient handlers
    createEvent: createEventHandler,
    updateEvent: updateEventHandler,
    deleteEvent: deleteEventHandler,

    // Combined loading state
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,

    // Combined error state
    error: createMutation.error || updateMutation.error || deleteMutation.error,

    // Reset all mutations
    reset: () => {
      createMutation.reset()
      updateMutation.reset()
      deleteMutation.reset()
    },
  }
}

/**
 * Hook for batch operations on events
 * Implements efficient bulk operations with proper cache management
 */
export function useBatchEventOperations() {
  const queryClient = useQueryClient()

  const batchDelete = useMutation({
    mutationFn: async (slugs: string[]) => {
      // Execute all deletes in parallel
      await Promise.all(slugs.map(slug => deleteEvent(slug)))
    },

    onMutate: async (slugs: string[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.events() })

      // Snapshot previous state
      const previousEventsList = queryClient.getQueryData(
        queryKeys.eventsList({})
      )

      // Optimistically remove all events
      queryClient.setQueryData(queryKeys.eventsList({}), (old: unknown) => {
        const typedOld = old as
          | { data?: Event[]; pagination?: { total: number } }
          | undefined
        if (!typedOld?.data) return typedOld

        const filteredData = typedOld.data.filter(
          (event: Event) => !slugs.includes(event.slug)
        )

        return {
          ...typedOld,
          data: filteredData,
          pagination: typedOld.pagination
            ? {
                ...typedOld.pagination,
                total: typedOld.pagination.total - slugs.length,
              }
            : undefined,
        }
      })

      // Remove individual event caches
      slugs.forEach(slug => {
        queryClient.removeQueries({ queryKey: queryKeys.event(slug) })
      })

      return { previousEventsList, slugs }
    },

    onSuccess: async () => {
      await invalidateQueries(queryKeys.events())
    },

    onError: (_error, _slugs, context) => {
      if (context?.previousEventsList) {
        queryClient.setQueryData(
          queryKeys.eventsList({}),
          context.previousEventsList
        )
      }
    },

    onSettled: () => {
      void invalidateQueries(queryKeys.events())
    },
  })

  return {
    batchDelete,
    deleteBatch: (slugs: string[]) => batchDelete.mutate(slugs),
  }
}

/**
 * Utility types for mutation consumers
 */
export type CreateEventMutation = ReturnType<typeof useCreateEvent>
export type UpdateEventMutation = ReturnType<typeof useUpdateEvent>
export type DeleteEventMutation = ReturnType<typeof useDeleteEvent>
export type EventMutationsResult = ReturnType<typeof useEventMutations>
export type BatchEventOperationsResult = ReturnType<
  typeof useBatchEventOperations
>
