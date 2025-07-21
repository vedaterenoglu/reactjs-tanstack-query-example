import { useCallback, useMemo, useEffect } from 'react'

import { StateFrame } from '@/components/frames'
import { CitiesGrid } from '@/components/grids'
import { SearchSection } from '@/components/sections'
import { useCitiesWithInit, useCitySearch } from '@/lib/hooks'

/**
 * HomePage Container Component - Semantic homepage with local events discovery functionality
 *
 * Current Features:
 * - Page header with title and description for local events discovery
 * - Integrated city search functionality with real-time filtering and refresh
 * - Unified state management (loading, error, empty states) via StateFrame
 * - Responsive cities grid with scroll animations and selection
 * - Search clearing on component mount for clean initial state
 * - City selection handling (placeholder for future events navigation)
 *
 * Design Patterns Applied:
 * - Container/Orchestrator Pattern: Pure orchestration of StateFrame, SearchSection, CitiesGrid
 * - Component Composition Pattern: Semantic header + search section + main content with StateFrame
 * - Facade Pattern: Uses useCitiesWithInit to abstract Redux state + API calls + filtering
 * - Strategy Pattern: StateFrame handles different UI states, delegates to specialized components
 * - Event Handler Pattern: Coordinates search refresh, retry, city selection actions
 *
 * SOLID Principles:
 * - SRP: Page-level orchestration, semantic structure, and state coordination only
 * - OCP: Extensible via props (maxCities, gridColumns, className)
 * - LSP: Can substitute other page containers in routing system
 * - ISP: Focused interface with optional maxCities, gridColumns, className props
 * - DIP: Depends on useCitiesWithInit/useCitySearch hooks and child component abstractions
 *
 * React 19 Patterns:
 * - Custom Hook Integration: useCitiesWithInit (cities+search+state), useCitySearch (search actions)
 * - Component Composition: Header → SearchSection → StateFrame(CitiesGrid)
 * - Performance Optimization: useMemo for displayCities/gridClasses, useCallback for handlers
 * - Clean Architecture: Zero business logic, pure coordination of child components
 * - Lifecycle Management: useEffect for search clearing on mount
 *
 * Semantic HTML Structure:
 * - <header> with <h1> page title + description paragraph
 * - SearchSection with <section> and hidden <h2> for accessibility
 * - <main> content area with labeled <section> containing StateFrame
 * - Proper heading hierarchy: h1 (page) → h2 (search/destinations) → h3 (results)
 * - ARIA labels and landmarks for screen reader navigation
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

        {/* Page Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-2">
            Find Local Events
          </h1>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Select your city and discover exciting events happening near you
          </p>
        </header>

        {/* Search Section */}
        <SearchSection
          onRefresh={handleRefresh}
          placeholder="Search for your city..."
          debounceMs={300}
          autoFocus={false}
          showRefreshButton={true}
        />

        {/* Main Content Section */}
        <main>
          <section aria-labelledby="cities-heading">
            <h2 id="cities-heading" className="sr-only">
              Available Cities with Events
            </h2>
            <StateFrame
              error={error}
              onRetry={handleRetry}
              errorTitle="Unable to Load Cities"
              isLoading={isLoading && !hasData}
              hasData={hasData}
              loadingTitle="Loading Destinations"
              loadingMessage="Fetching available cities for you..."
              isEmpty={showEmptyState}
              isSearchActive={isSearchActive}
              searchQuery={searchQuery}
              onRefresh={handleRefresh}
            >
              {/* Cities Grid - Only renders when data is available */}
              <CitiesGrid
                cities={displayCities}
                hasResults={hasResults}
                isLoading={isLoading && hasData}
                isSearchActive={isSearchActive}
                searchQuery={searchQuery}
                filteredCount={filteredCitiesCount}
                maxCities={maxCities}
                gridClasses={gridClasses}
                onCitySelect={handleCitySelect}
                showSelectButton={true}
              />
            </StateFrame>
          </section>
        </main>

      </div>
    </div>
  )
}
