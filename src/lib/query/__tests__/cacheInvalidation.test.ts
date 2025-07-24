import { QueryClient } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { CacheInvalidationService } from '../cacheInvalidation'
import { queryKeys } from '../queryClient'

/**
 * Cache Invalidation Service Test Suite
 * 
 * Tests TanStack Query cache invalidation strategies
 * 
 * Design Patterns Applied:
 * - Strategy Pattern: Different invalidation strategies
 * - Mock Pattern: Mock QueryClient for testing
 * - Service Pattern: Test service layer functionality
 */

describe('CacheInvalidationService', () => {
  let queryClient: QueryClient
  let service: CacheInvalidationService

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    service = new CacheInvalidationService(queryClient)
    vi.clearAllMocks()
  })

  describe('invalidateEvents', () => {
    it('should invalidate all event queries', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.invalidateEvents()

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.events.all,
      })
    })

    it('should invalidate events with refetch option', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.invalidateEvents({ refetch: true })

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.events.all,
        refetchType: 'active',
      })
    })
  })

  describe('invalidateEventsByCity', () => {
    it('should invalidate events for specific city', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.invalidateEventsByCity('austin')

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.eventsList({ search: 'austin' }),
      })
    })

    it('should handle empty city slug', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.invalidateEventsByCity('')

      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })

  describe('invalidateSingleEvent', () => {
    it('should invalidate specific event', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.invalidateSingleEvent('test-event')

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.event('test-event'),
      })
    })

    it('should invalidate event lists after single event change', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.invalidateSingleEvent('test-event', { 
        invalidateLists: true 
      })

      expect(invalidateSpy).toHaveBeenCalledTimes(2)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.event('test-event'),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.events.lists(),
      })
    })
  })

  describe('invalidateCities', () => {
    it('should invalidate all city queries', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.invalidateCities()

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.cities.all,
      })
    })
  })

  describe('invalidateAll', () => {
    it('should invalidate all queries', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.invalidateAll()

      expect(invalidateSpy).toHaveBeenCalledWith()
    })

    it('should reset queries when specified', async () => {
      const resetSpy = vi.spyOn(queryClient, 'resetQueries')

      await service.invalidateAll({ reset: true })

      expect(resetSpy).toHaveBeenCalledWith()
    })
  })

  describe('smart invalidation', () => {
    it('should use smart invalidation for event mutations', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.smartInvalidate('eventCreated', {
        citySlug: 'austin',
      })

      // Should invalidate event lists and city-specific queries
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.events.lists(),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.eventsList({ search: 'austin' }),
      })
    })

    it('should handle event update with smart invalidation', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await service.smartInvalidate('eventUpdated', {
        eventSlug: 'test-event',
        citySlug: 'seattle',
      })

      // Should invalidate specific event and related lists
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.event('test-event'),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.events.lists(),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.eventsList({ search: 'seattle' }),
      })
    })

    it('should handle event deletion', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      const removeSpy = vi.spyOn(queryClient, 'removeQueries')

      await service.smartInvalidate('eventDeleted', {
        eventSlug: 'deleted-event',
        citySlug: 'austin',
      })

      // Should remove specific event query
      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.event('deleted-event'),
      })

      // Should invalidate lists
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.events.lists(),
      })
    })
  })
})