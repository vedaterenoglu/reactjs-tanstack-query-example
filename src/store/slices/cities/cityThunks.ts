import type { CitySearchOptions } from '@/lib/types/city.types'
import { cityApiService } from '@/services/api/facades/cityApi'
import type { AppThunk } from '@/store'

import { cityActionCreators } from './cityActions'
import {
  selectCacheAge,
  selectIsCacheStale,
  selectCities,
} from './citySelectors'

/**
 * City Thunks - Async action creators using Redux Thunk
 * Follows Command Pattern to encapsulate async operations
 * Integrates with API Facade following Dependency Inversion Principle
 * Implements comprehensive error handling and cache management
 */

/**
 * Fetch all cities with optional search/filtering
 * Implements caching strategy to avoid unnecessary API calls
 */
export const fetchCities = (options?: CitySearchOptions): AppThunk => {
  return async (dispatch, getState) => {
    try {
      // Check cache validity - avoid redundant API calls
      const state = getState()
      const isCacheStale = selectIsCacheStale(state)
      const currentCities = selectCities(state)

      // Skip fetch if cache is fresh and no search query
      if (!isCacheStale && currentCities.length > 0 && !options?.query) {
        return
      }

      // Dispatch request action to show loading state
      dispatch(cityActionCreators.fetchCitiesRequest(options?.query))

      // Call API facade - abstracts HTTP implementation details
      const response = await cityApiService.getCities(options)

      // Dispatch success action with fetched data
      dispatch(
        cityActionCreators.fetchCitiesSuccess(
          response.data,
          response.pagination?.total
        )
      )

      // Auto-filter if search query provided
      if (options?.query) {
        const filteredCities = cityApiService.searchCitiesLocally(
          response.data,
          options.query
        )
        dispatch(cityActionCreators.filterCities(filteredCities))
        dispatch(cityActionCreators.setSearchQuery(options.query))
      }
    } catch (error) {
      console.error('[fetchCities] API call failed:', error)

      // Transform error to user-friendly message
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch cities. Please try again.'

      dispatch(cityActionCreators.fetchCitiesFailure(errorMessage))

      // Re-throw for component-level error handling if needed
      throw error
    }
  }
}

/**
 * Refresh cities data - force fetch bypassing cache
 * Used when user explicitly requests fresh data
 */
export const refreshCities = (): AppThunk => {
  return async dispatch => {
    // Invalidate cache first
    dispatch(cityActionCreators.invalidateCache())

    // Fetch fresh data
    return dispatch(fetchCities())
  }
}

/**
 * Search cities by query - client-side filtering
 * Implements local search for better performance
 */
export const searchCities = (query: string): AppThunk => {
  return async (dispatch, getState) => {
    try {
      // Update search query in state
      dispatch(cityActionCreators.setSearchQuery(query))

      const state = getState()
      const allCities = selectCities(state)

      // No cities loaded yet - fetch with search
      if (allCities.length === 0) {
        return dispatch(fetchCities({ query }))
      }

      // Local search on existing data
      const filteredCities = cityApiService.searchCitiesLocally(
        allCities,
        query
      )
      dispatch(cityActionCreators.filterCities(filteredCities))
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Search failed. Please try again.'

      dispatch(cityActionCreators.fetchCitiesFailure(errorMessage))
      throw error
    }
  }
}

/**
 * Clear search and show all cities
 * Resets filtered view to show complete city list
 */
export const clearSearch = (): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(cityActionCreators.clearSearch())

    const state = getState()
    const allCities = selectCities(state)

    // Restore full list as filtered list
    dispatch(cityActionCreators.filterCities(allCities))
  }
}

/**
 * Select a city for detailed view or further actions
 * Implements selection state management
 */
export const selectCity = (citySlug: string): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const state = getState()
      const cities = selectCities(state)

      // Find city in local state first
      const city = cities.find(c => c.citySlug === citySlug)

      if (city) {
        dispatch(cityActionCreators.selectCity(city))
        return city
      }

      // City not found locally - might need to fetch
      // For now, clear selection if city not found
      dispatch(cityActionCreators.clearSelection())
      throw new Error(`City with slug "${citySlug}" not found`)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to select city'

      dispatch(cityActionCreators.fetchCitiesFailure(errorMessage))
      throw error
    }
  }
}

/**
 * Initialize cities data - load on app startup
 * Implements smart loading with cache awareness
 */
export const initializeCities = (): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const state = getState()
      const cacheAge = selectCacheAge(state)
      const currentCities = selectCities(state)

      console.warn('[initializeCities] State check:', {
        cacheAge,
        currentCitiesLength: currentCities.length,
      })

      // Load fresh data if no cache or cache is very old (> 1 hour)
      const INITIALIZATION_CACHE_LIMIT = 60 * 60 * 1000 // 1 hour
      const shouldInitialize =
        !cacheAge ||
        cacheAge > INITIALIZATION_CACHE_LIMIT ||
        currentCities.length === 0

      if (shouldInitialize) {
        dispatch(fetchCities())
      }
    } catch (error) {
      // Don't throw on initialization - app should still work
      console.error('[initializeCities] Failed to initialize cities:', error)
    }
  }
}

/**
 * Retry failed operations
 * Provides user recovery mechanism for network issues
 */
export const retryCityOperation = (
  lastOperation?: 'fetch' | 'search',
  query?: string
): AppThunk => {
  return async dispatch => {
    switch (lastOperation) {
      case 'search':
        if (query) {
          return dispatch(searchCities(query))
        }
        break
      case 'fetch':
      default:
        return dispatch(fetchCities())
    }
  }
}
