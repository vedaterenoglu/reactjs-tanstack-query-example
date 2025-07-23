/**
 * Cities Redux Slice - Redux Toolkit Implementation
 *
 * Exports:
 * - Actions from createSlice
 * - Reducer function
 * - Memoized selectors
 * - Async thunk operations
 *
 * Following Redux Toolkit patterns with less boilerplate
 * Implements SOLID principles and immutable state management with Immer
 */

export {
  cityReducer,
  setSearchQuery,
  clearSearch,
  selectCity,
  clearSelection,
  invalidateCache,
  fetchCities,
  refreshCities,
  selectCityBySlug,
  searchCities,
  clearCitySearch,
  initializeCities,
  retryCityOperation,
} from './citySlice'
export * from './citySelectors'
