/**
 * Custom Hooks Barrel Export
 * 
 * Centralized export for all custom hooks following React 19 patterns
 * Enables clean imports and better organization
 */

// Theme hooks (existing)
export { useTheme } from './useTheme'

// City management hooks (new)
export {
  useCities,
  useCitySearch,
  useCitySelection,
  useCityInitialization,
  useCitiesWithInit,
  useCity,
} from './useCities'

// Animation hooks
export {
  useScrollAnimation,
  useStaggeredScrollAnimation
} from './useScrollAnimation'
