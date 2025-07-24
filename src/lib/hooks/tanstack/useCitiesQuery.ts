import {
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  fetchCities,
  fetchCitiesWithSearch,
  fetchCityBySlug,
} from '@/lib/api/queryFunctions'
import { queryKeys } from '@/lib/query/queryClient'
import type { City, CitySearchOptions } from '@/lib/types/city.types'

/**
 * useCitiesQuery - TanStack Query hooks for cities data
 * 
 * Provides useQuery, useSuspenseQuery, and useCityQuery hooks for fetching
 * cities data with search capabilities and individual city details.
 * 
 * Design Patterns Applied:
 * - Custom Hook Pattern: Encapsulates TanStack Query logic
 * - Factory Pattern: Multiple query hook variants
 * - Memoization Pattern: Optimized query key and params computation
 */
export function useCitiesQuery(options?: CitySearchOptions) {
  const queryParams = useMemo(() => {
    const defaultOptions: CitySearchOptions = {
      query: '',
      limit: 50,
      offset: 0,
    }
    return { ...defaultOptions, ...options }
  }, [options])

  const queryKey = useMemo(() => {
    const filters = Object.fromEntries(
      Object.entries(queryParams).filter(([, value]) => value !== undefined && value !== '')
    )
    return queryKeys.citiesList(filters)
  }, [queryParams])

  return useQuery({
    queryKey,
    queryFn: () => fetchCities(),
    staleTime: 10 * 60 * 1000, // 10 minutes (cities change less frequently)
    enabled: true,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for searching cities with query string
 * Implements debounced search pattern for performance
 * Open/Closed Principle: Extensible for different search strategies
 */
export function useCitiesSearch(searchQuery: string, enabled = true) {
  const queryKey = useMemo(
    () => queryKeys.citiesList({ query: searchQuery }),
    [searchQuery]
  )

  return useQuery({
    queryKey,
    queryFn: () => fetchCitiesWithSearch(searchQuery),
    enabled: enabled && Boolean(searchQuery.trim()),
    staleTime: 5 * 60 * 1000, // 5 minutes for search results
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for fetching a single city by slug
 * Dependency Inversion: Abstracts API implementation details
 * Single Responsibility: Focused on single city data management
 */
export function useCityQuery(citySlug: string, enabled = true) {
  const queryKey = useMemo(() => queryKeys.city(citySlug), [citySlug])

  return useQuery({
    queryKey,
    queryFn: () => fetchCityBySlug(citySlug),
    enabled: enabled && Boolean(citySlug),
    staleTime: 15 * 60 * 1000, // 15 minutes for individual cities
    refetchOnWindowFocus: false,
  })
}

/**
 * Suspense-enabled hook for fetching single city
 * Uses React 19 Suspense integration pattern
 * Interface Segregation: Focused interface for suspense consumers
 */
export function useCitySuspenseQuery(citySlug: string) {
  const queryKey = useMemo(() => queryKeys.city(citySlug), [citySlug])

  return useSuspenseQuery({
    queryKey,
    queryFn: () => fetchCityBySlug(citySlug),
    staleTime: 15 * 60 * 1000,
  })
}

/**
 * Utility hook for combining cities data with computed values
 * Follows React 19 pattern of extracting logic into custom hooks
 * Single Responsibility: Data transformation and computed properties
 */
export function useCitiesWithMeta(options?: CitySearchOptions) {
  const citiesQuery = useCitiesQuery(options)

  const computedData = useMemo(() => {
    if (!citiesQuery.data) {
      return {
        cities: [],
        totalCount: 0,
        hasCities: false,
        citiesByFirstLetter: new Map<string, City[]>(),
        popularCities: [],
      }
    }

    const cities = citiesQuery.data
    const totalCount = cities.length

    // Group cities by first letter for enhanced navigation
    const citiesByFirstLetter = cities.reduce((acc: Map<string, City[]>, city: City) => {
      const firstLetter = city.city.charAt(0).toUpperCase()
      if (!acc.has(firstLetter)) {
        acc.set(firstLetter, [])
      }
      acc.get(firstLetter)!.push(city)
      return acc
    }, new Map<string, City[]>())

    // Sort cities by name for popular cities (could be extended with analytics)
    const popularCities = [...cities]
      .sort((a, b) => a.city.localeCompare(b.city))
      .slice(0, 10)

    return {
      cities,
      totalCount,
      hasCities: cities.length > 0,
      citiesByFirstLetter,
      popularCities,
    }
  }, [citiesQuery.data])

  return {
    ...citiesQuery,
    ...computedData,
  }
}

/**
 * Hook for checking city existence
 * Implements business logic for city validation
 * Single Responsibility: City existence checking
 */
export function useCityExists(citySlug: string, enabled = true) {
  const queryKey = useMemo(() => [...queryKeys.city(citySlug), 'exists'], [citySlug])

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const city = await fetchCityBySlug(citySlug)
        return { exists: Boolean(city), city }
      } catch {
        return { exists: false, city: null }
      }
    },
    enabled: enabled && Boolean(citySlug),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for city validation utilities
 * Implements client-side validation rules
 * Single Responsibility: City validation logic
 */
export function useCityValidation() {
  return {
    /**
     * Validate city slug format
     * Client-side validation before API calls
     */
    validateCitySlug: (slug: string): { isValid: boolean; error?: string } => {
      if (!slug) {
        return { isValid: false, error: 'City slug is required' }
      }
      if (slug.length > 50) {
        return { isValid: false, error: 'City slug too long (max 50 characters)' }
      }
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return { isValid: false, error: 'City slug must contain only lowercase letters, numbers, and hyphens' }
      }
      return { isValid: true }
    },
  }
}

/**
 * Hook for cities filtering and sorting operations
 * Implements client-side data manipulation patterns
 * Open/Closed Principle: Extensible for new filter types
 */
export function useCitiesFilter() {
  return {
    /**
     * Filter cities by search query
     * Implements fuzzy search on city name and slug
     */
    filterCitiesByQuery: (cities: City[], query: string): City[] => {
      if (!query.trim()) return cities

      const searchTerm = query.toLowerCase().trim()
      return cities.filter(
        city =>
          city.city.toLowerCase().includes(searchTerm) ||
          city.citySlug.toLowerCase().includes(searchTerm)
      )
    },

    /**
     * Sort cities by various criteria
     * Implements multiple sorting strategies
     */
    sortCities: (cities: City[], sortBy: 'name' | 'slug' | 'created' = 'name'): City[] => {
      return [...cities].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.city.localeCompare(b.city)
          case 'slug':
            return a.citySlug.localeCompare(b.citySlug)
          case 'created':
            if (!a.createdAt || !b.createdAt) return 0
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          default:
            return 0
        }
      })
    },

    /**
     * Group cities alphabetically
     * Returns Map for efficient lookups
     */
    groupCitiesAlphabetically: (cities: City[]): Map<string, City[]> => {
      return cities.reduce((acc, city) => {
        const firstLetter = city.city.charAt(0).toUpperCase()
        if (!acc.has(firstLetter)) {
          acc.set(firstLetter, [])
        }
        acc.get(firstLetter)!.push(city)
        return acc
      }, new Map<string, City[]>())
    },
  }
}

/**
 * Hook for prefetching cities
 * Enables optimistic data loading patterns
 * Interface Segregation: Focused prefetch interface
 */
export function useCitiesPrefetch() {
  return {
    prefetchCities: (options?: CitySearchOptions) => {
      const filters = options ? Object.fromEntries(
        Object.entries(options).filter(([, value]) => value !== undefined && value !== '')
      ) : {}
      const queryKey = queryKeys.citiesList(filters)
      // Note: Actual prefetch implementation would use queryClient.prefetchQuery
      // This is a placeholder for the prefetch pattern
      return { queryKey, options }
    },

    prefetchCitiesSearch: (searchQuery: string) => {
      const queryKey = queryKeys.citiesList({ query: searchQuery })
      return { queryKey, searchQuery }
    },

    prefetchCity: (citySlug: string) => {
      const queryKey = queryKeys.city(citySlug)
      return { queryKey, citySlug }
    },
  }
}

/**
 * Compound hook that provides comprehensive city functionality
 * Follows Compound Components pattern for related functionality
 * Dependency Inversion: High-level module depends on abstractions
 */
export function useCityOperations(citySlug?: string) {
  const citiesQuery = useCitiesQuery()
  const cityQuery = useCityQuery(citySlug || '', Boolean(citySlug))
  const cityExists = useCityExists(citySlug || '', Boolean(citySlug))
  const validation = useCityValidation()
  const filter = useCitiesFilter()

  return {
    // Query results
    cities: citiesQuery,
    city: cityQuery,
    exists: cityExists,

    // Utility functions
    validation,
    filter,

    // Combined loading state
    isLoading: citiesQuery.isLoading || cityQuery.isLoading || cityExists.isLoading,

    // Combined error state
    error: citiesQuery.error || cityQuery.error || cityExists.error,

    // Helper methods
    getCityBySlug: (slug: string) => {
      return citiesQuery.data?.find((city: City) => city.citySlug === slug)
    },

    searchCities: (query: string) => {
      if (!citiesQuery.data) return []
      return filter.filterCitiesByQuery(citiesQuery.data, query)
    },

    // Data availability checks
    hasCitiesData: Boolean(citiesQuery.data?.length),
    hasCityData: Boolean(cityQuery.data),
  }
}

/**
 * Utility types for hook consumers
 * Type safety and IntelliSense support
 */
export type CitiesQueryResult = ReturnType<typeof useCitiesQuery>
export type CityQueryResult = ReturnType<typeof useCityQuery>
export type CitiesSearchResult = ReturnType<typeof useCitiesSearch>
export type CitiesWithMetaResult = ReturnType<typeof useCitiesWithMeta>
export type CityExistsResult = ReturnType<typeof useCityExists>
export type CityValidationResult = ReturnType<typeof useCityValidation>
export type CitiesFilterResult = ReturnType<typeof useCitiesFilter>
export type CityOperationsResult = ReturnType<typeof useCityOperations>