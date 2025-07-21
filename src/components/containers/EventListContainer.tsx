import { useCallback, useMemo, useState } from 'react'

import { StateFrame } from '@/components/frames'
import { EventGrid } from '@/components/grids'
import { EventListHeader } from '@/components/sections'
import type { City } from '@/lib/types/city.types'
import type { Event } from '@/lib/types/event.types'

/**
 * EventListContainer Component - Smart container for events page orchestration
 *
 * Current Features:
 * - Smart container managing events page state and data (Container Pattern)
 * - Supports both city-specific events and all events contexts
 * - Integrates EventListHeader + StateFrame + EventGrid components
 * - Event selection handling (navigation to single event page)
 * - Mock data implementation (ready for Redux integration)
 * - Loading, error, and empty states via StateFrame
 * - Back navigation to cities/homepage
 * - Responsive layout with semantic page structure
 *
 * Design Patterns Applied:
 * - Container/Orchestrator Pattern: Pure orchestration of EventListHeader, StateFrame, EventGrid
 * - Facade Pattern: Abstracts complex events data management behind simple interface
 * - Strategy Pattern: Different behavior based on city vs allEvents context
 * - Event Handler Pattern: Coordinates navigation, selection, and back actions
 * - State Management Pattern: Manages loading, error, and data states
 *
 * SOLID Principles:
 * - SRP: Only handles events page orchestration and state coordination
 * - OCP: Extensible via props (city, allEvents, onBack, onEventSelect)
 * - LSP: Can substitute other page container implementations
 * - ISP: Focused EventListContainerProps interface for page configuration
 * - DIP: Depends on component abstractions and future Redux hooks
 *
 * React 19 Patterns:
 * - Custom Hook Integration: Ready for useEventsWithInit hook integration
 * - Component Composition: Clean composition of header + state frame + grid
 * - Performance Optimization: useMemo for data processing, useCallback for handlers
 * - State Management: Local state for mock data, ready for Redux migration
 * - Event Coordination: Manages interactions between header, grid, and navigation
 *
 * Future Integration Points:
 * - Redux events slice integration (useEventsWithInit hook)
 * - API calls for city-specific events (/api/events?city={citySlug})
 * - API calls for all events (/api/events)
 * - Event selection navigation to single event page
 * - Search/filter functionality integration
 */

interface EventListContainerProps {
  city?: City | undefined // For city-specific events context
  allEvents?: boolean // For all events context
  onBack?: (() => void) | undefined
  onEventSelect?: ((event: Event) => void) | undefined
  className?: string
}

// Mock events data - will be replaced with Redux/API integration
const mockEvents: Event[] = [
  {
    id: 1,
    name: 'Austin Music Festival 2024',
    slug: 'austin-music-festival-2024',
    city: 'Austin',
    citySlug: 'austin',
    location: 'Austin Convention Center',
    date: '2024-08-15T19:00:00.000Z',
    organizerName: 'Austin Music Group',
    imageUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    alt: 'Austin Music Festival stage with crowd',
    description:
      'Join us for the biggest music festival in Austin featuring top artists from around the world. Experience amazing live performances, food trucks, and unforgettable memories.',
    price: 7500, // $75.00
  },
  {
    id: 2,
    name: 'Tech Conference 2024',
    slug: 'tech-conference-2024',
    city: 'Seattle',
    citySlug: 'seattle',
    location: 'Seattle Convention Center',
    date: '2024-09-20T09:00:00.000Z',
    organizerName: 'Tech Community Seattle',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    alt: 'Tech conference presentation hall',
    description:
      'Learn from industry leaders and network with fellow tech professionals. Sessions cover AI, web development, mobile apps, and the future of technology.',
    price: 12000, // $120.00
  },
  {
    id: 3,
    name: 'Food & Wine Festival',
    slug: 'food-wine-festival',
    city: 'Austin',
    citySlug: 'austin',
    location: 'Zilker Park',
    date: '2024-10-05T16:00:00.000Z',
    organizerName: 'Austin Culinary Institute',
    imageUrl:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    alt: 'Gourmet food and wine tasting event',
    description:
      'Savor the finest cuisine and wines from local and international chefs. Live cooking demonstrations, wine tastings, and culinary workshops.',
    price: 5000, // $50.00
  },
]

export const EventListContainer = ({
  city,
  allEvents = false,
  onBack,
  onEventSelect,
  className = '',
}: EventListContainerProps) => {
  // Mock state management - will be replaced with Redux hooks
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)

  // Filter events based on context
  const filteredEvents = useMemo(() => {
    if (allEvents) {
      return mockEvents // Show all events
    }
    if (city) {
      return mockEvents.filter(event => event.citySlug === city.citySlug)
    }
    return []
  }, [city, allEvents])

  // Data state calculations
  const hasData = mockEvents.length > 0
  const hasResults = filteredEvents.length > 0
  const showEmptyState = !hasResults && !isLoading && hasData

  // Event handlers
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    }
  }, [onBack])

  const handleEventSelect = useCallback(
    (event: Event) => {
      if (onEventSelect) {
        onEventSelect(event)
      }
      // TODO: Navigate to single event page using event.slug
    },
    [onEventSelect]
  )

  const handleRetry = useCallback(() => {
    // TODO: Implement retry logic for API calls
  }, [])

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Event List Header */}
      <EventListHeader city={city} allEvents={allEvents} onBack={handleBack} />

      {/* Main Content */}
      <main className="container-responsive section-spacing">
        <StateFrame
          error={error}
          onRetry={handleRetry}
          errorTitle="Unable to Load Events"
          isLoading={isLoading && !hasData}
          hasData={hasData}
          loadingTitle="Loading Events"
          loadingMessage="Fetching events for you..."
          isEmpty={showEmptyState}
          isSearchActive={false}
          searchQuery=""
          entityType="events"
        >
          {/* Events Grid - Only renders when data is available */}
          <EventGrid
            events={filteredEvents}
            hasResults={hasResults}
            isLoading={isLoading && hasData}
            isSearchActive={false}
            searchQuery=""
            filteredCount={filteredEvents.length}
            onEventSelect={handleEventSelect}
            showActionButton={true}
            cityContext={city?.city}
          />
        </StateFrame>
      </main>
    </div>
  )
}
