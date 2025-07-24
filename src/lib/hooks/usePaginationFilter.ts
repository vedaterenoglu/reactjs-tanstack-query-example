import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useCitiesQuery } from '@/lib/hooks/tanstack/useCitiesQuery'
import { useInfiniteEventsQuery, useEventsQuery } from '@/lib/hooks/tanstack/useEventsQuery'
import type { EventsQueryParams } from '@/lib/types/event.types'

/**
 * Pagination State Interface
 * Defines contract for pagination state management
 * Follows Interface Segregation Principle
 */
interface PaginationState {
  page: number
  limit: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  startIndex: number
  endIndex: number
}

/**
 * Filter State Interface
 * Defines contract for filter state management
 * Single Responsibility: Filter state structure
 */
interface FilterState {
  search: string
  citySlug: string
  priceRange: { min: number; max: number }
  dateRange: { start: Date | null; end: Date | null }
  sortBy: 'date' | 'name' | 'price'
  order: 'asc' | 'desc'
}

/**
 * Pagination Configuration Interface
 * Configurable pagination behavior
 * Open/Closed Principle: Extensible configuration
 */
interface PaginationConfig {
  defaultLimit?: number
  limitOptions?: number[]
  maxLimit?: number
  syncWithUrl?: boolean
  scrollToTop?: boolean
}

/**
 * Business Logic Hook: Advanced Pagination Management
 * Implements comprehensive pagination with URL sync
 * Follows Single Responsibility: Pagination orchestration
 * Implements State Management Pattern
 */
export function usePagination<T>(
  items: T[] | undefined,
  config: PaginationConfig = {}
) {
  const {
    defaultLimit = 20,
    limitOptions = [10, 20, 50, 100],
    maxLimit = 100,
    syncWithUrl = true,
    scrollToTop = true,
  } = config

  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize pagination state from URL or defaults
  const [paginationState, setPaginationState] = useState<PaginationState>(() => {
    const urlPage = syncWithUrl ? parseInt(searchParams.get('page') || '1', 10) : 1
    const urlLimit = syncWithUrl ? parseInt(searchParams.get('limit') || String(defaultLimit), 10) : defaultLimit
    
    return {
      page: urlPage > 0 ? urlPage : 1,
      limit: Math.min(urlLimit > 0 ? urlLimit : defaultLimit, maxLimit),
      totalPages: 0,
      totalItems: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      startIndex: 0,
      endIndex: 0,
    }
  })

  // Update pagination state when items change
  useMemo(() => {
    if (items) {
      const totalItems = items.length
      const totalPages = Math.ceil(totalItems / paginationState.limit)
      const currentPage = Math.min(paginationState.page, totalPages || 1)
      const startIndex = (currentPage - 1) * paginationState.limit
      const endIndex = Math.min(startIndex + paginationState.limit, totalItems)

      setPaginationState(prev => ({
        ...prev,
        page: currentPage,
        totalPages,
        totalItems,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        startIndex,
        endIndex,
      }))
    }
  }, [items, paginationState.limit, paginationState.page])

  // Sync with URL when pagination changes
  const updatePagination = useCallback((updates: Partial<PaginationState>) => {
    setPaginationState(prev => {
      const newState = { ...prev, ...updates }
      
      if (syncWithUrl) {
        const params = new URLSearchParams(searchParams)
        params.set('page', String(newState.page))
        params.set('limit', String(newState.limit))
        setSearchParams(params, { replace: true })
      }

      if (scrollToTop && updates.page !== undefined) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }

      return newState
    })
  }, [searchParams, setSearchParams, syncWithUrl, scrollToTop])

  // Pagination actions
  const paginationActions = useMemo(() => ({
    nextPage: () => {
      if (paginationState.hasNextPage) {
        updatePagination({ page: paginationState.page + 1 })
      }
    },

    previousPage: () => {
      if (paginationState.hasPreviousPage) {
        updatePagination({ page: paginationState.page - 1 })
      }
    },

    goToPage: (page: number) => {
      const validPage = Math.max(1, Math.min(page, paginationState.totalPages))
      updatePagination({ page: validPage })
    },

    setLimit: (limit: number) => {
      const validLimit = Math.min(Math.max(1, limit), maxLimit)
      updatePagination({ limit: validLimit, page: 1 })
    },

    reset: () => {
      updatePagination({ page: 1, limit: defaultLimit })
    },
  }), [paginationState, updatePagination, defaultLimit, maxLimit])

  // Get paginated items
  const paginatedItems = useMemo(() => {
    if (!items) return []
    return items.slice(paginationState.startIndex, paginationState.endIndex)
  }, [items, paginationState.startIndex, paginationState.endIndex])

  return {
    // State
    ...paginationState,
    limitOptions,
    
    // Actions
    ...paginationActions,
    
    // Data
    items: paginatedItems,
    
    // Utilities
    getPageNumbers: (maxVisible = 5) => {
      const pages: number[] = []
      const { page, totalPages } = paginationState
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        const halfVisible = Math.floor(maxVisible / 2)
        let start = Math.max(1, page - halfVisible)
        const end = Math.min(totalPages, start + maxVisible - 1)
        
        if (end - start < maxVisible - 1) {
          start = Math.max(1, end - maxVisible + 1)
        }
        
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
      }
      
      return pages
    },
  }
}

/**
 * Business Logic Hook: Advanced Filtering Management
 * Implements comprehensive filtering with debouncing
 * Follows Single Responsibility: Filter orchestration
 * Implements Observer Pattern for filter changes
 */
export function useFilters(
  initialFilters?: Partial<FilterState>,
  config: { syncWithUrl?: boolean; debounceDelay?: number } = {}
) {
  const { syncWithUrl = true, debounceDelay = 300 } = config
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize filter state from URL or defaults
  const [filters, setFilters] = useState<FilterState>(() => {
    const defaultFilters: FilterState = {
      search: '',
      citySlug: '',
      priceRange: { min: 0, max: 10000 },
      dateRange: { start: null, end: null },
      sortBy: 'date',
      order: 'asc',
    }

    if (syncWithUrl) {
      return {
        search: searchParams.get('search') || defaultFilters.search,
        citySlug: searchParams.get('city') || defaultFilters.citySlug,
        priceRange: {
          min: parseInt(searchParams.get('minPrice') || '0', 10),
          max: parseInt(searchParams.get('maxPrice') || '10000', 10),
        },
        dateRange: {
          start: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : null,
          end: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : null,
        },
        sortBy: (searchParams.get('sortBy') as FilterState['sortBy']) || defaultFilters.sortBy,
        order: (searchParams.get('order') as FilterState['order']) || defaultFilters.order,
      }
    }

    return { ...defaultFilters, ...initialFilters }
  })

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  // Debounce search updates
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, debounceDelay)

    return () => clearTimeout(timer)
  }, [filters.search, debounceDelay])

  // Sync filters with URL
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates }
      
      if (syncWithUrl) {
        const params = new URLSearchParams(searchParams)
        
        // Update URL params
        if (newFilters.search) params.set('search', newFilters.search)
        else params.delete('search')
        
        if (newFilters.citySlug) params.set('city', newFilters.citySlug)
        else params.delete('city')
        
        if (newFilters.priceRange.min > 0) params.set('minPrice', String(newFilters.priceRange.min))
        else params.delete('minPrice')
        
        if (newFilters.priceRange.max < 10000) params.set('maxPrice', String(newFilters.priceRange.max))
        else params.delete('maxPrice')
        
        if (newFilters.dateRange.start) params.set('startDate', newFilters.dateRange.start.toISOString())
        else params.delete('startDate')
        
        if (newFilters.dateRange.end) params.set('endDate', newFilters.dateRange.end.toISOString())
        else params.delete('endDate')
        
        params.set('sortBy', newFilters.sortBy)
        params.set('order', newFilters.order)
        
        setSearchParams(params, { replace: true })
      }
      
      return newFilters
    })
  }, [searchParams, setSearchParams, syncWithUrl])

  // Filter actions
  const filterActions = useMemo(() => ({
    setSearch: (search: string) => updateFilters({ search }),
    setCity: (citySlug: string) => updateFilters({ citySlug }),
    setPriceRange: (min: number, max: number) => updateFilters({ priceRange: { min, max } }),
    setDateRange: (start: Date | null, end: Date | null) => updateFilters({ dateRange: { start, end } }),
    setSort: (sortBy: FilterState['sortBy'], order?: FilterState['order']) => 
      updateFilters({ sortBy, order: order || filters.order }),
    toggleOrder: () => updateFilters({ order: filters.order === 'asc' ? 'desc' : 'asc' }),
    reset: () => updateFilters({
      search: '',
      citySlug: '',
      priceRange: { min: 0, max: 10000 },
      dateRange: { start: null, end: null },
      sortBy: 'date',
      order: 'asc',
    }),
    clearSearch: () => updateFilters({ search: '' }),
    clearCity: () => updateFilters({ citySlug: '' }),
    clearPriceRange: () => updateFilters({ priceRange: { min: 0, max: 10000 } }),
    clearDateRange: () => updateFilters({ dateRange: { start: null, end: null } }),
  }), [updateFilters, filters.order])

  // Filter utilities
  const filterUtilities = useMemo(() => ({
    hasActiveFilters: Boolean(
      filters.search ||
      filters.citySlug ||
      filters.priceRange.min > 0 ||
      filters.priceRange.max < 10000 ||
      filters.dateRange.start ||
      filters.dateRange.end
    ),
    
    getActiveFilterCount: () => {
      let count = 0
      if (filters.search) count++
      if (filters.citySlug) count++
      if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) count++
      if (filters.dateRange.start || filters.dateRange.end) count++
      return count
    },

    toQueryParams: (): EventsQueryParams => ({
      search: debouncedSearch || undefined,
      sortBy: filters.sortBy,
      order: filters.order,
    }),
  }), [filters, debouncedSearch])

  return {
    // State
    ...filters,
    debouncedSearch,
    
    // Actions
    ...filterActions,
    
    // Utilities
    ...filterUtilities,
  }
}

/**
 * Business Logic Hook: Events Pagination with Filtering
 * Combines pagination and filtering for events
 * Follows Dependency Inversion: Depends on abstractions
 * Implements Facade Pattern for complex operations
 */
export function useEventsPagination(config?: {
  defaultLimit?: number
  enableInfiniteScroll?: boolean
}) {
  const { defaultLimit = 20, enableInfiniteScroll = false } = config || {}
  
  // Filter management
  const filters = useFilters()
  
  // City data for filter options
  const citiesQuery = useCitiesQuery()
  
  // Build query parameters
  const queryParams = useMemo((): EventsQueryParams => ({
    ...filters.toQueryParams(),
    limit: defaultLimit,
    offset: 0,
  }), [filters, defaultLimit])

  // Always call both hooks but use only one
  const infiniteQuery = useInfiniteEventsQuery(queryParams, defaultLimit)
  const paginatedQuery = useEventsQuery(queryParams)
  
  // Choose which query to use
  const eventsQuery = enableInfiniteScroll ? infiniteQuery : paginatedQuery

  // Flatten infinite query data
  const allEvents = useMemo(() => {
    if (enableInfiniteScroll && 'pages' in eventsQuery.data!) {
      return eventsQuery.data.pages.flatMap(page => page.data)
    }
    return eventsQuery.data?.data || []
  }, [eventsQuery.data, enableInfiniteScroll])

  // Apply client-side filtering
  const filteredEvents = useMemo(() => {
    let events = allEvents

    // City filter (if not already filtered by API)
    if (filters.citySlug && !queryParams.search) {
      events = events.filter(event => event.citySlug === filters.citySlug)
    }

    // Price range filter
    if (filters.priceRange.min > 0 || filters.priceRange.max < 10000) {
      events = events.filter(event => 
        event.price >= filters.priceRange.min && 
        event.price <= filters.priceRange.max
      )
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      events = events.filter(event => {
        const eventDate = new Date(event.date)
        if (filters.dateRange.start && eventDate < filters.dateRange.start) return false
        if (filters.dateRange.end && eventDate > filters.dateRange.end) return false
        return true
      })
    }

    // Client-side sorting (if needed)
    if (filters.sortBy) {
      events = [...events].sort((a, b) => {
        let comparison = 0
        
        switch (filters.sortBy) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
            break
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'price':
            comparison = a.price - b.price
            break
        }
        
        return filters.order === 'asc' ? comparison : -comparison
      })
    }

    return events
  }, [allEvents, filters, queryParams])

  // Pagination management (for non-infinite scroll)
  const pagination = usePagination(filteredEvents, {
    defaultLimit,
    syncWithUrl: !enableInfiniteScroll,
  })

  // Filter options from cities
  const filterOptions = useMemo(() => ({
    cities: citiesQuery.data?.map(city => ({
      value: city.citySlug,
      label: city.city,
    })) || [],
    
    priceRanges: [
      { value: { min: 0, max: 50 }, label: 'Under $50' },
      { value: { min: 50, max: 100 }, label: '$50 - $100' },
      { value: { min: 100, max: 200 }, label: '$100 - $200' },
      { value: { min: 200, max: 10000 }, label: 'Over $200' },
    ],
    
    sortOptions: [
      { value: 'date', label: 'Date' },
      { value: 'name', label: 'Name' },
      { value: 'price', label: 'Price' },
    ],
  }), [citiesQuery.data])

  return {
    // Data
    events: enableInfiniteScroll ? filteredEvents : pagination.items,
    totalEvents: filteredEvents.length,
    
    // Queries
    eventsQuery,
    citiesQuery,
    
    // Pagination (if not infinite scroll)
    ...(enableInfiniteScroll ? {} : {
      pagination: {
        ...pagination,
        totalItems: filteredEvents.length,
      },
    }),
    
    // Infinite scroll helpers
    ...(enableInfiniteScroll ? {
      hasNextPage: eventsQuery.hasNextPage,
      isFetchingNextPage: eventsQuery.isFetchingNextPage,
      fetchNextPage: eventsQuery.fetchNextPage,
    } : {}),
    
    // Filters
    filters,
    filterOptions,
    
    // Loading states
    isLoading: eventsQuery.isLoading || citiesQuery.isLoading,
    isFiltering: eventsQuery.isFetching && !eventsQuery.isLoading,
    
    // Error states
    error: eventsQuery.error || citiesQuery.error,
  }
}

/**
 * Business Logic Hook: Generic Pagination Provider
 * Creates reusable pagination for any data type
 * Implements Factory Pattern for pagination creation
 * Follows Open/Closed Principle: Extensible for new data types
 */
export function createPaginationHook<T>(config: {
  queryFn: (params: EventsQueryParams) => Promise<{ data: T[]; total?: number }>
  queryKey: (params: EventsQueryParams) => readonly unknown[]
  defaultFilters?: Partial<FilterState>
  transformData?: (data: T[]) => T[]
}) {
  return function usePaginatedData(customConfig?: PaginationConfig) {
    const filters = useFilters(config.defaultFilters)
    const queryParams = filters.toQueryParams()
    
    // Execute query with filters
    const query = useEventsQuery(queryParams) // This would be generic in production
    
    // Transform data if needed
    const transformedData = useMemo(() => {
      const data = query.data?.data || []
      return config.transformData ? config.transformData(data) : data
    }, [query.data])
    
    // Apply pagination
    const pagination = usePagination(transformedData, customConfig)
    
    return {
      data: pagination.items,
      pagination,
      filters,
      query,
      isLoading: query.isLoading,
      error: query.error,
    }
  }
}

/**
 * Business Logic Hook: Table Pagination
 * Specialized pagination for table components
 * Single Responsibility: Table-specific pagination logic
 */
export function useTablePagination<T extends { id: number | string }>(
  data: T[] | undefined,
  config?: {
    defaultPageSize?: number
    pageSizeOptions?: number[]
    selectable?: boolean
  }
) {
  const {
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    selectable = false,
  } = config || {}

  // Pagination state
  const pagination = usePagination(data, {
    defaultLimit: defaultPageSize,
    limitOptions: pageSizeOptions,
  })

  // Selection state (if enabled)
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set())

  // Selection actions
  const selectionActions = useMemo(() => ({
    selectItem: (id: number | string) => {
      setSelectedIds(prev => new Set(prev).add(id))
    },
    
    deselectItem: (id: number | string) => {
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    },
    
    toggleItem: (id: number | string) => {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    
    selectAll: () => {
      const allIds = pagination.items.map(item => item.id)
      setSelectedIds(new Set(allIds))
    },
    
    deselectAll: () => {
      setSelectedIds(new Set())
    },
    
    toggleAll: () => {
      const pageIds = pagination.items.map(item => item.id)
      const allSelected = pageIds.every(id => selectedIds.has(id))
      
      if (allSelected) {
        setSelectedIds(prev => {
          const next = new Set(prev)
          pageIds.forEach(id => next.delete(id))
          return next
        })
      } else {
        setSelectedIds(prev => {
          const next = new Set(prev)
          pageIds.forEach(id => next.add(id))
          return next
        })
      }
    },
  }), [pagination.items, selectedIds])

  // Selection utilities
  const selectionUtilities = useMemo(() => ({
    isSelected: (id: number | string) => selectedIds.has(id),
    isAllSelected: () => {
      const pageIds = pagination.items.map(item => item.id)
      return pageIds.length > 0 && pageIds.every(id => selectedIds.has(id))
    },
    isPartiallySelected: () => {
      const pageIds = pagination.items.map(item => item.id)
      const selectedCount = pageIds.filter(id => selectedIds.has(id)).length
      return selectedCount > 0 && selectedCount < pageIds.length
    },
    selectedCount: selectedIds.size,
    selectedItems: data?.filter(item => selectedIds.has(item.id)) || [],
  }), [pagination.items, selectedIds, data])

  return {
    // Pagination
    ...pagination,
    pageSize: pagination.limit,
    setPageSize: pagination.setLimit,
    
    // Selection (if enabled)
    ...(selectable ? {
      selection: {
        ...selectionActions,
        ...selectionUtilities,
      },
    } : {}),
    
    // Table-specific utilities
    getRowKey: (item: T) => item.id,
    getRowIndex: (item: T) => {
      const index = pagination.items.findIndex(i => i.id === item.id)
      return index >= 0 ? pagination.startIndex + index : -1
    },
  }
}

/**
 * Utility Types for Pagination Hook Consumers
 */
export type PaginationResult<T> = ReturnType<typeof usePagination<T>>
export type FilterResult = ReturnType<typeof useFilters>
export type EventsPaginationResult = ReturnType<typeof useEventsPagination>
export type TablePaginationResult<T> = ReturnType<typeof useTablePagination<T>>