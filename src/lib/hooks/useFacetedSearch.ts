import { useMemo, useState, useCallback } from 'react'

import { useCitiesQuery } from '@/lib/hooks/tanstack/useCitiesQuery'
import { useEventsQuery } from '@/lib/hooks/tanstack/useEventsQuery'
import type { Event } from '@/lib/types/event.types'

/**
 * Facet Interface
 * Defines structure for search facets
 * Single Responsibility: Facet data structure
 */
interface Facet<T = string> {
  value: T
  label: string
  count: number
  selected: boolean
}

/**
 * Faceted Search State Interface
 * Comprehensive search state management
 * Interface Segregation: Focused on faceted search
 */
interface FacetedSearchState {
  textQuery: string
  selectedFacets: {
    cities: Set<string>
    priceRanges: Set<string>
    dates: Set<string>
    organizers: Set<string>
    tags: Set<string>
  }
  sortBy: 'relevance' | 'date' | 'price' | 'popularity'
  sortOrder: 'asc' | 'desc'
}

/**
 * Search Results Interface
 * Structured search results with metadata
 * Open/Closed: Extensible for new result types
 */
interface SearchResults<T> {
  items: T[]
  facets: {
    cities: Facet[]
    priceRanges: Facet[]
    dates: Facet[]
    organizers: Facet[]
    tags: Facet[]
  }
  totalCount: number
  searchTime: number
  suggestions: string[]
}

/**
 * Business Logic Hook: Faceted Search Engine
 * Implements advanced search with faceted filtering
 * Follows Single Responsibility: Search orchestration
 * Implements Observer Pattern for reactive updates
 */
export function useFacetedSearch<T extends { id: string | number }>(
  searchableFields: (keyof T)[],
  config?: {
    minSearchLength?: number
    enableFuzzySearch?: boolean
  }
) {
  const {
    minSearchLength = 2,
    enableFuzzySearch = true,
  } = config || {}

  // Search state management
  const [searchState, setSearchState] = useState<FacetedSearchState>({
    textQuery: '',
    selectedFacets: {
      cities: new Set(),
      priceRanges: new Set(),
      dates: new Set(),
      organizers: new Set(),
      tags: new Set(),
    },
    sortBy: 'relevance',
    sortOrder: 'desc',
  })

  // Search execution tracking
  const [searchMetrics, setSearchMetrics] = useState({
    lastSearchTime: 0,
    totalSearches: 0,
    averageSearchTime: 0,
  })

  // Fuzzy search implementation
  const fuzzySearch = useCallback((query: string, text: string): boolean => {
    if (!enableFuzzySearch) {
      return text.toLowerCase().includes(query.toLowerCase())
    }

    // Simple fuzzy search algorithm
    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()
    
    // Exact match
    if (textLower.includes(queryLower)) return true
    
    // Character-by-character fuzzy match
    let queryIndex = 0
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++
      }
    }
    
    return queryIndex === queryLower.length
  }, [enableFuzzySearch])

  // Search function
  const performSearch = useCallback((
    items: T[],
    state: FacetedSearchState
  ): SearchResults<T> => {
    const startTime = performance.now()
    
    // Text search
    let filtered = items
    if (state.textQuery.length >= minSearchLength) {
      filtered = items.filter(item => 
        searchableFields.some(field => {
          // eslint-disable-next-line security/detect-object-injection
          const value = item[field]
          if (typeof value === 'string') {
            return fuzzySearch(state.textQuery, value)
          }
          return false
        })
      )
    }

    // Apply facet filters
    // This would be implemented based on specific item type
    
    // Sort results
    const sorted = [...filtered].sort(() => {
      // Relevance scoring would be implemented here
      return 0
    })

    const searchTime = performance.now() - startTime
    
    // Update metrics
    setSearchMetrics(prev => ({
      lastSearchTime: searchTime,
      totalSearches: prev.totalSearches + 1,
      averageSearchTime: (prev.averageSearchTime * prev.totalSearches + searchTime) / (prev.totalSearches + 1),
    }))

    return {
      items: sorted,
      facets: {
        cities: [],
        priceRanges: [],
        dates: [],
        organizers: [],
        tags: [],
      },
      totalCount: sorted.length,
      searchTime,
      suggestions: [],
    }
  }, [searchableFields, minSearchLength, fuzzySearch])

  // Search actions
  const searchActions = useMemo(() => ({
    setQuery: (query: string) => {
      setSearchState(prev => ({ ...prev, textQuery: query }))
    },

    toggleFacet: (facetType: keyof FacetedSearchState['selectedFacets'], value: string) => {
      setSearchState(prev => {
        const newFacets = { ...prev.selectedFacets }
        // eslint-disable-next-line security/detect-object-injection
        const facetSet = new Set(newFacets[facetType])
        
        if (facetSet.has(value)) {
          facetSet.delete(value)
        } else {
          facetSet.add(value)
        }
        
        // eslint-disable-next-line security/detect-object-injection
        newFacets[facetType] = facetSet
        return { ...prev, selectedFacets: newFacets }
      })
    },

    clearFacets: (facetType?: keyof FacetedSearchState['selectedFacets']) => {
      setSearchState(prev => {
        if (facetType) {
          return {
            ...prev,
            selectedFacets: {
              ...prev.selectedFacets,
              [facetType]: new Set(),
            },
          }
        }
        
        return {
          ...prev,
          selectedFacets: {
            cities: new Set(),
            priceRanges: new Set(),
            dates: new Set(),
            organizers: new Set(),
            tags: new Set(),
          },
        }
      })
    },

    setSort: (sortBy: FacetedSearchState['sortBy'], order?: FacetedSearchState['sortOrder']) => {
      setSearchState(prev => ({
        ...prev,
        sortBy,
        sortOrder: order || prev.sortOrder,
      }))
    },

    reset: () => {
      setSearchState({
        textQuery: '',
        selectedFacets: {
          cities: new Set(),
          priceRanges: new Set(),
          dates: new Set(),
          organizers: new Set(),
          tags: new Set(),
        },
        sortBy: 'relevance',
        sortOrder: 'desc',
      })
    },
  }), [])

  return {
    // State
    searchState,
    searchMetrics,
    
    // Actions
    ...searchActions,
    
    // Search function
    search: performSearch,
    
    // Utilities
    hasActiveSearch: searchState.textQuery.length >= minSearchLength || 
      Object.values(searchState.selectedFacets).some(set => set.size > 0),
    
    getActiveFacetCount: () => 
      Object.values(searchState.selectedFacets).reduce((sum, set) => sum + set.size, 0),
  }
}

/**
 * Business Logic Hook: Event Faceted Search
 * Specialized faceted search for events
 * Follows Liskov Substitution: Specialized implementation
 */
export function useEventFacetedSearch() {
  const eventsQuery = useEventsQuery()
  const citiesQuery = useCitiesQuery()
  
  const events = useMemo(() => eventsQuery.data?.data || [], [eventsQuery.data])
  const cities = useMemo(() => citiesQuery.data || [], [citiesQuery.data])

  // Initialize faceted search
  const facetedSearch = useFacetedSearch<Event>(
    ['name', 'description', 'organizerName', 'location'],
    {
      minSearchLength: 2,
      enableFuzzySearch: true,
    }
  )

  // Calculate facets from current data
  const facets = useMemo(() => {
    // City facets
    const cityFacets = cities.map(city => {
      const count = events.filter(event => event.citySlug === city.citySlug).length
      return {
        value: city.citySlug,
        label: city.city,
        count,
        selected: facetedSearch.searchState.selectedFacets.cities.has(city.citySlug),
      }
    }).filter(facet => facet.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Price range facets
    const priceRanges = [
      { min: 0, max: 50, label: 'Under $50' },
      { min: 50, max: 100, label: '$50-$100' },
      { min: 100, max: 200, label: '$100-$200' },
      { min: 200, max: 500, label: '$200-$500' },
      { min: 500, max: Infinity, label: 'Over $500' },
    ]

    const priceFacets = priceRanges.map(range => {
      const count = events.filter(event => 
        event.price >= range.min && event.price < range.max
      ).length
      
      return {
        value: `${range.min}-${range.max}`,
        label: range.label,
        count,
        selected: facetedSearch.searchState.selectedFacets.priceRanges.has(`${range.min}-${range.max}`),
      }
    }).filter(facet => facet.count > 0)

    // Date facets
    const dateFacets = [
      { value: 'today', label: 'Today', filter: (date: Date) => isToday(date) },
      { value: 'tomorrow', label: 'Tomorrow', filter: (date: Date) => isTomorrow(date) },
      { value: 'this-week', label: 'This Week', filter: (date: Date) => isThisWeek(date) },
      { value: 'this-month', label: 'This Month', filter: (date: Date) => isThisMonth(date) },
      { value: 'next-month', label: 'Next Month', filter: (date: Date) => isNextMonth(date) },
    ].map(dateRange => {
      const count = events.filter(event => 
        dateRange.filter(new Date(event.date))
      ).length
      
      return {
        value: dateRange.value,
        label: dateRange.label,
        count,
        selected: facetedSearch.searchState.selectedFacets.dates.has(dateRange.value),
      }
    }).filter(facet => facet.count > 0)

    // Organizer facets
    const organizerCounts = events.reduce((acc, event) => {
      acc[event.organizerName] = (acc[event.organizerName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const organizerFacets = Object.entries(organizerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([organizer, count]) => ({
        value: organizer,
        label: organizer,
        count,
        selected: facetedSearch.searchState.selectedFacets.organizers.has(organizer),
      }))

    return {
      cities: cityFacets,
      priceRanges: priceFacets,
      dates: dateFacets,
      organizers: organizerFacets,
      tags: [], // Would be populated if events had tags
    }
  }, [events, cities, facetedSearch.searchState.selectedFacets])

  // Apply faceted search
  const searchResults = useMemo(() => {
    let filtered = events

    // Text search
    if (facetedSearch.searchState.textQuery.length >= 2) {
      const query = facetedSearch.searchState.textQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.organizerName.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
      )
    }

    // City filter
    if (facetedSearch.searchState.selectedFacets.cities.size > 0) {
      filtered = filtered.filter(event =>
        facetedSearch.searchState.selectedFacets.cities.has(event.citySlug)
      )
    }

    // Price range filter
    if (facetedSearch.searchState.selectedFacets.priceRanges.size > 0) {
      filtered = filtered.filter(event => {
        return Array.from(facetedSearch.searchState.selectedFacets.priceRanges).some(range => {
          const [min, max] = range.split('-').map(Number)
          const minPrice = min ?? 0
          const maxPrice = max ?? Infinity
          return event.price >= minPrice && (maxPrice === Infinity || event.price < maxPrice)
        })
      })
    }

    // Date filter
    if (facetedSearch.searchState.selectedFacets.dates.size > 0) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date)
        return Array.from(facetedSearch.searchState.selectedFacets.dates).some(dateFilter => {
          switch (dateFilter) {
            case 'today': return isToday(eventDate)
            case 'tomorrow': return isTomorrow(eventDate)
            case 'this-week': return isThisWeek(eventDate)
            case 'this-month': return isThisMonth(eventDate)
            case 'next-month': return isNextMonth(eventDate)
            default: return false
          }
        })
      })
    }

    // Organizer filter
    if (facetedSearch.searchState.selectedFacets.organizers.size > 0) {
      filtered = filtered.filter(event =>
        facetedSearch.searchState.selectedFacets.organizers.has(event.organizerName)
      )
    }

    // Sort results
    const sorted = [...filtered].sort((a, b) => {
      switch (facetedSearch.searchState.sortBy) {
        case 'date':
          return facetedSearch.searchState.sortOrder === 'asc'
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime()
        
        case 'price':
          return facetedSearch.searchState.sortOrder === 'asc'
            ? a.price - b.price
            : b.price - a.price
        
        case 'popularity':
          // Would use view count or similar metric
          return 0
        
        case 'relevance':
        default:
          // Would implement relevance scoring
          return 0
      }
    })

    return {
      events: sorted,
      totalCount: sorted.length,
      facets,
    }
  }, [events, facetedSearch.searchState, facets])

  return {
    // Search state and actions
    ...facetedSearch,
    
    // Results
    results: searchResults,
    
    // Queries
    eventsQuery,
    citiesQuery,
    
    // Loading states
    isLoading: eventsQuery.isLoading || citiesQuery.isLoading,
    
    // Error states
    error: eventsQuery.error || citiesQuery.error,
  }
}

// Date utility functions
function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  const weekEnd = new Date(now.setDate(now.getDate() + 6))
  return date >= weekStart && date <= weekEnd
}

function isThisMonth(date: Date): boolean {
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function isNextMonth(date: Date): boolean {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1)
  return date.getMonth() === nextMonth.getMonth() && date.getFullYear() === nextMonth.getFullYear()
}

/**
 * Utility Types for Faceted Search Consumers
 */
export type FacetedSearchResult<T extends { id: string | number }> = ReturnType<typeof useFacetedSearch<T>>
export type EventFacetedSearchResult = ReturnType<typeof useEventFacetedSearch>