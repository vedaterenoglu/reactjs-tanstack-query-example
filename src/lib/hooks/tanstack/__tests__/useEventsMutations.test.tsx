import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { createEvent, updateEvent, deleteEvent } from '@/lib/api/queryFunctions'
import { AllTheProviders } from '@/test/test-utils'
import type { CreateEventDto } from '@/lib/types/event.types'

import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '../useEventsMutations'

// Mock the API functions
vi.mock('@/lib/api/queryFunctions', () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
}))

/**
 * TanStack Query Mutations Test Suite
 * 
 * Tests mutation hooks with optimistic updates and error handling
 * 
 * Design Patterns Applied:
 * - Command Pattern: Each mutation represents a command
 * - Observer Pattern: Tests observe mutation state changes
 * - Factory Pattern: Consistent test data generation
 */

describe('useCreateEvent', () => {
  const mockNewEvent: CreateEventDto = {
    name: 'New Event',
    city: 'Austin',
    citySlug: 'austin',
    location: 'Test Venue',
    date: '2024-12-25T10:00:00Z',
    organizerName: 'Test Organizer',
    imageUrl: 'https://example.com/image.jpg',
    alt: 'Test Image',
    description: 'Test Description',
    price: 100,
  }

  const mockCreatedEvent = {
    id: 3,
    slug: 'new-event',
    ...mockNewEvent,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create event successfully', async () => {
    vi.mocked(createEvent).mockResolvedValueOnce(mockCreatedEvent)

    const { result } = renderHook(() => useCreateEvent(), {
      wrapper: AllTheProviders,
    })

    expect(result.current.isPending).toBe(false)

    act(() => {
      result.current.mutate(mockNewEvent)
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCreatedEvent)
    expect(createEvent).toHaveBeenCalledWith(mockNewEvent)
  })

  it('should handle creation errors', async () => {
    const error = new Error('Failed to create event')
    vi.mocked(createEvent).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCreateEvent(), {
      wrapper: AllTheProviders,
    })

    act(() => {
      result.current.mutate(mockNewEvent)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })

  it('should call onSuccess callback', async () => {
    vi.mocked(createEvent).mockResolvedValueOnce(mockCreatedEvent)
    const onSuccess = vi.fn()

    const { result } = renderHook(() => useCreateEvent(), {
      wrapper: AllTheProviders,
    })

    act(() => {
      result.current.mutate(mockNewEvent, { onSuccess })
    })

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        mockCreatedEvent,
        mockNewEvent,
        undefined
      )
    })
  })
})

describe('useUpdateEvent', () => {
  const mockUpdateData = {
    slug: 'test-event',
    updates: {
      name: 'Updated Event Name',
      price: 150,
    },
  }

  const mockUpdatedEvent = {
    id: 1,
    slug: 'test-event',
    name: 'Updated Event Name',
    city: 'Austin',
    citySlug: 'austin',
    location: 'Test Location',
    date: '2024-12-25T10:00:00Z',
    organizerName: 'Test Organizer',
    imageUrl: 'https://example.com/image.jpg',
    alt: 'Test Image',
    description: 'Test Description',
    price: 150,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update event successfully', async () => {
    vi.mocked(updateEvent).mockResolvedValueOnce(mockUpdatedEvent)

    const { result } = renderHook(() => useUpdateEvent(), {
      wrapper: AllTheProviders,
    })

    act(() => {
      result.current.mutate(mockUpdateData)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockUpdatedEvent)
    expect(updateEvent).toHaveBeenCalledWith(mockUpdateData)
  })

  it('should handle update errors', async () => {
    const error = new Error('Failed to update event')
    vi.mocked(updateEvent).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useUpdateEvent(), {
      wrapper: AllTheProviders,
    })

    act(() => {
      result.current.mutate(mockUpdateData)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })
})

describe('useDeleteEvent', () => {
  const eventSlug = 'test-event'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete event successfully', async () => {
    vi.mocked(deleteEvent).mockResolvedValueOnce()

    const { result } = renderHook(() => useDeleteEvent(), {
      wrapper: AllTheProviders,
    })

    act(() => {
      result.current.mutate(eventSlug)
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(deleteEvent).toHaveBeenCalledWith(eventSlug)
  })

  it('should handle deletion errors', async () => {
    const error = new Error('Failed to delete event')
    vi.mocked(deleteEvent).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useDeleteEvent(), {
      wrapper: AllTheProviders,
    })

    act(() => {
      result.current.mutate(eventSlug)
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
  })

  it('should support optimistic delete with onMutate', async () => {
    const onMutate = vi.fn()
    vi.mocked(deleteEvent).mockResolvedValueOnce()

    const { result } = renderHook(() => useDeleteEvent(), {
      wrapper: AllTheProviders,
    })

    act(() => {
      result.current.mutate(eventSlug, { onMutate })
    })

    // onMutate should be called immediately
    expect(onMutate).toHaveBeenCalledWith(eventSlug)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})