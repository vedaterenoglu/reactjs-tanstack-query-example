import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { fetchEvents, fetchEventBySlug } from '@/lib/api/queryFunctions'
import { AllTheProviders } from '@/test/test-utils'

import { useEventsQuery, useEventQuery } from '../useEventsQuery'

// Mock the API functions
vi.mock('@/lib/api/queryFunctions', () => ({
  fetchEvents: vi.fn(),
  fetchEventBySlug: vi.fn(),
  fetchEventsByCity: vi.fn(),
  fetchEventsWithSearch: vi.fn(),
  fetchPaginatedEvents: vi.fn(),
}))

/**
 * TanStack Query Hooks Test Suite
 * 
 * Design Patterns Applied:
 * - Arrange-Act-Assert Pattern: Clear test structure
 * - Mock Pattern: Isolate hooks from external dependencies
 * - Factory Pattern: Generate test data consistently
 * 
 * SOLID Principles:
 * - SRP: Each test has single responsibility
 * - DIP: Tests depend on mocked abstractions
 */

describe('useEventsQuery', () => {
  const mockEventsResponse = {
    success: true,
    data: [
      {
        id: 1,
        name: 'Test Event 1',
        slug: 'test-event-1',
        city: 'Austin',
        citySlug: 'austin',
        location: 'Test Location',
        date: '2024-12-25T10:00:00Z',
        organizerName: 'Test Organizer',
        imageUrl: 'https://example.com/image.jpg',
        alt: 'Test Image',
        description: 'Test Description',
        price: 50,
      },
      {
        id: 2,
        name: 'Test Event 2',
        slug: 'test-event-2',
        city: 'Seattle',
        citySlug: 'seattle',
        location: 'Test Location 2',
        date: '2024-12-26T10:00:00Z',
        organizerName: 'Test Organizer 2',
        imageUrl: 'https://example.com/image2.jpg',
        alt: 'Test Image 2',
        description: 'Test Description 2',
        price: 75,
      },
    ],
    pagination: {
      total: 2,
      limit: 20,
      offset: 0,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch events successfully', async () => {
    vi.mocked(fetchEvents).mockResolvedValueOnce(mockEventsResponse)

    const { result } = renderHook(() => useEventsQuery(), {
      wrapper: AllTheProviders,
    })

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Wait for success
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Check data
    expect(result.current.data).toEqual(mockEventsResponse)
    expect(result.current.data?.data).toHaveLength(2)
    expect(fetchEvents).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      sortBy: 'date',
      order: 'asc',
    })
  })

  it('should handle query parameters', async () => {
    vi.mocked(fetchEvents).mockResolvedValueOnce(mockEventsResponse)

    const params = {
      limit: 10,
      offset: 10,
      search: 'test',
      sortBy: 'name' as const,
      order: 'desc' as const,
    }

    const { result } = renderHook(() => useEventsQuery(params), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(fetchEvents).toHaveBeenCalledWith(params)
  })

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch events')
    vi.mocked(fetchEvents).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useEventsQuery(), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
    expect(result.current.data).toBeUndefined()
  })
})

describe('useEventQuery', () => {
  const mockEvent = {
    id: 1,
    name: 'Test Event',
    slug: 'test-event',
    city: 'Austin',
    citySlug: 'austin',
    location: 'Test Location',
    date: '2024-12-25T10:00:00Z',
    organizerName: 'Test Organizer',
    imageUrl: 'https://example.com/image.jpg',
    alt: 'Test Image',
    description: 'Test Description',
    price: 50,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch single event by slug', async () => {
    vi.mocked(fetchEventBySlug).mockResolvedValueOnce(mockEvent)

    const { result } = renderHook(() => useEventQuery('test-event'), {
      wrapper: AllTheProviders,
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockEvent)
    expect(fetchEventBySlug).toHaveBeenCalledWith('test-event')
  })

  it('should not fetch when slug is empty', () => {
    const { result } = renderHook(() => useEventQuery('', false), {
      wrapper: AllTheProviders,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(fetchEventBySlug).not.toHaveBeenCalled()
  })

  it('should handle fetch errors', async () => {
    const error = new Error('Event not found')
    vi.mocked(fetchEventBySlug).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useEventQuery('non-existent'), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
    expect(result.current.data).toBeUndefined()
  })
})