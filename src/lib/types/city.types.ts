import { z } from 'zod'

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

// Redux state schema
export const CitiesStateSchema = z.object({
  cities: z.array(CitySchema),
  filteredCities: z.array(CitySchema),
  selectedCity: CitySchema.nullable(),
  searchQuery: z.string(),
  isLoading: z.boolean(),
  error: z.string().nullable(),
  lastFetched: z.number().nullable(),
})

export type CitiesState = z.infer<typeof CitiesStateSchema>

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
