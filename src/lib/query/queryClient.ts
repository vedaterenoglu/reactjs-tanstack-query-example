import { QueryClient } from '@tanstack/react-query'

// Query key factory for consistent cache key management
export const queryKeys = {
  all: ['queries'] as const,
  events: () => [...queryKeys.all, 'events'] as const,
  event: (slug: string) => [...queryKeys.events(), slug] as const,
  eventsList: (filters: { search?: string; page?: number; limit?: number }) =>
    [...queryKeys.events(), 'list', filters] as const,
  cities: () => [...queryKeys.all, 'cities'] as const,
  city: (slug: string) => [...queryKeys.cities(), slug] as const,
  citiesList: (filters?: { search?: string }) =>
    [...queryKeys.cities(), 'list', filters || {}] as const,
} as const

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Exponential backoff for retries
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default
      refetchOnReconnect: 'always',
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Network mode for mutations
      networkMode: 'online',
    },
  },
})

// Type-safe query options helper
export interface QueryOptions<TData = unknown> {
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  refetchInterval?: number | false
  refetchOnWindowFocus?: boolean | 'always'
  refetchOnReconnect?: boolean | 'always'
  retry?: boolean | number
  retryDelay?: number | ((attemptIndex: number) => number)
  select?: (data: TData) => TData
  placeholderData?: TData | (() => TData)
  initialData?: TData | (() => TData)
  initialDataUpdatedAt?: number | (() => number | undefined)
  meta?: Record<string, unknown>
}

// Type-safe mutation options helper
export interface MutationOptions<TData = unknown, TError = Error, TVariables = void> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  onError?: (error: TError, variables: TVariables) => void | Promise<void>
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables
  ) => void | Promise<void>
  onMutate?: (variables: TVariables) => void | Promise<void>
  retry?: boolean | number
  retryDelay?: number | ((attemptIndex: number) => number)
  meta?: Record<string, unknown>
}

// Utility function to invalidate queries
export const invalidateQueries = async (queryKey: readonly unknown[]) => {
  await queryClient.invalidateQueries({ queryKey })
}

// Utility function to prefetch queries
export const prefetchQuery = async <TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: QueryOptions<TData>
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    ...options,
  })
}

// Utility function to set query data
export const setQueryData = <TData>(
  queryKey: readonly unknown[],
  updater: TData | ((old: TData | undefined) => TData | undefined)
) => {
  queryClient.setQueryData(queryKey, updater)
}

// Utility function to get query data
export const getQueryData = <TData>(queryKey: readonly unknown[]): TData | undefined => {
  return queryClient.getQueryData<TData>(queryKey)
}

// Utility function to cancel queries
export const cancelQueries = async (queryKey: readonly unknown[]) => {
  await queryClient.cancelQueries({ queryKey })
}

// Utility function to reset queries
export const resetQueries = async (queryKey: readonly unknown[]) => {
  await queryClient.resetQueries({ queryKey })
}

// Utility function to remove queries
export const removeQueries = async (queryKey: readonly unknown[]) => {
  await queryClient.removeQueries({ queryKey })
}

// Export type for use in components
export type { QueryClient } from '@tanstack/react-query'