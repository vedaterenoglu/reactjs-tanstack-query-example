import { RefreshCw } from 'lucide-react'

import { CityCard } from '@/components/cards'
import { ScrollAnimateWrapper } from '@/components/ui/ScrollAnimateWrapper'
import type { City } from '@/lib/types/city.types'

/**
 * CitiesGrid Component - Semantic cities list with results header and scroll animations
 *
 * Current Features:
 * - Semantic <section> with proper ARIA labeling for screen readers
 * - Results header with <h3> showing count and search context
 * - Loading indicator for partial updates (refresh during search)
 * - Semantic <ul>/<li> list structure instead of generic div grid
 * - ScrollAnimateWrapper with fadeUp animation (0.1 threshold, 600ms duration)
 * - CityCard components with selection handling and loading states
 * - Load more hint when results exceed maxCities limit
 * - Conditional rendering based on search state vs all cities view
 * - Support for custom grid classes and responsive layouts
 *
 * Design Patterns Applied:
 * - Container/Presentational Pattern: Pure presentational grid with semantic list structure
 * - Composition Pattern: Composes ScrollAnimateWrapper around <ul> of CityCard components
 * - Template Method Pattern: getResultsText() handles different result display strategies
 * - Performance Pattern: Conditional rendering and optimized list structure
 * - Event Handler Pattern: Delegates city selection to parent via onCitySelect prop
 *
 * SOLID Principles:
 * - SRP: Handles cities list display, results header, loading states, and load more hints
 * - OCP: Extensible via props (gridClasses, maxCities, showSelectButton, className)
 * - LSP: Can substitute other grid implementations with same CitiesGridProps interface
 * - ISP: Focused interface accepting only grid display and city interaction props
 * - DIP: Depends on CityCard, ScrollAnimateWrapper, and RefreshCw icon abstractions
 *
 * React 19 Patterns:
 * - Props Interface Pattern: Comprehensive CitiesGridProps with optional properties
 * - Performance Pattern: Early return when !hasResults, lightweight list rendering
 * - Conditional Rendering: Results header, loading indicator, load more hint
 * - Composition Pattern: Reusable grid layout with animated city cards
 * - Accessibility Pattern: Semantic <section>, <ul>/<li>, proper ARIA labels
 *
 * Semantic HTML Structure:
 * - <section> with role="region" and aria-label="Cities grid"
 * - Results header with semantic <h3> element for content hierarchy
 * - <ul> with role="list" containing <li> elements for each city
 * - Proper heading hierarchy (h3 for results within page structure)
 */

interface CitiesGridProps {
  cities: City[]
  hasResults?: boolean
  isLoading?: boolean
  isSearchActive?: boolean
  searchQuery?: string
  filteredCount?: number
  maxCities?: number | undefined
  gridClasses?: string
  onCitySelect?: ((city: City) => void) | undefined
  showSelectButton?: boolean
  className?: string
}

export const CitiesGrid = ({
  cities,
  hasResults = false,
  isLoading = false,
  isSearchActive = false,
  searchQuery = '',
  filteredCount = 0,
  maxCities,
  gridClasses = 'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  onCitySelect,
  showSelectButton = true,
  className = '',
}: CitiesGridProps) => {
  if (!hasResults) {
    return null
  }

  const getResultsText = () => {
    if (isSearchActive) {
      return (
        <>
          Showing {cities.length} of {filteredCount} results for "{searchQuery}"
          {maxCities && filteredCount > maxCities && (
            <span className="ml-2 text-xs">(limited to first {maxCities})</span>
          )}
        </>
      )
    }

    return (
      <>
        {cities.length} destination{cities.length !== 1 ? 's' : ''} available
        {maxCities && filteredCount > maxCities && (
          <span className="ml-2 text-xs">(showing first {maxCities})</span>
        )}
      </>
    )
  }

  const shouldShowLoadMoreHint = maxCities && filteredCount > maxCities

  return (
    <section className={className} role="region" aria-label="Cities grid">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm text-muted-foreground font-normal">
          {getResultsText()}
        </h3>

        {/* Loading Indicator for Partial Updates */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Cities Grid */}
      <ScrollAnimateWrapper animation="fadeUp" threshold={0.1} duration={600}>
        <ul className={gridClasses} role="list">
          {cities.map(city => (
            <li key={city.citySlug} className="list-none">
              <CityCard
                city={city}
                onSelect={onCitySelect || undefined}
                disabled={isLoading}
                showSelectButton={showSelectButton}
              />
            </li>
          ))}
        </ul>
      </ScrollAnimateWrapper>

      {/* Load More Hint */}
      {shouldShowLoadMoreHint && (
        <div className="text-center mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {filteredCount - maxCities} more cities available. Try refining your
            search to see specific destinations.
          </p>
        </div>
      )}
    </section>
  )
}
