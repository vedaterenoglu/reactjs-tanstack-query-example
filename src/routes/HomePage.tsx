import { RefreshCw, MapPin, AlertCircle } from 'lucide-react'
import { useCallback, useMemo, useEffect } from 'react'

import { CityCard } from '@/components/cards'
import { SearchBox } from '@/components/search'
import { Button } from '@/components/ui/button'
import { useCitiesWithInit, useCitySelection, useCitySearch } from '@/lib/hooks'

/**
 * HomePage Container Component - Main application page with authentication
 *
 * Design Patterns Applied:
 * - Container/Presentational Pattern: Smart container managing auth and city state
 * - Conditional Rendering Pattern: Different content based on authentication state
 * - Progressive Enhancement Pattern: Public content + authenticated features
 * - Compound Component Pattern: Orchestrates SearchBox + CityCard + Auth components
 * - Provider Pattern: Consumes both Clerk auth and Redux state through hooks
 * - Facade Pattern: Uses useCitiesWithInit to abstract complex state management
 *
 * SOLID Principles:
 * - SRP: Handles page orchestration for both auth flow and ticket booking
 * - OCP: Extensible through props and authentication-based feature flags
 * - LSP: Can be substituted with other page components in routing system
 * - ISP: Focused interface accepting page-level configuration props
 * - DIP: Depends on Clerk hooks and custom Redux hooks abstractions
 *
 * React 19 Patterns:
 * - Custom Hook Integration: Leverages useCitiesWithInit + Clerk useUser
 * - Component Composition: Builds complex UI from focused components
 * - Performance Optimization: Memoized computations and callbacks
 * - Error Boundary Ready: Structured for graceful error handling
 */

interface HomePageProps {
  maxCities?: number
  gridColumns?: 'auto' | 2 | 3 | 4 | 6
  className?: string
}

export const HomePage = ({
  maxCities,
  gridColumns = 'auto',
  className = '',
}: HomePageProps) => {

  // Custom hook integration following DIP and Facade patterns
  const {
    filteredCities,
    searchQuery,
    isLoading,
    error,
    hasData,
    refreshCities,
    retryOperation,
    filteredCitiesCount,
  } = useCitiesWithInit()

  const { selectedCity } = useCitySelection()
  const { clearSearch } = useCitySearch()

  // Clear search on component mount to ensure clean initial state
  useEffect(() => {
    clearSearch()
  }, [clearSearch])

  // Memoized data processing following Performance Pattern
  const displayCities = useMemo(() => {
    if (!maxCities) return filteredCities
    return filteredCities.slice(0, maxCities)
  }, [filteredCities, maxCities])

  const hasResults = displayCities.length > 0
  const isSearchActive = Boolean(searchQuery?.trim())
  const showEmptyState = !hasResults && !isLoading && hasData

  // Memoized event handlers following Performance Pattern
  const handleRefresh = useCallback(() => {
    clearSearch() // Clear search text first
    refreshCities() // Then refresh cities data
  }, [clearSearch, refreshCities])

  const handleRetry = useCallback(() => {
    retryOperation()
  }, [retryOperation])

  const handleCitySelect = useCallback(
    (/* city: City */) => {
      // TODO: Navigate to booking page or show booking modal
    },
    []
  )

  // Dynamic grid classes based on gridColumns prop
  const gridClasses = useMemo(() => {
    const baseClasses = 'grid gap-6'

    if (gridColumns === 'auto') {
      return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
    }

    // Safe object access pattern to prevent security warning
    switch (gridColumns) {
      case 2:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2`
      case 3:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
      case 4:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
      case 6:
        return `${baseClasses} grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6`
      default:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
    }
  }, [gridColumns])

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Main Container with Mobile-First Constraints */}
      <div className="container-responsive section-spacing">


        {/* Selection Status */}
        {selectedCity && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <MapPin className="h-4 w-4" />
              <span>Selected: {selectedCity.city}</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 ml-2 text-primary"
              >
                Book Now →
              </Button>
            </div>
          </div>
        )}

        {/* Search Section */}
        <section className="mb-8">
          <div className="max-w-2xl mx-auto">
            <SearchBox
              placeholder="Search destinations..."
              onRefresh={handleRefresh}
              debounceMs={300}
              autoFocus={false}
              showRefreshButton={true}
            />
          </div>
        </section>

        {/* Content Section */}
        <main>
          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Unable to Load Cities
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {error}
              </p>
              <Button onClick={handleRetry} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !hasData && (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Loading Destinations
              </h2>
              <p className="text-muted-foreground">
                Fetching available cities for you...
              </p>
            </div>
          )}

          {/* Empty State */}
          {showEmptyState && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {isSearchActive ? 'No Cities Found' : 'No Cities Available'}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isSearchActive
                  ? `No destinations match "${searchQuery}". Try a different search term.`
                  : 'There are currently no cities available for booking.'}
              </p>
              {!isSearchActive && (
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Cities
                </Button>
              )}
            </div>
          )}

          {/* Cities Grid */}
          {hasResults && (
            <section>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-muted-foreground">
                  {isSearchActive ? (
                    <>
                      Showing {displayCities.length} of {filteredCitiesCount}{' '}
                      results for "{searchQuery}"
                      {maxCities && filteredCitiesCount > maxCities && (
                        <span className="ml-2 text-xs">
                          (limited to first {maxCities})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {displayCities.length} destination
                      {displayCities.length !== 1 ? 's' : ''} available
                      {maxCities && filteredCitiesCount > maxCities && (
                        <span className="ml-2 text-xs">
                          (showing first {maxCities})
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Loading Indicator for Partial Updates */}
                {isLoading && hasData && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Updating...</span>
                  </div>
                )}
              </div>

              {/* Cities Grid */}
              <div className={gridClasses}>
                {displayCities.map(city => (
                  <CityCard
                    key={city.citySlug}
                    city={city}
                    onSelect={handleCitySelect}
                    disabled={isLoading}
                    showSelectButton={true} // Show select button for all users
                  />
                ))}
              </div>


              {/* Load More Hint */}
              {maxCities && filteredCitiesCount > maxCities && (
                <div className="text-center mt-8 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {filteredCitiesCount - maxCities} more cities available. Try
                    refining your search to see specific destinations.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>

      </div>
    </div>
  )
}
