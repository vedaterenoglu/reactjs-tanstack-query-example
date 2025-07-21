import {
  validateCityResponse,
  validateCity,
  type City,
  type CitiesApiResponse,
  type CreateCity,
  type UpdateCity,
  type CitySearchOptions,
} from '@/lib/types/city.types'

import { FetchAdapter } from '../adapters/fetchAdapter'

import type { HttpClient } from '../interfaces/httpClient.interface'

/**
 * City API Facade - Provides simplified interface for city operations
 * Follows Facade Pattern to hide complexity of HTTP operations and validation
 * Implements business logic for city-related API calls
 */
export class CityApiService {
  private httpClient: HttpClient
  private readonly apiBasePath = '/api'

  constructor(
    httpClient?: HttpClient,
    baseUrl: string = 'http://localhost:3060'
  ) {
    this.httpClient = httpClient || new FetchAdapter(baseUrl)
  }

  /**
   * Get all cities with optional search filtering
   * Validates response using Zod schema
   */
  async getCities(options?: CitySearchOptions): Promise<CitiesApiResponse> {
    try {
      const params: Record<string, string | number> = {}
      
      if (options?.query) {
        params['search'] = options.query
      }
      if (options?.limit) {
        params['limit'] = options.limit
      }
      if (options?.offset) {
        params['offset'] = options.offset
      }

      const response = await this.httpClient.get<CitiesApiResponse>(
        `${this.apiBasePath}/cities`,
        { params }
      )

      // Validate response using Zod schema
      return validateCityResponse(response.data)
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch cities')
    }
  }

  /**
   * Get a single city by slug
   */
  async getCityBySlug(slug: string): Promise<City> {
    try {
      if (!slug) {
        throw new Error('City slug is required')
      }

      const response = await this.httpClient.get<City>(
        `${this.apiBasePath}/cities/${slug}`
      )

      // Validate single city response
      return validateCity(response.data)
    } catch (error) {
      throw this.handleApiError(error, `Failed to fetch city: ${slug}`)
    }
  }

  /**
   * Create a new city (Admin only)
   */
  async createCity(cityData: CreateCity): Promise<City> {
    try {
      const response = await this.httpClient.post<City>(
        `${this.apiBasePath}/admin/cities`,
        cityData
      )

      return validateCity(response.data)
    } catch (error) {
      throw this.handleApiError(error, 'Failed to create city')
    }
  }

  /**
   * Update an existing city (Admin only)
   */
  async updateCity(slug: string, cityData: UpdateCity): Promise<City> {
    try {
      if (!slug) {
        throw new Error('City slug is required')
      }

      const response = await this.httpClient.put<City>(
        `${this.apiBasePath}/admin/cities/${slug}`,
        cityData
      )

      return validateCity(response.data)
    } catch (error) {
      throw this.handleApiError(error, `Failed to update city: ${slug}`)
    }
  }

  /**
   * Delete a city (Admin only)
   */
  async deleteCity(slug: string): Promise<void> {
    try {
      if (!slug) {
        throw new Error('City slug is required')
      }

      await this.httpClient.delete<void>(
        `${this.apiBasePath}/admin/cities/${slug}`
      )
    } catch (error) {
      throw this.handleApiError(error, `Failed to delete city: ${slug}`)
    }
  }

  /**
   * Search cities by name (client-side filtering)
   * This method provides local search functionality
   */
  searchCitiesLocally(cities: City[], query: string): City[] {
    if (!query.trim()) {
      return cities
    }

    const searchTerm = query.toLowerCase().trim()
    return cities.filter(city =>
      city.city.toLowerCase().includes(searchTerm) ||
      city.citySlug.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Transform API error to user-friendly message
   * Centralizes error handling logic
   */
  private handleApiError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      // Check if it's a validation error
      if (error.name === 'ZodError') {
        return new Error(`Data validation failed: ${error.message}`)
      }
      
      // Check if it's an HTTP error with status
      if ('status' in error) {
        const status = (error as { status: number }).status
        switch (status) {
          case 404:
            return new Error('Resource not found')
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
export const cityApiService = new CityApiService()

// Export factory function for custom configuration
export const createCityApiService = (
  httpClient?: HttpClient,
  baseUrl?: string
): CityApiService => {
  return new CityApiService(httpClient, baseUrl)
}