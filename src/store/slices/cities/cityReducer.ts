import { REHYDRATE } from 'redux-persist'

import type { CitiesState } from '@/lib/types/city.types'

import { CITY_ACTIONS, type CityAction } from './cityActions'

import type { Action } from 'redux'

// Initial state following CitiesState interface
const initialState: CitiesState = {
  cities: [],
  filteredCities: [],
  selectedCity: null,
  searchQuery: '',
  isLoading: false,
  error: null,
  lastFetched: null,
}

/**
 * City Reducer - Pure function handling city state transitions
 * Follows traditional Redux pattern with immutable state updates
 * Implements Single Responsibility Principle - only handles city state
 */
export function cityReducer(
  state: CitiesState = initialState,
  action: Action
): CitiesState {
  switch (action.type) {
    // Redux Persist rehydration
    case REHYDRATE: {
      const rehydrateAction = action as Action & {
        payload?: { cities?: CitiesState }
      }
      const persistedCityState = rehydrateAction.payload?.cities

      if (persistedCityState) {
        return {
          ...persistedCityState,
          isLoading: false, // Reset loading state after rehydration
          error: null,
        }
      }
      return {
        ...state,
        isLoading: false, // Always reset loading after rehydration
        error: null,
      }
    }
    // Async loading states
    case CITY_ACTIONS.FETCH_CITIES_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case CITY_ACTIONS.FETCH_CITIES_SUCCESS: {
      const successAction = action as CityAction & {
        type: typeof CITY_ACTIONS.FETCH_CITIES_SUCCESS
      }
      return {
        ...state,
        cities: successAction.payload.cities,
        filteredCities: successAction.payload.cities,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      }
    }

    case CITY_ACTIONS.FETCH_CITIES_FAILURE: {
      const failureAction = action as CityAction & {
        type: typeof CITY_ACTIONS.FETCH_CITIES_FAILURE
      }
      return {
        ...state,
        isLoading: false,
        error: failureAction.payload.error,
        cities: [],
        filteredCities: [],
      }
    }

    // Search functionality
    case CITY_ACTIONS.SET_SEARCH_QUERY: {
      const searchAction = action as CityAction & {
        type: typeof CITY_ACTIONS.SET_SEARCH_QUERY
      }
      return {
        ...state,
        searchQuery: searchAction.payload.query,
      }
    }

    case CITY_ACTIONS.CLEAR_SEARCH:
      return {
        ...state,
        searchQuery: '',
        filteredCities: state.cities,
      }

    case CITY_ACTIONS.FILTER_CITIES: {
      const filterAction = action as CityAction & {
        type: typeof CITY_ACTIONS.FILTER_CITIES
      }
      return {
        ...state,
        filteredCities: filterAction.payload.filteredCities,
      }
    }

    // City selection
    case CITY_ACTIONS.SELECT_CITY: {
      const selectAction = action as CityAction & {
        type: typeof CITY_ACTIONS.SELECT_CITY
      }
      return {
        ...state,
        selectedCity: selectAction.payload.city,
      }
    }

    case CITY_ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedCity: null,
      }

    // Cache management
    case CITY_ACTIONS.INVALIDATE_CACHE:
      return {
        ...state,
        lastFetched: null,
        cities: [],
        filteredCities: [],
        error: null,
      }

    case CITY_ACTIONS.SET_LAST_FETCHED: {
      const timestampAction = action as CityAction & {
        type: typeof CITY_ACTIONS.SET_LAST_FETCHED
      }
      return {
        ...state,
        lastFetched: timestampAction.payload.timestamp,
      }
    }

    default:
      return state
  }
}
