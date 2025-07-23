/**
 * Cities slice using Redux Toolkit
 * Manages city data, search, selection, and caching with RTK patterns
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist'

import { showErrorNotification } from '@/lib/utils/notifications'
import { cityService } from '@/services/cityService'
import type { RootState, AppDispatch } from '@/store'

import type { City, CitiesState } from './city.types'

// Initial state with type safety
const initialState: CitiesState = {
  cities: [],
  filteredCities: [],
  selectedCity: null,
  searchQuery: '',
  isLoading: false,
  error: null,
  lastFetched: null,
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Async thunks
export const fetchCities = createAsyncThunk<
  City[],
  { forceRefresh?: boolean; searchQuery?: string } | undefined,
  { state: RootState }
>('cities/fetchCities', async (options = {}, { getState, dispatch }) => {
  const state = getState()
  const lastFetched = state.cities.lastFetched
  const currentTime = Date.now()

  // Check cache validity
  if (
    !options.forceRefresh &&
    lastFetched &&
    currentTime - lastFetched < CACHE_DURATION &&
    state.cities.cities.length > 0
  ) {
    // Return cached data
    return state.cities.cities
  }

  // Fetch from API
  const response = await cityService.getCities()

  // Apply search filter if provided
  if (options.searchQuery) {
    dispatch(citySlice.actions.setSearchQuery(options.searchQuery))
  }

  return response.data
})

export const refreshCities = createAsyncThunk<City[], void, { state: RootState }>(
  'cities/refreshCities',
  async (_, { dispatch }) => {
    const response = await dispatch(fetchCities({ forceRefresh: true }))
    return response.payload as City[]
  }
)

export const selectCityBySlug = createAsyncThunk<
  City,
  string,
  { state: RootState }
>('cities/selectCityBySlug', async (citySlug, { getState }) => {
  const state = getState()
  const city = state.cities.cities.find(c => c.citySlug === citySlug)

  if (!city) {
    throw new Error(`City not found: ${citySlug}`)
  }

  return city
})

// Cities slice
const citySlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {
    // Search actions
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      state.filteredCities = state.cities.filter(
        (city: City) =>
          city.city.toLowerCase().includes(action.payload.toLowerCase()) ||
          city.citySlug.toLowerCase().includes(action.payload.toLowerCase())
      )
    },
    clearSearch: state => {
      state.searchQuery = ''
      state.filteredCities = state.cities
    },

    // Selection actions
    selectCity: (state, action: PayloadAction<City>) => {
      state.selectedCity = action.payload
    },
    clearSelection: state => {
      state.selectedCity = null
    },

    // Cache management
    invalidateCache: state => {
      state.lastFetched = null
    },
  },
  extraReducers: builder => {
    builder
      // Fetch cities
      .addCase(fetchCities.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.isLoading = false
        state.cities = action.payload
        state.filteredCities = state.searchQuery
          ? action.payload.filter(
              city =>
                city.city.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
                city.citySlug.toLowerCase().includes(state.searchQuery.toLowerCase())
            )
          : action.payload
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch cities'
        showErrorNotification(state.error)
      })

      // Select city by slug
      .addCase(selectCityBySlug.fulfilled, (state, action) => {
        state.selectedCity = action.payload
      })
      .addCase(selectCityBySlug.rejected, (state, action) => {
        state.error = action.error.message || 'City not found'
        showErrorNotification(state.error)
      })

      // Handle redux-persist rehydrate
      .addMatcher(
        action => action.type === REHYDRATE,
        (state, action) => {
          const rehydrateAction = action as { payload?: { cities?: CitiesState } }
          if (rehydrateAction.payload?.cities) {
            return {
              ...state,
              ...rehydrateAction.payload.cities,
              isLoading: false,
            }
          }
        }
      )
  },
})

// Export actions and reducer
export const { setSearchQuery, clearSearch, selectCity, clearSelection, invalidateCache } =
  citySlice.actions
export const cityReducer = citySlice.reducer

// Thunk wrappers for backward compatibility
export const searchCities = (query: string) => async (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  dispatch(setSearchQuery(query))

  // Fetch cities if not already loaded
  const state = getState()
  if (state.cities.cities.length === 0) {
    await dispatch(fetchCities({ searchQuery: query }))
  }
}

export const clearCitySearch = () => (dispatch: AppDispatch) => {
  dispatch(clearSearch())
}

export const initializeCities = () => async (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const state = getState()
  const currentTime = Date.now()
  const cacheAge = state.cities.lastFetched
    ? currentTime - state.cities.lastFetched
    : Infinity

  // Initialize if cache is stale or empty
  if (cacheAge > CACHE_DURATION || state.cities.cities.length === 0) {
    await dispatch(fetchCities())
  }
}

export const retryCityOperation = () => async (dispatch: AppDispatch) => {
  await dispatch(fetchCities({ forceRefresh: true }))
}