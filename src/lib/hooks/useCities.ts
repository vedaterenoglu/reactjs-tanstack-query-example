import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  useCitiesQuery,
} from '@/lib/hooks/tanstack/useCitiesQuery'

/**
 * Custom hook for city state management with TanStack Query
 * Follows React 19 Custom Hook Pattern and Facade Pattern
 * Encapsulates TanStack Query complexity behind clean component API
 * Implements Single Responsibility Principle for city operations
 */
export const useCities = () => {
  // Local state for search and selection (client-side state)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<{ citySlug: string } | null>(null)

  // TanStack Query for server state
  const citiesQuery = useCitiesQuery()

  // Filtered cities based on search query
  const filteredCities = useMemo(() => {
    const cities = citiesQuery.data || []
    if (!searchQuery.trim()) return cities

    const query = searchQuery.toLowerCase()
    return cities.filter(city =>
      city.city.toLowerCase().includes(query) ||
      city.citySlug.toLowerCase().includes(query)
    )
  }, [citiesQuery.data, searchQuery])

  // Derived state following Single Responsibility
  const cities = useMemo(() => citiesQuery.data || [], [citiesQuery.data])
  const isLoading = citiesQuery.isLoading
  const error = citiesQuery.error
  const hasData = Boolean(cities.length)
  const shouldRefresh = citiesQuery.isStale
  const citiesCount = cities.length
  const filteredCitiesCount = filteredCities.length

  // Memoized action handlers following Command Pattern
  const fetchCitiesData = useCallback(
    async (options?: { forceRefresh?: boolean; searchQuery?: string }) => {
      if (options?.forceRefresh) {
        await citiesQuery.refetch()
      }
      if (options?.searchQuery !== undefined) {
        setSearchQuery(options.searchQuery)
      }
    },
    [citiesQuery]
  )

  const refreshCitiesData = useCallback(
    async () => {
      await citiesQuery.refetch()
    },
    [citiesQuery]
  )

  const searchCitiesData = useCallback(
    (query: string) => {
      setSearchQuery(query)
    },
    []
  )

  const clearCitiesSearch = useCallback(
    () => {
      setSearchQuery('')
    },
    []
  )

  const selectCityData = useCallback(
    (citySlug: string) => {
      const city = cities.find(c => c.citySlug === citySlug)
      if (city) {
        setSelectedCity({ citySlug })
      }
    },
    [cities]
  )

  const initializeCitiesData = useCallback(
    async () => {
      if (!hasData && !isLoading) {
        await citiesQuery.refetch()
      }
    },
    [hasData, isLoading, citiesQuery]
  )

  const retryCityOperationData = useCallback(
    async () => {
      await citiesQuery.refetch()
    },
    [citiesQuery]
  )

  return {
    // State data
    cities,
    filteredCities,
    selectedCity,
    searchQuery,
    isLoading,
    error,
    hasData,
    shouldRefresh,
    citiesCount,
    filteredCitiesCount,

    // Action dispatchers
    fetchCities: fetchCitiesData,
    refreshCities: refreshCitiesData,
    searchCities: searchCitiesData,
    clearSearch: clearCitiesSearch,
    selectCity: selectCityData,
    initializeCities: initializeCitiesData,
    retryOperation: retryCityOperationData,
  }
}

/**
 * Hook for city search functionality with TanStack Query
 * Focused on search-specific operations following SRP
 * Provides optimized interface for search components
 */
export const useCitySearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const citiesQuery = useCitiesQuery()

  // Filtered cities based on search query
  const filteredCities = useMemo(() => {
    const cities = citiesQuery.data || []
    if (!searchQuery.trim()) return cities

    const query = searchQuery.toLowerCase()
    return cities.filter(city =>
      city.city.toLowerCase().includes(query) ||
      city.citySlug.toLowerCase().includes(query)
    )
  }, [citiesQuery.data, searchQuery])

  const isLoading = citiesQuery.isLoading
  const error = citiesQuery.error
  const filteredCount = filteredCities.length

  const search = useCallback(
    (query: string) => {
      setSearchQuery(query)
    },
    []
  )

  const clearSearchQuery = useCallback(
    () => {
      setSearchQuery('')
    },
    []
  )

  const retrySearch = useCallback(
    async () => {
      await citiesQuery.refetch()
    },
    [citiesQuery]
  )

  return {
    searchQuery,
    filteredCities,
    isLoading,
    error,
    filteredCount,
    search,
    clearSearch: clearSearchQuery,
    retrySearch,
  }
}

/**
 * Hook for city selection functionality with TanStack Query
 * Encapsulates selection logic following SRP
 * Optimized for city card and detail components
 */
export const useCitySelection = () => {
  const [selectedCity, setSelectedCity] = useState<{ citySlug: string } | null>(null)
  const citiesQuery = useCitiesQuery()

  const isLoading = citiesQuery.isLoading
  const error = citiesQuery.error

  const selectCityById = useCallback(
    (citySlug: string) => {
      const cities = citiesQuery.data || []
      const city = cities.find(c => c.citySlug === citySlug)
      if (city) {
        setSelectedCity({ citySlug })
      }
    },
    [citiesQuery.data]
  )

  const clearSelection = useCallback(
    () => {
      setSelectedCity(null)
    },
    []
  )

  return {
    selectedCity,
    isLoading,
    error,
    selectCity: selectCityById,
    clearSelection,
  }
}

/**
 * Hook for city data initialization with TanStack Query
 * Handles app startup and data refresh scenarios
 * Implements smart loading with error recovery
 */
export const useCityInitialization = () => {
  const citiesQuery = useCitiesQuery()

  const hasData = Boolean(citiesQuery.data?.length)
  const shouldRefresh = citiesQuery.isStale
  const isLoading = citiesQuery.isLoading
  const error = citiesQuery.error

  const initialize = useCallback(async () => {
    if (!hasData && !isLoading) {
      await citiesQuery.refetch()
    }
  }, [hasData, isLoading, citiesQuery])

  const refresh = useCallback(async () => {
    await citiesQuery.refetch()
  }, [citiesQuery])

  const retry = useCallback(async () => {
    await citiesQuery.refetch()
  }, [citiesQuery])

  // Auto-initialize on mount if needed
  useEffect(() => {
    if (!hasData && !isLoading && !error) {
      void initialize()
    }
  }, [hasData, isLoading, error, initialize])

  return {
    hasData,
    shouldRefresh,
    isLoading,
    error,
    initialize,
    refresh,
    retry,
  }
}

/**
 * Hook for city data with automatic initialization using TanStack Query
 * High-level hook combining data access and initialization
 * Perfect for main components that need complete city functionality
 */
export const useCitiesWithInit = () => {
  const cityData = useCities()
  const { initialize, hasData, shouldRefresh, refresh } = useCityInitialization()

  console.warn('[useCitiesWithInit] City data state:', {
    filteredCitiesCount: cityData.filteredCities.length,
    isLoading: cityData.isLoading,
    error: cityData.error,
    hasData,
    shouldRefresh,
  })

  // Auto-refresh stale data using stable refresh function
  useEffect(() => {
    if (shouldRefresh && !cityData.isLoading) {
      void refresh()
    }
  }, [shouldRefresh, cityData.isLoading, refresh])

  // Initialize if no data
  useEffect(() => {
    if (!hasData && !cityData.isLoading && !cityData.error) {
      void initialize()
    }
  }, [hasData, cityData.isLoading, cityData.error, initialize])

  return cityData
}

/**
 * Hook for individual city lookup with TanStack Query
 * Optimized for components that work with specific cities
 * Returns city data by slug with selection capabilities
 */
export const useCity = (citySlug?: string) => {
  const citiesQuery = useCitiesQuery()
  const { selectedCity } = useCitySelection()

  const cities = citiesQuery.data || []
  const isLoading = citiesQuery.isLoading
  const error = citiesQuery.error

  // Find specific city by slug
  const city = citySlug ? cities.find(c => c.citySlug === citySlug) : undefined

  // Determine if this city is currently selected
  const isSelected = selectedCity?.citySlug === citySlug

  return {
    city,
    isSelected,
    selectedCity,
    isLoading,
    error,
    exists: Boolean(city),
  }
}
