/**
 * queryFunctions - TanStack Query function definitions for API integration
 * 
 * Provides standardized query functions for TanStack Query hooks to interact
 * with city and event APIs. Implements proper error handling, type safety,
 * and consistent parameter patterns for reactive data fetching.
 * 
 * Design Patterns Applied:
 * - Query Function Pattern: Standardized async functions for TanStack Query
 * - Facade Pattern: Abstracts service layer complexity from query hooks
 * - Error Handling Pattern: Consistent error propagation for query boundaries
 * - Type Safety Pattern: Full TypeScript integration with API response types
 */

import type { City } from '@/lib/types/city.types'
import type {
  Event,
  EventsQueryParams,
  EventsApiResponse,
  CreateEventDto,
} from '@/lib/types/event.types'
import { cityService } from '@/services/cityService'
import { eventApiService } from '@/services/eventApiService'

// Events Query Functions for TanStack Query

/**
 * Fetch events with pagination and filtering
 * CRITICAL: Uses 'search' parameter for citySlug filtering, not 'city'
 * Backend API: GET /api/events?search=austin (citySlug)
 */
export const fetchEvents = async (
  params: EventsQueryParams
): Promise<EventsApiResponse> => {
  return await eventApiService.getEvents(params)
}

/**
 * Fetch events by city slug using search parameter
 * CRITICAL: Frontend queries backend with citySlug via 'search' parameter
 * Example: fetchEventsByCity('austin') -> GET /api/events?search=austin
 */
export const fetchEventsByCity = async (
  citySlug: string
): Promise<EventsApiResponse> => {
  const params: EventsQueryParams = {
    search: citySlug, // Use search parameter with citySlug value
    limit: 50,
    offset: 0,
    sortBy: 'date',
    order: 'asc',
  }
  return await eventApiService.getEvents(params)
}

/**
 * Fetch events with search query
 * Uses search parameter for text-based searching
 */
export const fetchEventsWithSearch = async (
  searchQuery: string
): Promise<EventsApiResponse> => {
  const params: EventsQueryParams = {
    search: searchQuery,
    limit: 50,
    offset: 0,
    sortBy: 'date',
    order: 'asc',
  }
  return await eventApiService.getEvents(params)
}

/**
 * Fetch paginated events
 */
export const fetchPaginatedEvents = async (params: {
  page: number
  limit: number
  search?: string
  sortBy?: 'date' | 'name' | 'price'
  order?: 'asc' | 'desc'
}): Promise<EventsApiResponse> => {
  const queryParams: EventsQueryParams = {
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
    sortBy: params.sortBy || 'date',
    order: params.order || 'asc',
    ...(params.search && { search: params.search }),
  }
  return await eventApiService.getEvents(queryParams)
}

/**
 * Fetch single event by slug
 */
export const fetchEventBySlug = async (slug: string): Promise<Event> => {
  return await eventApiService.getEventBySlug(slug)
}

// Event Mutation Functions for TanStack Query

/**
 * Create new event
 */
export const createEvent = async (
  eventData: CreateEventDto
): Promise<Event> => {
  return await eventApiService.createEvent(eventData)
}

/**
 * Update existing event
 */
export const updateEvent = async (params: {
  slug: string
  updates: Partial<Event>
}): Promise<Event> => {
  return await eventApiService.updateEvent(params.slug, params.updates)
}

/**
 * Delete event
 */
export const deleteEvent = async (slug: string): Promise<void> => {
  await eventApiService.deleteEvent(slug)
}

// Cities Query Functions for TanStack Query

/**
 * Fetch all cities
 */
export const fetchCities = async (): Promise<City[]> => {
  const response = await cityService.getCities()
  return response.data
}

/**
 * Fetch cities with search
 */
export const fetchCitiesWithSearch = async (
  searchQuery: string
): Promise<City[]> => {
  const response = await cityService.getCities({ query: searchQuery })
  return response.data
}

/**
 * Fetch single city by slug
 * Remember: citySlug is the ID in cities table
 */
export const fetchCityBySlug = async (
  citySlug: string
): Promise<City | undefined> => {
  return await cityService.getCityBySlug(citySlug)
}

// Utility Types for TanStack Query

export interface EventsQueryKey {
  scope: 'events'
  entity?: 'list' | 'detail' | 'search' | 'by-city'
  filters?: {
    search?: string
    page?: number
    limit?: number
    sortBy?: string
    order?: string
  }
  slug?: string
}

export interface CitiesQueryKey {
  scope: 'cities'
  entity?: 'list' | 'detail' | 'search'
  filters?: {
    search?: string
  }
  slug?: string
}

// Query Key Factories (extending from queryClient.ts)

export const createEventsQueryKey = (
  entity: EventsQueryKey['entity'] = 'list',
  filters?: EventsQueryKey['filters'],
  slug?: string
): EventsQueryKey => ({
  scope: 'events',
  entity,
  ...(filters && { filters }),
  ...(slug && { slug }),
})

export const createCitiesQueryKey = (
  entity: CitiesQueryKey['entity'] = 'list',
  filters?: CitiesQueryKey['filters'],
  slug?: string
): CitiesQueryKey => ({
  scope: 'cities',
  entity,
  ...(filters && { filters }),
  ...(slug && { slug }),
})
