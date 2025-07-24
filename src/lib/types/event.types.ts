import { z } from 'zod'

import type {
  BaseQueryResult,
  BaseMutationResult,
  TanStackQueryError,
  QueryOptions,
} from './tanstack-query.types'

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

// TanStack Query hook result types following Single Responsibility Principle
export type EventsQueryResult = BaseQueryResult<EventsApiResponse, TanStackQueryError>
export type EventQueryResult = BaseQueryResult<SingleEventApiResponse, TanStackQueryError>

// Mutation result types for event operations
export type EventMutationResult<TData = unknown, TVariables = unknown> = BaseMutationResult<
  TData,
  TanStackQueryError,
  TVariables
>

// Event-specific query options
export type EventQueryOptions = QueryOptions<EventsApiResponse, TanStackQueryError>
export type SingleEventQueryOptions = QueryOptions<SingleEventApiResponse, TanStackQueryError>

// Pagination state schema for TanStack Query integration
export const PaginationStateSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20),
  total: z.number().int().min(0).default(0),
  totalPages: z.number().int().min(0).default(0),
  offset: z.number().int().min(0).default(0),
  hasMore: z.boolean().default(false),
})

export type PaginationState = z.infer<typeof PaginationStateSchema>

// Client-side state schemas (non-server state)
export const EventsClientStateSchema = z.object({
  searchQuery: z.string().default(''),
  cityFilter: z.string().default(''),
  selectedEventSlug: z.string().optional(),
  pagination: PaginationStateSchema,
  filters: z.record(z.string(), z.unknown()).default({}),
})

export type EventsClientState = z.infer<typeof EventsClientStateSchema>

export type PageCache = z.infer<typeof PageCacheSchema>

// Query Key Factory for Events following TanStack Query best practices
export const eventQueryKeys = {
  all: ['events'] as const,
  lists: () => [...eventQueryKeys.all, 'list'] as const,
  list: (filters?: EventsQueryParams) => [...eventQueryKeys.lists(), filters] as const,
  details: () => [...eventQueryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...eventQueryKeys.details(), slug] as const,
  search: (query: string) => [...eventQueryKeys.all, 'search', query] as const,
  byCity: (citySlug: string) => [...eventQueryKeys.all, 'city', citySlug] as const,
} as const

// Query Key Types for type safety
export type EventQueryKey = 
  | typeof eventQueryKeys.all
  | ReturnType<typeof eventQueryKeys.lists>
  | ReturnType<typeof eventQueryKeys.list>
  | ReturnType<typeof eventQueryKeys.details>
  | ReturnType<typeof eventQueryKeys.detail>
  | ReturnType<typeof eventQueryKeys.search>
  | ReturnType<typeof eventQueryKeys.byCity>
