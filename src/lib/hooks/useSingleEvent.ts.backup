import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { AppDispatch } from '@/store'
import {
  fetchEventBySlug,
  selectSelectedEvent,
  selectIsLoading,
  selectError,
} from '@/store/slices/events'

/**
 * Custom hook for single event data management
 *
 * Design Patterns Applied:
 * 1. **Facade Pattern**: Hides Redux complexity behind clean component API
 * 2. **Observer Pattern**: Observes Redux state changes for event data
 * 3. **Command Pattern**: Encapsulates event fetching operations
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for single event state management
 * - **OCP**: Extensible through Redux store extensions
 * - **LSP**: Can substitute other event hooks with same interface
 * - **ISP**: Focused interface for single event operations
 * - **DIP**: Depends on Redux abstractions, not concrete implementations
 *
 * React 19 Patterns:
 * - Custom Hook Pattern for state encapsulation
 * - Performance optimization with useCallback
 * - Effect management for data fetching
 */

export const useSingleEvent = (slug?: string) => {
  const dispatch = useDispatch<AppDispatch>()

  // Redux state selectors following Observer Pattern
  const event = useSelector(selectSelectedEvent)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectError)

  // Memoized action dispatchers following Command Pattern
  const fetchEvent = useCallback(
    (eventSlug: string) => dispatch(fetchEventBySlug(eventSlug)),
    [dispatch]
  )

  const retry = useCallback(() => {
    if (slug) {
      fetchEvent(slug)
    }
  }, [slug, fetchEvent])

  // Effect for automatic data fetching
  useEffect(() => {
    if (slug && (!event || event.slug !== slug)) {
      fetchEvent(slug)
    }
  }, [slug, event, fetchEvent])

  return {
    event,
    isLoading,
    error,
    retry,
    hasData: !!event,
  }
}
