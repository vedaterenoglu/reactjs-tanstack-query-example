/**
 * useInfiniteScroll - Custom hook for infinite scrolling with TanStack Query integration
 * 
 * Provides robust infinite scrolling functionality with configurable behavior,
 * error handling, retry mechanisms, and performance optimization. Integrates
 * seamlessly with TanStack Query's useInfiniteQuery for data fetching.
 * 
 * Design Patterns Applied:
 * - Custom Hook Pattern: Encapsulates infinite scroll logic for reuse
 * - Observer Pattern: Uses Intersection Observer for scroll detection
 * - Configuration Pattern: Configurable behavior through options
 * - Error Recovery Pattern: Automatic retry with exponential backoff
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'

/**
 * Infinite Scroll Configuration
 * Configurable behavior for infinite scrolling
 * Open/Closed Principle: Extensible configuration
 */
interface InfiniteScrollConfig {
  threshold?: number // Distance from bottom to trigger load (in pixels)
  rootMargin?: string // Intersection observer root margin
  loadMoreDelay?: number // Delay before loading more (debounce)
  retryDelay?: number // Delay before retrying failed loads
  maxRetries?: number // Maximum retry attempts
  enabled?: boolean // Enable/disable infinite scroll
}

/**
 * Infinite Scroll State
 * Tracks the state of infinite scrolling
 * Single Responsibility: State management
 */
interface InfiniteScrollState {
  isLoadingMore: boolean
  hasLoadedAll: boolean
  loadedPages: number
  totalItems: number
  error: Error | null
  retryCount: number
}

/**
 * Business Logic Hook: Advanced Infinite Scroll
 * Implements intersection observer-based infinite scrolling
 * Follows Single Responsibility: Infinite scroll orchestration
 * Implements Observer Pattern for scroll detection
 */
export function useInfiniteScroll<TData = unknown, TError = Error>(
  query: UseInfiniteQueryResult<InfiniteData<TData>, TError>,
  config: InfiniteScrollConfig = {}
) {
  const {
    rootMargin = '100px',
    loadMoreDelay = 200,
    retryDelay = 1000,
    maxRetries = 3,
    enabled = true,
  } = config

  // Refs for scroll detection
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLElement | null>(null)
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Infinite scroll state
  const [scrollState, setScrollState] = useState<InfiniteScrollState>({
    isLoadingMore: false,
    hasLoadedAll: false,
    loadedPages: query.data?.pages.length || 0,
    totalItems: 0,
    error: null,
    retryCount: 0,
  })

  // Update state when query data changes
  useEffect(() => {
    if (query.data) {
      const totalItems = query.data.pages.reduce((sum, page) => {
        // Assumes page has a data array or similar structure
        const pageData = page as { data?: unknown[] } | unknown[]
        if (Array.isArray(pageData)) {
          return sum + pageData.length
        }
        if (pageData && typeof pageData === 'object' && 'data' in pageData) {
          return sum + (Array.isArray(pageData.data) ? pageData.data.length : 0)
        }
        return sum
      }, 0)

      setScrollState(prev => ({
        ...prev,
        loadedPages: query.data.pages.length,
        totalItems,
        hasLoadedAll: !query.hasNextPage,
      }))
    }
  }, [query.data, query.hasNextPage])

  // Load more function with debouncing and retry logic
  const loadMore = useCallback(async () => {
    if (
      !enabled ||
      query.isFetchingNextPage ||
      !query.hasNextPage ||
      scrollState.isLoadingMore
    ) {
      return
    }

    // Clear any pending load more timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current)
    }

    // Debounce the load more action
    loadMoreTimeoutRef.current = setTimeout(async () => {
      setScrollState(prev => ({ ...prev, isLoadingMore: true, error: null }))

      try {
        if (query.fetchNextPage) {
          await query.fetchNextPage()
        }
        setScrollState(prev => ({ ...prev, retryCount: 0 }))
      } catch (error) {
        setScrollState(prev => ({
          ...prev,
          error: error as Error,
          retryCount: prev.retryCount + 1,
        }))

        // Auto-retry if under max retries
        if (scrollState.retryCount < maxRetries) {
          setTimeout(() => {
            void loadMore()
          }, retryDelay * (scrollState.retryCount + 1))
        }
      } finally {
        setScrollState(prev => ({ ...prev, isLoadingMore: false }))
      }
    }, loadMoreDelay)
  }, [
    enabled,
    query,
    scrollState.isLoadingMore,
    scrollState.retryCount,
    loadMoreDelay,
    retryDelay,
    maxRetries,
  ])

  // Set up intersection observer
  useEffect(() => {
    if (!enabled) return

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      entries => {
        const target = entries[0]
        if (target?.isIntersecting) {
          void loadMore()
        }
      },
      {
        rootMargin,
        threshold: 0.1,
      }
    )

    // Observe the load more element if it exists
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current)
      }
    }
  }, [enabled, loadMore, rootMargin])

  // Callback ref for the sentinel element
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    // Disconnect previous observer
    if (observerRef.current && loadMoreRef.current) {
      observerRef.current.unobserve(loadMoreRef.current)
    }

    // Store new ref
    loadMoreRef.current = node

    // Observe new element
    if (observerRef.current && node) {
      observerRef.current.observe(node)
    }
  }, [])

  // Manual trigger for load more (e.g., button click)
  const manualLoadMore = useCallback(() => {
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current)
    }
    void loadMore()
  }, [loadMore])

  // Reset function
  const reset = useCallback(() => {
    setScrollState({
      isLoadingMore: false,
      hasLoadedAll: false,
      loadedPages: 0,
      totalItems: 0,
      error: null,
      retryCount: 0,
    })
    
    if (query.refetch) {
      void query.refetch()
    }
  }, [query])

  return {
    // Ref to attach to sentinel element
    sentinelRef,
    
    // State
    ...scrollState,
    isFetchingNextPage: query.isFetchingNextPage,
    
    // Actions
    loadMore: manualLoadMore,
    reset,
    
    // Utilities
    canLoadMore: enabled && query.hasNextPage && !scrollState.isLoadingMore,
    shouldShowLoader: scrollState.isLoadingMore || query.isFetchingNextPage,
    shouldShowError: Boolean(scrollState.error) && scrollState.retryCount >= maxRetries,
    
    // Progress info
    progress: {
      loadedPages: scrollState.loadedPages,
      totalItems: scrollState.totalItems,
      hasMore: query.hasNextPage || false,
    },
  }
}

/**
 * Business Logic Hook: Virtual Infinite Scroll
 * Implements virtualized infinite scrolling for performance
 * Follows Dependency Inversion: Depends on generic interfaces
 */
export function useVirtualInfiniteScroll<TItem extends { id: string | number }>(
  items: TItem[],
  config: {
    itemHeight: number | ((item: TItem) => number)
    containerHeight: number
    overscan?: number
    getItemKey?: (item: TItem) => string | number
  }
) {
  const {
    itemHeight,
    containerHeight,
    overscan = 3,
    getItemKey = (item) => item.id,
  } = config

  const [scrollTop, setScrollTop] = useState(0)

  // Calculate item heights
  const itemHeights = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.map(() => itemHeight)
    }
    return items.map(itemHeight)
  }, [items, itemHeight])

  // Calculate positions
  const positions = useMemo(() => {
    const positions: number[] = [0]
    for (let i = 0; i < itemHeights.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const currentPosition = positions[i] || 0
      // eslint-disable-next-line security/detect-object-injection
      const currentHeight = itemHeights[i] || 0
      positions.push(currentPosition + currentHeight)
    }
    return positions
  }, [itemHeights])

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = positions.findIndex((pos: number) => pos >= scrollTop) - 1
    const endIndex = positions.findIndex((pos: number) => pos >= scrollTop + containerHeight)
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length, endIndex + overscan),
    }
  }, [scrollTop, containerHeight, positions, overscan, items.length])

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      key: getItemKey(item),
      style: {
        position: 'absolute' as const,
        top: positions[visibleRange.start + index],
        height: itemHeights[visibleRange.start + index],
        width: '100%',
      },
    }))
  }, [items, visibleRange, positions, itemHeights, getItemKey])

  // Container props
  const containerProps = {
    style: {
      position: 'relative' as const,
      height: containerHeight,
      overflow: 'auto',
    },
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    },
  }

  // Content props (inner container)
  const contentProps = {
    style: {
      height: positions[positions.length - 1] || 0,
      position: 'relative' as const,
    },
  }

  return {
    // Props to spread on containers
    containerProps,
    contentProps,
    
    // Visible items with positioning
    visibleItems,
    
    // Scroll state
    scrollTop,
    
    // Info
    totalHeight: positions[positions.length - 1] || 0,
    visibleRange,
    
    // Actions
    scrollTo: (index: number) => {
      // eslint-disable-next-line security/detect-object-injection
      const position = positions[index] || 0
      // Would need ref to container to actually scroll
      setScrollTop(position)
    },
    
    scrollToItem: (item: TItem) => {
      const index = items.findIndex(i => getItemKey(i) === getItemKey(item))
      if (index >= 0) {
        // eslint-disable-next-line security/detect-object-injection
        const position = positions[index] || 0
        setScrollTop(position)
      }
    },
  }
}

/**
 * Business Logic Hook: Bidirectional Infinite Scroll
 * Supports loading in both directions (up and down)
 * Single Responsibility: Bidirectional scroll management
 */
export function useBidirectionalInfiniteScroll<TData = unknown, TError = Error>(
  query: UseInfiniteQueryResult<InfiniteData<TData>, TError>,
  config: {
    threshold?: number
    initialScrollPosition?: 'top' | 'bottom' | 'middle'
  } = {}
) {
  const {
    threshold = 100,
    initialScrollPosition = 'top',
  } = config

  const containerRef = useRef<HTMLElement | null>(null)
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false)
  const previousHeightRef = useRef(0)

  // Standard infinite scroll for bottom
  const bottomScroll = useInfiniteScroll(query, { threshold })

  // Load previous pages (scrolling up)
  const loadPrevious = useCallback(async () => {
    if (isLoadingPrevious || !query.hasPreviousPage) return

    setIsLoadingPrevious(true)
    
    // Store current scroll height
    if (containerRef.current) {
      previousHeightRef.current = containerRef.current.scrollHeight
    }

    try {
      if (query.fetchPreviousPage) {
        await query.fetchPreviousPage()
      }
      
      // Maintain scroll position after content is added
      if (containerRef.current) {
        const newHeight = containerRef.current.scrollHeight
        const heightDiff = newHeight - previousHeightRef.current
        containerRef.current.scrollTop += heightDiff
      }
    } finally {
      setIsLoadingPrevious(false)
    }
  }, [query, isLoadingPrevious])

  // Handle scroll for top loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const container = e.currentTarget
    const threshold = config.threshold || 100
    
    // Check if scrolled to top
    if (container.scrollTop < threshold) {
      void loadPrevious()
    }
  }, [config.threshold, loadPrevious])

  // Set initial scroll position
  useEffect(() => {
    if (containerRef.current && initialScrollPosition !== 'top') {
      const container = containerRef.current
      
      if (initialScrollPosition === 'bottom') {
        container.scrollTop = container.scrollHeight
      } else if (initialScrollPosition === 'middle') {
        container.scrollTop = container.scrollHeight / 2
      }
    }
  }, [initialScrollPosition])

  return {
    // Container ref
    containerRef,
    
    // Props for container
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
    },
    
    // Bottom scroll (standard infinite scroll)
    bottom: bottomScroll,
    
    // Top scroll state
    isLoadingPrevious,
    hasPreviousPage: query.hasPreviousPage || false,
    
    // Actions
    loadPrevious,
    
    // Combined loading state
    isLoading: bottomScroll.isLoadingMore || isLoadingPrevious,
  }
}

/**
 * Utility Types for Infinite Scroll Consumers
 */
export type InfiniteScrollResult = ReturnType<typeof useInfiniteScroll>
export type VirtualInfiniteScrollResult<T extends { id: string | number }> = ReturnType<typeof useVirtualInfiniteScroll<T>>
export type BidirectionalInfiniteScrollResult = ReturnType<typeof useBidirectionalInfiniteScroll>