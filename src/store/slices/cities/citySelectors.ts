import { createSelector } from 'reselect'

import type { CitiesState } from '@/lib/types/city.types'
import type { RootState } from '@/store'

/**
 * City Selectors - Memoized state selectors using Reselect
 * Follows Selector Pattern for efficient state access
 * Implements memoization to prevent unnecessary re-renders
 */

// Base selectors
export const selectCitiesState = (state: RootState): CitiesState => 
  state.cities || {
    cities: [],
    filteredCities: [],
    selectedCity: null,
    searchQuery: '',
    isLoading: false,
    error: null,
    lastFetched: null,
  }

export const selectCities = createSelector(
  [selectCitiesState],
  (citiesState) => citiesState.cities
)

export const selectFilteredCities = createSelector(
  [selectCitiesState],
  (citiesState) => citiesState.filteredCities
)

export const selectSelectedCity = createSelector(
  [selectCitiesState],
  (citiesState) => citiesState.selectedCity
)

export const selectSearchQuery = createSelector(
  [selectCitiesState],
  (citiesState) => citiesState.searchQuery
)

export const selectIsLoading = createSelector(
  [selectCitiesState],
  (citiesState) => citiesState.isLoading
)

export const selectError = createSelector(
  [selectCitiesState],
  (citiesState) => citiesState.error
)

export const selectLastFetched = createSelector(
  [selectCitiesState],
  (citiesState) => citiesState.lastFetched
)

// Derived selectors
export const selectCitiesCount = createSelector(
  [selectCities],
  (cities) => cities.length
)

export const selectFilteredCitiesCount = createSelector(
  [selectFilteredCities],
  (filteredCities) => filteredCities.length
)

export const selectHasSearchQuery = createSelector(
  [selectSearchQuery],
  (searchQuery) => searchQuery.length > 0
)

export const selectHasError = createSelector(
  [selectError],
  (error) => error !== null
)

export const selectHasData = createSelector(
  [selectCities],
  (cities) => cities.length > 0
)

// Cache selectors
export const selectCacheAge = createSelector(
  [selectLastFetched],
  (lastFetched) => {
    if (!lastFetched) return null
    return Date.now() - lastFetched
  }
)

export const selectIsCacheStale = createSelector(
  [selectCacheAge],
  (cacheAge) => {
    if (cacheAge === null) return true
    // Consider cache stale after 5 minutes
    const CACHE_EXPIRY = 5 * 60 * 1000
    return cacheAge > CACHE_EXPIRY
  }
)

// City lookup selectors
export const selectCityBySlug = createSelector(
  [selectCities, (_state: RootState, slug: string) => slug],
  (cities, slug) => cities.find(city => city.citySlug === slug)
)

export const selectCitiesBySearchTerm = createSelector(
  [selectCities, (_state: RootState, searchTerm: string) => searchTerm],
  (cities, searchTerm) => {
    if (!searchTerm.trim()) return cities
    
    const term = searchTerm.toLowerCase().trim()
    return cities.filter(city =>
      city.city.toLowerCase().includes(term) ||
      city.citySlug.toLowerCase().includes(term)
    )
  }
)

// UI state selectors
export const selectIsEmpty = createSelector(
  [selectHasData, selectIsLoading],
  (hasData, isLoading) => !hasData && !isLoading
)

export const selectShouldShowEmptyState = createSelector(
  [selectIsEmpty, selectHasError],
  (isEmpty, hasError) => isEmpty && !hasError
)

export const selectShouldRefresh = createSelector(
  [selectIsCacheStale, selectHasError, selectIsLoading],
  (isCacheStale, hasError, isLoading) => 
    (isCacheStale || hasError) && !isLoading
)