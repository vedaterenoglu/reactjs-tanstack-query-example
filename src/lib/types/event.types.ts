import { z } from 'zod'

/**
 * Event Zod Schemas - Mirroring Portfolio Events API Schema
 *
 * Design Patterns Applied:
 * - Schema-First Design: Zod schemas define data structure and validation
 * - Type Safety Pattern: TypeScript types inferred from Zod schemas
 * - API Contract Pattern: Frontend schemas match backend API responses
 * - Validation Pattern: Runtime type checking for API responses
 *
 * Backend API Alignment:
 * - Matches TEvent Prisma model structure
 * - Price stored in cents (backend) / displayed formatted (frontend)
 * - Date validation ensures ISO string format from API
 * - Slug validation matches backend regex patterns
 */

// Core Event Schema (matches backend TEvent model)
export const EventSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  city: z.string().min(1).max(100),
  citySlug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  location: z.string().min(1).max(300),
  date: z.string().datetime(), // ISO string from API
  organizerName: z.string().min(1).max(150),
  imageUrl: z.string().url().max(500),
  alt: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().int().min(0), // Price in dollars (e.g., 70 = $70.00)
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

// Events API Response Schema (matches /api/events endpoint)
export const EventsApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(EventSchema),
  pagination: z
    .object({
      total: z.number().int().min(0),
      limit: z.number().int().positive(),
      offset: z.number().int().min(0),
      hasMore: z.boolean().optional(),
    })
    .optional(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
})

// Single Event API Response Schema (matches /api/events/:slug endpoint)
export const SingleEventApiResponseSchema = z.object({
  success: z.boolean(),
  data: EventSchema,
  message: z.string().optional(),
  timestamp: z.string().optional(),
})

// Event Query Parameters Schema (matches API query params)
export const EventsQueryParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(12),
  offset: z.number().int().min(0).optional().default(0),
  city: z.string().min(1).max(100).optional(),
  search: z.string().min(1).max(200).optional(),
  sortBy: z.enum(['date', 'name', 'price']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
})

// TypeScript Types inferred from Zod schemas
export type Event = z.infer<typeof EventSchema>
export type EventsApiResponse = z.infer<typeof EventsApiResponseSchema>
export type SingleEventApiResponse = z.infer<
  typeof SingleEventApiResponseSchema
>
export type EventsQueryParams = z.infer<typeof EventsQueryParamsSchema>

// Utility schemas for frontend formatting
export const FormattedEventSchema = EventSchema.extend({
  formattedPrice: z.string(), // "$25.00"
  formattedDate: z.string(), // "July 15, 2024"
  formattedTime: z.string(), // "7:00 PM"
})

export type FormattedEvent = z.infer<typeof FormattedEventSchema>

// Event creation/update schemas (for future admin features)
export const CreateEventSchema = EventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateEventSchema = CreateEventSchema.partial()

export type CreateEventDto = z.infer<typeof CreateEventSchema>
export type UpdateEventDto = z.infer<typeof UpdateEventSchema>

// Validation utilities for runtime checking
export const validateEventsResponse = (data: unknown): EventsApiResponse => {
  return EventsApiResponseSchema.parse(data)
}

export const validateSingleEventResponse = (
  data: unknown
): SingleEventApiResponse => {
  return SingleEventApiResponseSchema.parse(data)
}

export const validateEvent = (data: unknown): Event => {
  return EventSchema.parse(data)
}

// Page cache schema for storing fetched pages
export const PageCacheSchema = z.object({
  events: z.array(EventSchema),
  timestamp: z.number(), // Unix timestamp for cache invalidation
})

// Redux state schema for events with enhanced pagination
export const EventsStateSchema = z.object({
  events: z.array(EventSchema),
  filteredEvents: z.array(EventSchema),
  selectedEvent: EventSchema.nullable(),
  searchQuery: z.string(),
  cityFilter: z.string().optional(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
  lastFetched: z.number().nullable(),
  pagination: z
    .object({
      limit: z.number(),
      offset: z.number(),
      total: z.number().optional(),
      hasMore: z.boolean().optional(),
    })
    .nullable(),

  // Enhanced pagination state
  currentPage: z.number().int().positive().default(1),
  itemsPerPage: z.number().int().positive().default(12),
  totalPages: z.number().int().min(0).default(0),

  // Page caching system
  cachedPages: z.record(z.string(), PageCacheSchema).default({}),

  // Enhanced prefetch state following Strategy Pattern + Interface Segregation
  prefetchingPage: z.number().int().positive().nullable().default(null),
  prefetchedPages: z.array(z.number()).default([]),

  // Prefetch queue management (Command Pattern)
  prefetchQueue: z
    .array(
      z.object({
        page: z.number().int().positive(),
        priority: z.enum(['high', 'normal', 'low']).default('normal'),
        strategy: z
          .enum(['immediate', 'delayed', 'network-aware'])
          .default('immediate'),
        timestamp: z.number(),
        requestId: z.string().uuid(),
      })
    )
    .default([]),

  // Active prefetch tracking (Factory Pattern for AbortController management)
  activePrefetches: z
    .record(
      z.string(),
      z.object({
        page: z.number(),
        startTime: z.number(),
        abortReason: z.string().optional(),
      })
    )
    .default({}),

  // Network awareness state (Observer Pattern)
  networkStatus: z
    .object({
      isOnline: z.boolean().default(true),
      connectionSpeed: z.enum(['fast', 'slow', 'unknown']).default('unknown'),
      dataSaver: z.boolean().default(false),
      lastChecked: z.number().optional(),
    })
    .default(() => ({
      isOnline: true,
      connectionSpeed: 'unknown' as const,
      dataSaver: false,
    })),

  // Prefetch configuration (Strategy Pattern)
  prefetchConfig: z
    .object({
      maxConcurrentRequests: z.number().int().positive().default(2),
      networkAwareThreshold: z.number().default(1000), // ms
      delayMs: z.number().default(500),
      enabledStrategies: z.array(z.string()).default(['immediate', 'delayed']),
      prefetchEnabled: z.boolean().default(true),
    })
    .default(() => ({
      maxConcurrentRequests: 2,
      networkAwareThreshold: 1000,
      delayMs: 500,
      enabledStrategies: ['immediate', 'delayed'],
      prefetchEnabled: true,
    })),

  // Failed prefetch tracking for retry logic
  failedPrefetches: z
    .record(
      z.string(),
      z.object({
        page: z.number(),
        error: z.string(),
        retryCount: z.number().default(0),
        lastAttempt: z.number(),
      })
    )
    .default({}),

  // UI state
  isChangingPage: z.boolean().default(false),
})

export type EventsState = z.infer<typeof EventsStateSchema>
export type PageCache = z.infer<typeof PageCacheSchema>
