import { useMemo } from 'react'

import {
  useCitiesQuery,
  useCityQuery,
} from '@/lib/hooks/tanstack/useCitiesQuery'
import { useEventMutations } from '@/lib/hooks/tanstack/useEventsMutations'
import {
  useEventsQuery,
  useEventsByCity,
} from '@/lib/hooks/tanstack/useEventsQuery'
import type { Event } from '@/lib/types/event.types'

/**
 * Business Logic Hook: Portfolio Data Management
 * Combines cities and events data with business rules
 * Follows Single Responsibility Principle: Portfolio data orchestration
 * Implements Dependency Inversion: Abstracts query implementation details
 */
export function usePortfolioData() {
  const citiesQuery = useCitiesQuery()
  const eventsQuery = useEventsQuery()
  const eventMutations = useEventMutations()

  // Business logic: Compute portfolio statistics
  const portfolioStats = useMemo(() => {
    const cities = citiesQuery.data || []
    const events = eventsQuery.data?.data || []

    // Calculate coverage statistics
    const citiesWithEvents = new Set(events.map(event => event.citySlug))
    const coveragePercentage = cities.length > 0 
      ? Math.round((citiesWithEvents.size / cities.length) * 100)
      : 0

    // Calculate event distribution
    const eventsByCity = events.reduce((acc, event) => {
      acc[event.citySlug] = (acc[event.citySlug] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Find most active cities
    const mostActiveCities = Object.entries(eventsByCity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([citySlug, eventCount]) => ({
        citySlug,
        eventCount,
        city: cities.find(c => c.citySlug === citySlug),
      }))

    return {
      totalCities: cities.length,
      totalEvents: events.length,
      citiesWithEvents: citiesWithEvents.size,
      coveragePercentage,
      eventsByCity,
      mostActiveCities,
      averageEventsPerCity: citiesWithEvents.size > 0 
        ? Math.round(events.length / citiesWithEvents.size)
        : 0,
    }
  }, [citiesQuery.data, eventsQuery.data])

  // Business logic: Data validation
  const dataIntegrity = useMemo(() => {
    const cities = citiesQuery.data || []
    const events = eventsQuery.data?.data || []
    const citySlugSet = new Set(cities.map(c => c.citySlug))

    // Find orphaned events (events without valid cities)
    const orphanedEvents = events.filter(event => !citySlugSet.has(event.citySlug))
    
    // Find missing event data
    const eventsWithMissingData = events.filter(event => 
      !event.name || !event.description || !event.date
    )

    return {
      isValid: orphanedEvents.length === 0 && eventsWithMissingData.length === 0,
      orphanedEvents,
      eventsWithMissingData,
      totalIssues: orphanedEvents.length + eventsWithMissingData.length,
    }
  }, [citiesQuery.data, eventsQuery.data])

  return {
    // Raw query results
    cities: citiesQuery,
    events: eventsQuery,
    mutations: eventMutations,

    // Business logic results
    stats: portfolioStats,
    integrity: dataIntegrity,

    // Combined loading states
    isLoading: citiesQuery.isLoading || eventsQuery.isLoading,
    isRefetching: citiesQuery.isRefetching || eventsQuery.isRefetching,

    // Combined error states
    hasError: Boolean(citiesQuery.error || eventsQuery.error),
    errors: {
      cities: citiesQuery.error,
      events: eventsQuery.error,
      mutations: eventMutations.error,
    },

    // Data availability
    hasData: Boolean(citiesQuery.data?.length || eventsQuery.data?.data?.length),
    isEmpty: citiesQuery.data?.length === 0 && eventsQuery.data?.data?.length === 0,
  }
}

/**
 * Business Logic Hook: City-Specific Event Management
 * Manages events for a specific city with business rules
 * Follows Open/Closed Principle: Extensible for different city behaviors
 */
export function useCityEventManagement(citySlug: string) {
  const cityQuery = useCityQuery(citySlug, Boolean(citySlug))
  const cityEventsQuery = useEventsByCity(citySlug, Boolean(citySlug))
  const eventMutations = useEventMutations()

  // Business logic: City event statistics
  const cityStats = useMemo(() => {
    const events = cityEventsQuery.data?.data || []
    
    if (events.length === 0) {
      return {
        eventCount: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        organizerCount: 0,
      }
    }

    const now = new Date()
    const upcomingEvents = events.filter(event => new Date(event.date) > now)
    const pastEvents = events.filter(event => new Date(event.date) <= now)
    
    const prices = events.map(event => event.price).filter(price => price > 0)
    const organizers = new Set(events.map(event => event.organizerName))

    return {
      eventCount: events.length,
      upcomingEvents: upcomingEvents.length,
      pastEvents: pastEvents.length,
      averagePrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      },
      organizerCount: organizers.size,
    }
  }, [cityEventsQuery.data])

  // Business logic: Event management operations
  const eventOperations = useMemo(() => ({
    createEventForCity: (eventData: Omit<Event, 'id' | 'slug' | 'citySlug' | 'createdAt' | 'updatedAt'>) => {
      if (!citySlug) {
        throw new Error('City slug is required to create event')
      }
      
      const createData = {
        ...eventData,
        citySlug,
        slug: eventData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }
      
      return eventMutations.createEvent(createData)
    },

    updateCityEvent: (eventSlug: string, updates: Partial<Event>) => {
      return eventMutations.updateEvent(eventSlug, updates)
    },

    deleteCityEvent: (eventSlug: string) => {
      return eventMutations.deleteEvent(eventSlug)
    },
  }), [citySlug, eventMutations])

  return {
    // Query results
    city: cityQuery,
    events: cityEventsQuery,
    mutations: eventMutations,

    // Business logic
    stats: cityStats,
    operations: eventOperations,

    // Combined states
    isLoading: cityQuery.isLoading || cityEventsQuery.isLoading,
    hasError: Boolean(cityQuery.error || cityEventsQuery.error),
    
    // Data validation
    isValidCity: Boolean(cityQuery.data),
    hasEvents: Boolean(cityEventsQuery.data?.data?.length),
    
    // Helper methods
    getUpcomingEvents: () => {
      const events = cityEventsQuery.data?.data || []
      const now = new Date()
      return events
        .filter(event => new Date(event.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },

    getPastEvents: () => {
      const events = cityEventsQuery.data?.data || []
      const now = new Date()
      return events
        .filter(event => new Date(event.date) <= now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    },
  }
}

/**
 * Business Logic Hook: Event Discovery and Search
 * Implements advanced search and discovery patterns
 * Follows Interface Segregation: Focused on search functionality
 */
export function useEventDiscovery() {
  const citiesQuery = useCitiesQuery()
  const eventsQuery = useEventsQuery()

  // Business logic: Search and filter functionality
  const searchOperations = useMemo(() => ({
    searchEvents: (query: string, filters?: {
      citySlug?: string
      priceRange?: { min: number; max: number }
      dateRange?: { start: Date; end: Date }
      organizer?: string
    }) => {
      const events = eventsQuery.data?.data || []
      
      let filteredEvents = events

      // Text search
      if (query.trim()) {
        const searchTerm = query.toLowerCase()
        filteredEvents = filteredEvents.filter(event =>
          event.name.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.organizerName.toLowerCase().includes(searchTerm) ||
          event.location.toLowerCase().includes(searchTerm)
        )
      }

      // City filter
      if (filters?.citySlug) {
        filteredEvents = filteredEvents.filter(event => event.citySlug === filters.citySlug)
      }

      // Price range filter
      if (filters?.priceRange) {
        filteredEvents = filteredEvents.filter(event =>
          event.price >= filters.priceRange!.min && event.price <= filters.priceRange!.max
        )
      }

      // Date range filter
      if (filters?.dateRange) {
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date)
          return eventDate >= filters.dateRange!.start && eventDate <= filters.dateRange!.end
        })
      }

      // Organizer filter
      if (filters?.organizer) {
        filteredEvents = filteredEvents.filter(event =>
          event.organizerName.toLowerCase().includes(filters.organizer!.toLowerCase())
        )
      }

      return filteredEvents
    },

    getEventRecommendations: (baseEvent?: Event, limit = 5) => {
      const events = eventsQuery.data?.data || []
      
      if (!baseEvent) {
        // Return popular events (by price or recent date)
        return events
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit)
      }

      // Find similar events based on city, organizer, or price range
      const similarEvents = events
        .filter(event => event.slug !== baseEvent.slug)
        .map(event => {
          let similarity = 0
          
          // Same city bonus
          if (event.citySlug === baseEvent.citySlug) similarity += 3
          
          // Same organizer bonus
          if (event.organizerName === baseEvent.organizerName) similarity += 2
          
          // Similar price range bonus
          const priceDiff = Math.abs(event.price - baseEvent.price)
          if (priceDiff < baseEvent.price * 0.3) similarity += 1
          
          return { event, similarity }
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(item => item.event)

      return similarEvents
    },

    getFeaturedCities: (limit = 6) => {
      const cities = citiesQuery.data || []
      const events = eventsQuery.data?.data || []
      
      // Calculate event count per city
      const cityEventCounts = events.reduce((acc, event) => {
        acc[event.citySlug] = (acc[event.citySlug] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Sort cities by event count and return top cities
      return cities
        .map(city => ({
          ...city,
          eventCount: cityEventCounts[city.citySlug] || 0,
        }))
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, limit)
    },
  }), [citiesQuery.data, eventsQuery.data])

  return {
    // Query results
    cities: citiesQuery,
    events: eventsQuery,

    // Search operations
    ...searchOperations,

    // Loading states
    isLoading: citiesQuery.isLoading || eventsQuery.isLoading,
    
    // Data availability
    hasData: Boolean(citiesQuery.data?.length || eventsQuery.data?.data?.length),
  }
}

/**
 * Business Logic Hook: Data Synchronization
 * Manages cache invalidation and data synchronization
 * Follows Single Responsibility: Data synchronization logic
 */
export function useDataSynchronization() {
  const { cities, events, mutations } = usePortfolioData()

  const syncOperations = useMemo(() => ({
    refreshAllData: async () => {
      await Promise.all([
        cities.refetch(),
        events.refetch(),
      ])
    },

    syncCityEvents: async (citySlug: string) => {
      // This would typically invalidate specific city events for this citySlug
      console.warn('Syncing events for city:', citySlug)
      await events.refetch()
    },

    handleDataMutation: async (type: 'create' | 'update' | 'delete') => {
      // Custom logic after mutations
      switch (type) {
        case 'create':
        case 'update':
          // Refresh events data after modifications
          await events.refetch()
          break
        case 'delete':
          // More aggressive refresh for deletions
          await Promise.all([events.refetch(), cities.refetch()])
          break
      }
    },
  }), [cities, events])

  return {
    // Sync operations
    ...syncOperations,

    // Sync status
    isSyncing: cities.isRefetching || events.isRefetching || mutations.isLoading,
    lastSyncError: cities.error || events.error || mutations.error,
  }
}

/**
 * Utility Types for Hook Consumers
 * Provides type safety for business logic hooks
 */
export type PortfolioDataResult = ReturnType<typeof usePortfolioData>
export type CityEventManagementResult = ReturnType<typeof useCityEventManagement>
export type EventDiscoveryResult = ReturnType<typeof useEventDiscovery>
export type DataSynchronizationResult = ReturnType<typeof useDataSynchronization>

/**
 * Hook Factory: Creates specialized portfolio hooks
 * Implements Factory Pattern for hook creation
 * Follows Dependency Inversion: Configurable behavior
 */
export const createPortfolioHook = (config: {
  autoRefresh?: boolean
  refreshInterval?: number
  enableStats?: boolean
}) => {
  return function useConfiguredPortfolio() {
    const portfolioData = usePortfolioData()
    const sync = useDataSynchronization()

    // Auto-refresh logic if enabled (simplified for this example)
    // In production, this would use useEffect with setInterval for config.autoRefresh && config.refreshInterval

    return {
      ...portfolioData,
      sync,
      config,
      // Stats only if enabled
      ...(config.enableStats && { 
        detailedStats: {
          ...portfolioData.stats,
          dataFreshness: {
            citiesLastFetch: portfolioData.cities.dataUpdatedAt,
            eventsLastFetch: portfolioData.events.dataUpdatedAt,
          }
        }
      }),
    }
  }
}