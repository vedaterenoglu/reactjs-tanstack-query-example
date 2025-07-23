import { useCallback, useEffect } from 'react'

import type { CitySearchOptions } from '@/lib/types/city.types'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  fetchCities,
  refreshCities,
  searchCities,
  clearSearch,
  selectCity,
  initializeCities,
  retryCityOperation,
  selectCities,
  selectFilteredCities,
  selectSelectedCity,
  selectSearchQuery,
  selectIsLoading,
  selectError,
  selectHasData,
  selectShouldRefresh,
  selectCitiesCount,
  selectFilteredCitiesCount,
} from '@/store/slices/cities'

/**
 * Custom hook for city state management
 * Follows React 19 Custom Hook Pattern and Facade Pattern
 * Encapsulates Redux complexity behind clean component API
 * Implements Single Responsibility Principle for city operations
 */
export const useCities = () => {
  const dispatch = useAppDispatch()

  // Memoized selectors following Observer Pattern
  const cities = useAppSelector(selectCities)
  const filteredCities = useAppSelector(selectFilteredCities)
  const selectedCity = useAppSelector(selectSelectedCity)
  const searchQuery = useAppSelector(selectSearchQuery)
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)
  const hasData = useAppSelector(selectHasData)
  const shouldRefresh = useAppSelector(selectShouldRefresh)
  const citiesCount = useAppSelector(selectCitiesCount)
  const filteredCitiesCount = useAppSelector(selectFilteredCitiesCount)

  // Memoized action dispatchers following Command Pattern
  const fetchCitiesData = useCallback(
    (options?: CitySearchOptions) => dispatch(fetchCities(options)),
    [dispatch]
  )

  const refreshCitiesData = useCallback(
    () => dispatch(refreshCities()),
    [dispatch]
  )

  const searchCitiesData = useCallback(
    (query: string) => dispatch(searchCities(query)),
    [dispatch]
  )

  const clearCitiesSearch = useCallback(
    () => dispatch(clearSearch()),
    [dispatch]
  )

  const selectCityData = useCallback(
    (citySlug: string) => dispatch(selectCity(citySlug)),
    [dispatch]
  )

  const initializeCitiesData = useCallback(
    () => dispatch(initializeCities()),
    [dispatch]
  )

  const retryCityOperationData = useCallback(
    (lastOperation?: 'fetch' | 'search', query?: string) =>
      dispatch(retryCityOperation(lastOperation, query)),
    [dispatch]
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
 * Hook for city search functionality
 * Focused on search-specific operations following SRP
 * Provides optimized interface for search components
 */
export const useCitySearch = () => {
  const dispatch = useAppDispatch()

  const searchQuery = useAppSelector(selectSearchQuery)
  const filteredCities = useAppSelector(selectFilteredCities)
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)
  const filteredCount = useAppSelector(selectFilteredCitiesCount)

  const search = useCallback(
    (query: string) => dispatch(searchCities(query)),
    [dispatch]
  )

  const clearSearchQuery = useCallback(
    () => dispatch(clearSearch()),
    [dispatch]
  )

  const retrySearch = useCallback(
    () => dispatch(retryCityOperation('search', searchQuery)),
    [dispatch, searchQuery]
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
 * Hook for city selection functionality
 * Encapsulates selection logic following SRP
 * Optimized for city card and detail components
 */
export const useCitySelection = () => {
  const dispatch = useAppDispatch()

  const selectedCity = useAppSelector(selectSelectedCity)
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)

  const selectCityById = useCallback(
    (citySlug: string) => dispatch(selectCity(citySlug)),
    [dispatch]
  )

  const clearSelection = useCallback(
    () => dispatch({ type: 'cities/CLEAR_SELECTION' }),
    [dispatch]
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
 * Hook for city data initialization
 * Handles app startup and data refresh scenarios
 * Implements smart loading with error recovery
 */
export const useCityInitialization = () => {
  const dispatch = useAppDispatch()

  const hasData = useAppSelector(selectHasData)
  const shouldRefresh = useAppSelector(selectShouldRefresh)
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)

  const initialize = useCallback(() => {
    dispatch(initializeCities())
  }, [dispatch])

  const refresh = useCallback(() => dispatch(refreshCities()), [dispatch])

  const retry = useCallback(
    () => dispatch(retryCityOperation('fetch')),
    [dispatch]
  )

  // Auto-initialize on mount if needed
  useEffect(() => {
    if (!hasData && !isLoading && !error) {
      initialize()
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
 * Hook for city data with automatic initialization
 * High-level hook combining data access and initialization
 * Perfect for main components that need complete city functionality
 */
export const useCitiesWithInit = () => {
  const cityData = useCities()
  const { initialize, hasData, shouldRefresh } = useCityInitialization()

  console.warn('[useCitiesWithInit] City data state:', {
    filteredCitiesCount: cityData.filteredCities.length,
    isLoading: cityData.isLoading,
    error: cityData.error,
    hasData,
    shouldRefresh,
  })

  // Auto-refresh stale data
  useEffect(() => {
    if (shouldRefresh && !cityData.isLoading) {
      cityData.refreshCities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRefresh, cityData.isLoading, cityData.refreshCities])

  // Initialize if no data
  useEffect(() => {
    if (!hasData && !cityData.isLoading && !cityData.error) {
      initialize()
    }
  }, [hasData, cityData.isLoading, cityData.error, initialize])

  return cityData
}

/**
 * Hook for individual city lookup
 * Optimized for components that work with specific cities
 * Returns city data by slug with selection capabilities
 */
export const useCity = (citySlug?: string) => {
  const cities = useAppSelector(selectCities)
  const selectedCity = useAppSelector(selectSelectedCity)
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)

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
