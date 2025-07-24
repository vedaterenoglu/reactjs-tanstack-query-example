import { Calendar } from 'lucide-react'
import { useCallback, useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { StateFrame } from '@/components/frames'
import { CitiesGrid } from '@/components/grids'
import { SearchSection } from '@/components/sections'
import { Button } from '@/components/ui/button'
import { useCitiesQuery } from '@/lib/hooks/tanstack/useCitiesQuery'
import type { City } from '@/lib/types/city.types'

/**
 * HomePage - City selection landing page
 * 
 * Displays searchable cities grid with navigation to city-specific events.
 * Includes header with "View All Events" CTA, search functionality, and responsive grid.
 * 
 * Design Patterns Applied:
 * - Container Pattern: Orchestrates data fetching and UI state management
 * - Composition Pattern: Header + SearchSection + StateFrame(CitiesGrid)
 * - Custom Hook Pattern: useCitiesQuery for TanStack Query integration
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
  const navigate = useNavigate()

  // TanStack Query integration following DIP and Facade patterns
  const citiesQuery = useCitiesQuery()
  const cities = useMemo(() => citiesQuery.data || [], [citiesQuery.data])
  const isLoading = citiesQuery.isLoading
  const error = citiesQuery.error?.message || null
  const hasData = Boolean(citiesQuery.data)

  // Local search state management following React 19 patterns
  const [searchQuery, setSearchQuery] = useState('')

  // Clear search on component mount to ensure clean initial state
  useEffect(() => {
    setSearchQuery('')
  }, [])

  // Memoized data processing following Performance Pattern with search filtering
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities
    
    const query = searchQuery.toLowerCase()
    return cities.filter(city =>
      city.city?.toLowerCase().includes(query) ||
      city.citySlug?.toLowerCase().includes(query) ||
      city.alt?.toLowerCase().includes(query)
    )
  }, [cities, searchQuery])

  const displayCities = useMemo(() => {
    if (!maxCities) return filteredCities
    return filteredCities.slice(0, maxCities)
  }, [filteredCities, maxCities])

  const hasResults = displayCities.length > 0
  const isSearchActive = Boolean(searchQuery.trim())
  const showEmptyState = !hasResults && !isLoading && hasData

  // Memoized event handlers following Performance Pattern
  const handleRefresh = useCallback(() => {
    setSearchQuery('') // Clear search text first
    void citiesQuery.refetch() // Then refresh cities data
  }, [citiesQuery])

  const handleRetry = useCallback(() => {
    void citiesQuery.refetch()
  }, [citiesQuery])

  const handleCitySelect = useCallback(
    (city: City) => {
      // Command Pattern: Execute navigation command with city slug
      // Strategy Pattern: Navigate to events with search filter using citySlug
      void navigate(`/events?search=${encodeURIComponent(city.citySlug)}`)
    },
    [navigate]
  )

  const handleGetAllEvents = useCallback(() => {
    void navigate('/events')
  }, [navigate])

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
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold mb-2">Find Local Events</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select your city and discover exciting events happening near you
            </p>

            {/* Get All Events CTA */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleGetAllEvents}
                variant="outline"
                size="lg"
                className="group transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <Calendar className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
                View All Events
                <span className="ml-2 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Search Section */}
        <SearchSection
          onRefresh={handleRefresh}
          placeholder="Search for your city..."
          debounceMs={300}
          autoFocus={false}
          showRefreshButton={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
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
                filteredCount={filteredCities.length}
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
