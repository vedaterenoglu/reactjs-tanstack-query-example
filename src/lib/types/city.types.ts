/**
 * City types and schemas - Type definitions and validation for city data
 * Includes Zod schemas, TypeScript types, API response types, and validation utilities
 */

import { z } from 'zod'

import type {
  BaseQueryResult,
  TanStackQueryError,
  QueryOptions,
} from './tanstack-query.types'

// Base validation utilities (from backend sanitization patterns)
const validateSlug = (val: string, maxLength: number): string => {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, maxLength)
}

const sanitizePlainText = (val: string, maxLength: number): string => {
  return val.trim().slice(0, maxLength)
}

const validateAndSanitizeURL = (val: string): string => {
  try {
    const url = new URL(val)
    return url.toString()
  } catch {
    throw new Error('Invalid URL format')
  }
}

// Zod schemas matching backend (from portfolio-events-rest-api/src/schemas/city.schema.ts)
export const CitySchema = z.object({
  citySlug: z
    .string()
    .min(1, 'City slug is required')
    .max(50, 'City slug too long')
    .transform(val => validateSlug(val, 50)),

  city: z
    .string()
    .min(1, 'City name is required')
    .max(100, 'City name too long')
    .transform(val => sanitizePlainText(val, 100)),

  url: z
    .string()
    .min(1, 'URL is required')
    .max(500, 'URL too long')
    .transform(val => validateAndSanitizeURL(val)),

  alt: z
    .string()
    .min(1, 'Alt text is required')
    .max(200, 'Alt text too long')
    .transform(val => sanitizePlainText(val, 200)),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

// Derived TypeScript types (Single Source of Truth)
export type City = z.infer<typeof CitySchema>

// API operation schemas
export const CreateCitySchema = CitySchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type CreateCity = z.infer<typeof CreateCitySchema>

export const UpdateCitySchema = CreateCitySchema.partial()

export type UpdateCity = z.infer<typeof UpdateCitySchema>

// API Response schemas
export const CitiesApiResponseSchema = z.object({
  data: z.array(CitySchema),
  pagination: z
    .object({
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
    })
    .optional(),
})

export type CitiesApiResponse = z.infer<typeof CitiesApiResponseSchema>

// Search options schema
export const CitySearchOptionsSchema = z.object({
  query: z.string().min(0),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
})

export type CitySearchOptions = z.infer<typeof CitySearchOptionsSchema>

// UI-specific display schema
export const CityDisplaySchema = z.object({
  slug: z.string(),
  name: z.string(),
  imageUrl: z.string().url(),
  imageAlt: z.string(),
  isSelected: z.boolean().optional(),
})

export type CityDisplay = z.infer<typeof CityDisplaySchema>

// TanStack Query hook result types following Single Responsibility Principle
export type CitiesQueryResult = BaseQueryResult<City[], TanStackQueryError>

// City-specific query options
export type CityQueryOptions = QueryOptions<City[], TanStackQueryError>

// Client-side state schema (non-server state) for TanStack Query integration
export const CitiesClientStateSchema = z.object({
  searchQuery: z.string().default(''),
  selectedCitySlug: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).default({}),
})

export type CitiesClientState = z.infer<typeof CitiesClientStateSchema>

// API Error schema
export const ApiErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number(),
  error: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

// Validation utilities for runtime checking
export const validateCityResponse = (data: unknown): CitiesApiResponse => {
  return CitiesApiResponseSchema.parse(data)
}

export const validateCity = (data: unknown): City => {
  return CitySchema.parse(data)
}

export const transformCityToDisplay = (city: City): CityDisplay => {
  return {
    slug: city.citySlug,
    name: city.city,
    imageUrl: city.url,
    imageAlt: city.alt,
  }
}

// Query Key Factory for Cities following TanStack Query best practices
export const cityQueryKeys = {
  all: ['cities'] as const,
  lists: () => [...cityQueryKeys.all, 'list'] as const,
  list: (filters?: CitySearchOptions) => [...cityQueryKeys.lists(), filters] as const,
  details: () => [...cityQueryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...cityQueryKeys.details(), slug] as const,
  search: (query: string) => [...cityQueryKeys.all, 'search', query] as const,
} as const

// Query Key Types for type safety
export type CityQueryKey = 
  | typeof cityQueryKeys.all
  | ReturnType<typeof cityQueryKeys.lists>
  | ReturnType<typeof cityQueryKeys.list>
  | ReturnType<typeof cityQueryKeys.details>
  | ReturnType<typeof cityQueryKeys.detail>
  | ReturnType<typeof cityQueryKeys.search>
