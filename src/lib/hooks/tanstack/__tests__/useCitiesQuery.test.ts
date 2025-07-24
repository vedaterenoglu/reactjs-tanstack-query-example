import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { fetchCities, fetchCityBySlug } from '@/lib/api/queryFunctions'
import { AllTheProviders } from '@/test/test-utils'

import { useCitiesQuery, useCityQuery } from '../useCitiesQuery'

// Mock the API functions
vi.mock('@/lib/api/queryFunctions', () => ({
  fetchCities: vi.fn(),
  fetchCityBySlug: vi.fn(),
  fetchCitiesWithSearch: vi.fn(),
}))

/**
 * Cities Query Hooks Test Suite
 * 
 * Tests TanStack Query integration for city data fetching
 * 
 * SOLID Principles:
 * - SRP: Each test focuses on single behavior
 * - OCP: Tests extensible through mock variations
 * - DIP: Tests depend on mocked abstractions
 */

describe('useCitiesQuery', () => {
  const mockCities = [
    {
      id: 1,
      city: 'Austin',
      citySlug: 'austin',
      tagLine: 'Keep Austin Weird',
      info: 'The Live Music Capital of the World',
      bannerImg: 'https://example.com/austin.jpg',
      country: 'United States',
      countrySlug: 'united-states',
      eventCount: 25,
    },
    {
      id: 2,
      city: 'Seattle',
      citySlug: 'seattle',
      tagLine: 'The Emerald City',
      info: 'Home of innovation and coffee',
      bannerImg: 'https://example.com/seattle.jpg',
      country: 'United States',
      countrySlug: 'united-states',
      eventCount: 18,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch cities successfully', async () => {
    vi.mocked(fetchCities).mockResolvedValueOnce(mockCities)

    const { result } = renderHook(() => useCitiesQuery(), {
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
    expect(result.current.data).toEqual(mockCities)
    expect(result.current.data).toHaveLength(2)
    expect(fetchCities).toHaveBeenCalledTimes(1)
  })

  it('should handle fetch errors', async () => {
    const error = new Error('Failed to fetch cities')
    vi.mocked(fetchCities).mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCitiesQuery(), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toEqual(error)
    expect(result.current.data).toBeUndefined()
  })

  it('should not refetch when disabled', () => {
    const { result } = renderHook(() => useCitiesQuery(false), {
      wrapper: AllTheProviders,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(fetchCities).not.toHaveBeenCalled()
  })

  it('should provide computed properties', async () => {
    vi.mocked(fetchCities).mockResolvedValueOnce(mockCities)

    const { result } = renderHook(() => useCitiesQuery(), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Check computed properties
    expect(result.current.citiesCount).toBe(2)
    expect(result.current.hasCities).toBe(true)
    expect(result.current.isEmpty).toBe(false)
  })
})

describe('useCityQuery', () => {
  const mockCity = {
    id: 1,
    city: 'Austin',
    citySlug: 'austin',
    tagLine: 'Keep Austin Weird',
    info: 'The Live Music Capital of the World',
    bannerImg: 'https://example.com/austin.jpg',
    country: 'United States',
    countrySlug: 'united-states',
    eventCount: 25,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch single city by slug', async () => {
    vi.mocked(fetchCityBySlug).mockResolvedValueOnce(mockCity)

    const { result } = renderHook(() => useCityQuery('austin'), {
      wrapper: AllTheProviders,
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockCity)
    expect(fetchCityBySlug).toHaveBeenCalledWith('austin')
  })

  it('should not fetch when slug is empty', () => {
    const { result } = renderHook(() => useCityQuery(''), {
      wrapper: AllTheProviders,
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(fetchCityBySlug).not.toHaveBeenCalled()
  })

  it('should handle city not found', async () => {
    vi.mocked(fetchCityBySlug).mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useCityQuery('non-existent'), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.exists).toBe(false)
  })

  it('should provide existence check', async () => {
    vi.mocked(fetchCityBySlug).mockResolvedValueOnce(mockCity)

    const { result } = renderHook(() => useCityQuery('austin'), {
      wrapper: AllTheProviders,
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.exists).toBe(true)
  })
})