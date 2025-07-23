/**
 * RTK Query API Slice - Enhanced API operations with automatic caching
 * Complements existing async thunks with advanced caching and invalidation
 * 
 * Design Patterns Applied:
 * - Facade Pattern: Clean API interface hiding RTK Query complexity
 * - Observer Pattern: Automatic cache invalidation and updates
 * - Strategy Pattern: Different caching strategies per endpoint
 * - Command Pattern: Mutations as commands with automatic optimistic updates
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { 
  Event, 
  EventsApiResponse, 
  SingleEventApiResponse,
  EventsQueryParams 
} from '@/lib/types/event.types'

// Base query configuration
const baseQuery = fetchBaseQuery({
  baseUrl: '/api', // Simplified base URL
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json')
    return headers
  },
})

// Define cache tags for intelligent invalidation
export const API_TAGS = {
  Event: 'Event' as const,
  EventList: 'EventList' as const,
  City: 'City' as const,
  CityList: 'CityList' as const,
} as const

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: Object.values(API_TAGS),
  
  endpoints: (builder) => ({
    // Event Endpoints - Simplified for demonstration
    getEvents: builder.query<Event[], Partial<EventsQueryParams>>({
      query: (params = {}) => ({
        url: '/events',
        params: {
          limit: params.limit || 12,
          offset: params.offset || 0,
          sortBy: params.sortBy || 'date',
          order: params.order || 'asc',
          ...(params.city && { city: params.city }),
          ...(params.search && { search: params.search }),
        },
      }),
      transformResponse: (response: EventsApiResponse): Event[] => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ slug }) => ({ type: API_TAGS.Event, id: slug } as const)),
              { type: API_TAGS.EventList, id: 'LIST' },
            ]
          : [{ type: API_TAGS.EventList, id: 'LIST' }],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    getEventBySlug: builder.query<Event, string>({
      query: (slug) => `/events/${slug}`,
      transformResponse: (response: SingleEventApiResponse): Event => response.data,
      providesTags: (_result, _error, slug) => [{ type: API_TAGS.Event, id: slug }],
      keepUnusedDataFor: 600, // 10 minutes
    }),

    // Admin Mutations (for future enhancement)
    createEvent: builder.mutation<Event, Partial<Event>>({
      query: (event) => ({
        url: '/api/admin/events',
        method: 'POST',
        body: event,
      }),
      transformResponse: (response: SingleEventApiResponse): Event => response.data,
      invalidatesTags: [{ type: API_TAGS.EventList, id: 'LIST' }],
      // Optimistic update for immediate UI feedback
      async onQueryStarted(_newEvent, { dispatch, queryFulfilled }) {
        try {
          const { data: createdEvent } = await queryFulfilled
          
          // Update the events list cache optimistically
          dispatch(
            apiSlice.util.updateQueryData('getEvents', {}, (draft) => {
              draft.unshift(createdEvent)
            })
          )
        } catch {
          // Rollback handled automatically by RTK Query
        }
      },
    }),

    updateEvent: builder.mutation<Event, { slug: string; updates: Partial<Event> }>({
      query: ({ slug, updates }) => ({
        url: `/api/admin/events/${slug}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response: SingleEventApiResponse): Event => response.data,
      invalidatesTags: (_result, _error, { slug }) => [
        { type: API_TAGS.Event, id: slug },
        { type: API_TAGS.EventList, id: 'LIST' },
      ],
      // Optimistic update
      async onQueryStarted({ slug, updates }, { dispatch, queryFulfilled }) {
        // Optimistically update individual event cache
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getEventBySlug', slug, (draft) => {
            Object.assign(draft, updates)
          })
        )

        try {
          await queryFulfilled
        } catch {
          // Rollback on error
          patchResult.undo()
        }
      },
    }),

    deleteEvent: builder.mutation<void, string>({
      query: (slug) => ({
        url: `/api/admin/events/${slug}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, slug) => [
        { type: API_TAGS.Event, id: slug },
        { type: API_TAGS.EventList, id: 'LIST' },
      ],
      // Optimistic removal
      async onQueryStarted(slug, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getEvents', {}, (draft) => {
            const index = draft.findIndex(event => event.slug === slug)
            if (index !== -1) {
              draft.splice(index, 1)
            }
          })
        )

        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
    }),
  }),
})

// Export hooks for use in components
export const {
  useGetEventsQuery,
  useLazyGetEventsQuery,
  useGetEventBySlugQuery,
  useLazyGetEventBySlugQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = apiSlice

// Export for store configuration
export default apiSlice