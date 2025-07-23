/**
 * City actions - Redux action types, interfaces, and action creators for city management
 * Follows FSA (Flux Standard Action) pattern with typed actions and creators
 */

import type { City } from '@/lib/types/city.types'

// Action Types - Following traditional Redux naming convention
export const CITY_ACTIONS = {
  // Async action types
  FETCH_CITIES_REQUEST: 'cities/FETCH_CITIES_REQUEST',
  FETCH_CITIES_SUCCESS: 'cities/FETCH_CITIES_SUCCESS',
  FETCH_CITIES_FAILURE: 'cities/FETCH_CITIES_FAILURE',

  // Search actions
  SET_SEARCH_QUERY: 'cities/SET_SEARCH_QUERY',
  CLEAR_SEARCH: 'cities/CLEAR_SEARCH',
  FILTER_CITIES: 'cities/FILTER_CITIES',

  // Selection actions
  SELECT_CITY: 'cities/SELECT_CITY',
  CLEAR_SELECTION: 'cities/CLEAR_SELECTION',

  // Cache management
  INVALIDATE_CACHE: 'cities/INVALIDATE_CACHE',
  SET_LAST_FETCHED: 'cities/SET_LAST_FETCHED',
} as const

// Action Interfaces following FSA (Flux Standard Action) pattern
interface FetchCitiesRequestAction {
  type: typeof CITY_ACTIONS.FETCH_CITIES_REQUEST
  meta?: {
    searchQuery: string
  }
}

interface FetchCitiesSuccessAction {
  type: typeof CITY_ACTIONS.FETCH_CITIES_SUCCESS
  payload: {
    cities: City[]
    total: number | undefined
  }
}

interface FetchCitiesFailureAction {
  type: typeof CITY_ACTIONS.FETCH_CITIES_FAILURE
  payload: {
    error: string
  }
  error: true
}

interface SetSearchQueryAction {
  type: typeof CITY_ACTIONS.SET_SEARCH_QUERY
  payload: {
    query: string
  }
}

interface ClearSearchAction {
  type: typeof CITY_ACTIONS.CLEAR_SEARCH
}

interface FilterCitiesAction {
  type: typeof CITY_ACTIONS.FILTER_CITIES
  payload: {
    filteredCities: City[]
  }
}

interface SelectCityAction {
  type: typeof CITY_ACTIONS.SELECT_CITY
  payload: {
    city: City
  }
}

interface ClearSelectionAction {
  type: typeof CITY_ACTIONS.CLEAR_SELECTION
}

interface InvalidateCacheAction {
  type: typeof CITY_ACTIONS.INVALIDATE_CACHE
}

interface SetLastFetchedAction {
  type: typeof CITY_ACTIONS.SET_LAST_FETCHED
  payload: {
    timestamp: number
  }
}

// Union type for all city actions
export type CityAction =
  | FetchCitiesRequestAction
  | FetchCitiesSuccessAction
  | FetchCitiesFailureAction
  | SetSearchQueryAction
  | ClearSearchAction
  | FilterCitiesAction
  | SelectCityAction
  | ClearSelectionAction
  | InvalidateCacheAction
  | SetLastFetchedAction

// Action Creators - Pure functions that return actions
export const cityActionCreators = {
  // Async action creators (will be used by thunks)
  fetchCitiesRequest: (searchQuery?: string): FetchCitiesRequestAction => {
    const action: FetchCitiesRequestAction = {
      type: CITY_ACTIONS.FETCH_CITIES_REQUEST,
    }
    if (searchQuery) {
      action.meta = { searchQuery }
    }
    return action
  },

  fetchCitiesSuccess: (
    cities: City[],
    total?: number
  ): FetchCitiesSuccessAction => ({
    type: CITY_ACTIONS.FETCH_CITIES_SUCCESS,
    payload: { cities, total },
  }),

  fetchCitiesFailure: (error: string): FetchCitiesFailureAction => ({
    type: CITY_ACTIONS.FETCH_CITIES_FAILURE,
    payload: { error },
    error: true,
  }),

  // Search action creators
  setSearchQuery: (query: string): SetSearchQueryAction => ({
    type: CITY_ACTIONS.SET_SEARCH_QUERY,
    payload: { query },
  }),

  clearSearch: (): ClearSearchAction => ({
    type: CITY_ACTIONS.CLEAR_SEARCH,
  }),

  filterCities: (filteredCities: City[]): FilterCitiesAction => ({
    type: CITY_ACTIONS.FILTER_CITIES,
    payload: { filteredCities },
  }),

  // Selection action creators
  selectCity: (city: City): SelectCityAction => ({
    type: CITY_ACTIONS.SELECT_CITY,
    payload: { city },
  }),

  clearSelection: (): ClearSelectionAction => ({
    type: CITY_ACTIONS.CLEAR_SELECTION,
  }),

  // Cache management action creators
  invalidateCache: (): InvalidateCacheAction => ({
    type: CITY_ACTIONS.INVALIDATE_CACHE,
  }),

  setLastFetched: (timestamp: number): SetLastFetchedAction => ({
    type: CITY_ACTIONS.SET_LAST_FETCHED,
    payload: { timestamp },
  }),
}
