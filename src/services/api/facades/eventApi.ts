import {
  validateEventsResponse,
  validateSingleEventResponse,
  type Event,
  type EventsApiResponse,
  type CreateEventDto,
  type UpdateEventDto,
  type EventsQueryParams,
} from '@/lib/types/event.types'

import { FetchAdapter } from '../adapters/fetchAdapter'

import type { HttpClient } from '../interfaces/httpClient.interface'

/**
 * Event API Facade - Provides simplified interface for event operations
 * 
 * Design Patterns Applied:
 * 1. **Facade Pattern**: Hides complexity of HTTP operations and validation
 *    - Provides clean, simple interface for event API operations
 *    - Encapsulates error handling and data transformation
 * 
 * 2. **Adapter Pattern**: Works with HttpClient interface
 *    - Allows different HTTP implementations (fetch, axios, etc)
 * 
 * 3. **Singleton Pattern**: Default instance exported for convenience
 * 
 * SOLID Principles:
 * - **SRP**: Only handles event-related API operations
 * - **OCP**: Extensible through HttpClient injection
 * - **LSP**: Can substitute any HttpClient implementation
 * - **ISP**: Focused interface for event operations only
 * - **DIP**: Depends on HttpClient abstraction, not concrete implementation
 * 
 * Backend API Alignment:
 * - Matches Portfolio Events REST API endpoints
 * - Handles both public (/api/events) and admin (/api/admin/events) routes
 * - Validates responses using Zod schemas
 */
export class EventApiService {
  private httpClient: HttpClient
  private readonly apiBasePath = '/api'

  constructor(
    httpClient?: HttpClient,
    baseUrl: string = import.meta.env['VITE_API_BASE_URL'] || 'http://localhost:3060'
  ) {
    this.httpClient = httpClient || new FetchAdapter(baseUrl)
  }

  /**
   * Get all events with optional filtering and pagination
   * Endpoint: GET /api/events
   * Validates response using Zod schema
   */
  async getEvents(params?: EventsQueryParams): Promise<EventsApiResponse> {
    try {
      const queryParams: Record<string, string | number> = {}

      if (params?.search) {
        queryParams['search'] = params.search
      }
      if (params?.city) {
        queryParams['city'] = params.city
      }
      if (params?.limit) {
        queryParams['limit'] = params.limit
      }
      if (params?.offset) {
        queryParams['offset'] = params.offset
      }
      if (params?.sortBy) {
        queryParams['sortBy'] = params.sortBy
      }
      if (params?.order) {
        queryParams['order'] = params.order
      }

      const response = await this.httpClient.get<{
        count: number
        events: unknown[]
        pagination?: {
          limit: number
          offset: number
          hasMore: boolean
        }
      }>(`${this.apiBasePath}/events`, { params: queryParams })

      // Transform backend response to match EventsApiResponse schema (same pattern as Cities API)
      const transformedResponse: EventsApiResponse = {
        success: true,
        data: response.data.events as Event[],
        pagination: response.data.count !== undefined ? {
          total: response.data.count,
          limit: params?.limit || 12,
          offset: params?.offset || 0,
          hasMore: response.data.pagination?.hasMore,
        } : undefined,
        timestamp: new Date().toISOString(),
      }

      // Validate transformed response using Zod validation function
      return validateEventsResponse(transformedResponse)
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch events')
    }
  }

  /**
   * Get a single event by slug
   * Endpoint: GET /api/events/:slug
   */
  async getEventBySlug(slug: string): Promise<Event> {
    try {
      if (!slug) {
        throw new Error('Event slug is required')
      }

      const response = await this.httpClient.get<unknown>(
        `${this.apiBasePath}/events/${slug}`
      )

      // Validate single event response
      const validatedResponse = validateSingleEventResponse(response.data)
      return validatedResponse.data
    } catch (error) {
      throw this.handleApiError(error, `Failed to fetch event: ${slug}`)
    }
  }

  /**
   * Create a new event (Admin only)
   * Endpoint: POST /api/admin/events
   */
  async createEvent(eventData: CreateEventDto): Promise<Event> {
    try {
      const response = await this.httpClient.post<unknown>(
        `${this.apiBasePath}/admin/events`,
        eventData
      )

      // Validate the response data
      const validatedResponse = validateSingleEventResponse(response.data)
      return validatedResponse.data
    } catch (error) {
      throw this.handleApiError(error, 'Failed to create event')
    }
  }

  /**
   * Update an existing event (Admin only)
   * Endpoint: PUT /api/admin/events/:slug
   */
  async updateEvent(slug: string, eventData: UpdateEventDto): Promise<Event> {
    try {
      if (!slug) {
        throw new Error('Event slug is required')
      }

      const response = await this.httpClient.put<unknown>(
        `${this.apiBasePath}/admin/events/${slug}`,
        eventData
      )

      // Validate the response data
      const validatedResponse = validateSingleEventResponse(response.data)
      return validatedResponse.data
    } catch (error) {
      throw this.handleApiError(error, `Failed to update event: ${slug}`)
    }
  }

  /**
   * Delete an event (Admin only)
   * Endpoint: DELETE /api/admin/events/:slug
   */
  async deleteEvent(slug: string): Promise<void> {
    try {
      if (!slug) {
        throw new Error('Event slug is required')
      }

      await this.httpClient.delete<void>(
        `${this.apiBasePath}/admin/events/${slug}`
      )
    } catch (error) {
      throw this.handleApiError(error, `Failed to delete event: ${slug}`)
    }
  }

  /**
   * Search events locally (client-side filtering)
   * This method provides local search functionality for already fetched events
   */
  searchEventsLocally(events: Event[], query: string): Event[] {
    if (!query.trim()) {
      return events
    }

    const searchTerm = query.toLowerCase().trim()
    return events.filter(
      event =>
        event.name.toLowerCase().includes(searchTerm) ||
        event.city.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm) ||
        event.organizerName.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Filter events by city locally
   */
  filterEventsByCity(events: Event[], citySlug: string): Event[] {
    if (!citySlug.trim()) {
      return events
    }

    return events.filter(event => event.citySlug === citySlug)
  }

  /**
   * Transform API error to user-friendly message
   * Centralizes error handling logic
   */
  private handleApiError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      // Check if it's a Zod validation error
      if (error.name === 'ZodError') {
        return new Error(`Data validation failed: ${error.message}`)
      }

      // Check if it's an HTTP error with status
      if ('status' in error) {
        const status = (error as { status: number }).status
        switch (status) {
          case 404:
            return new Error('Event not found')
          case 401:
            return new Error('Authentication required')
          case 403:
            return new Error('Access forbidden')
          case 429:
            return new Error('Too many requests. Please try again later.')
          case 500:
            return new Error('Server error. Please try again later.')
          default:
            return new Error(`HTTP ${status}: ${error.message}`)
        }
      }

      return new Error(`${defaultMessage}: ${error.message}`)
    }

    return new Error(defaultMessage)
  }
}

// Export singleton instance for easy use
export const eventApiService = new EventApiService()

// Export factory function for custom configuration
export const createEventApiService = (
  httpClient?: HttpClient,
  baseUrl?: string
): EventApiService => {
  return new EventApiService(httpClient, baseUrl)
}