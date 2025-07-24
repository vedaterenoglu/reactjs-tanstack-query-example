/**
 * TanStack Query Types - Specialized type definitions for TanStack Query integration
 *
 * Design Patterns Applied:
 * - Interface Segregation Principle: Focused interfaces for specific query operations
 * - Dependency Inversion Principle: Abstract query patterns, not implementation details
 * - Single Responsibility Principle: Each type serves one clear purpose
 * - Open/Closed Principle: Extensible through generic parameters
 *
 * React 19 Patterns:
 * - Type-safe query hooks with proper inference
 * - Generic interfaces for reusable query patterns
 * - Error boundary compatible error types
 * - Suspense-ready query result types
 */


// Base TanStack Query Error Type
export interface TanStackQueryError {
  message: string
  name?: string
  cause?: unknown
  stack?: string
}

// Generic Query Result Interface following Interface Segregation Principle
export interface BaseQueryResult<TData = unknown, TError = TanStackQueryError> {
  data: TData | undefined
  isLoading: boolean
  isError: boolean
  error: TError | null
  isSuccess: boolean
  isFetching: boolean
  isStale: boolean
  refetch: () => Promise<TData>
}

// Generic Mutation Result Interface
export interface BaseMutationResult<
  TData = unknown,
  TError = TanStackQueryError,
  TVariables = unknown
> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  isLoading: boolean
  isError: boolean
  error: TError | null
  isSuccess: boolean
  data: TData | undefined
  reset: () => void
}

// Query Options Interface for TanStack Query configuration
export interface QueryOptions<TData = unknown, TError = TanStackQueryError> {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnMount?: boolean | 'always'
  refetchOnWindowFocus?: boolean | 'always'
  refetchOnReconnect?: boolean | 'always'
  refetchInterval?: number | false
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
  retryDelay?: number | ((retryAttempt: number, error: TError) => number)
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
  select?: (data: TData) => unknown
  suspense?: boolean
  useErrorBoundary?: boolean | ((error: TError) => boolean)
}

// Mutation Options Interface
export interface MutationOptions<
  TData = unknown,
  TError = TanStackQueryError,
  TVariables = unknown
> {
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => void
  onError?: (error: TError, variables: TVariables, context: unknown) => void
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: unknown
  ) => void
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
  retryDelay?: number | ((retryAttempt: number, error: TError) => number)
  useErrorBoundary?: boolean | ((error: TError) => boolean)
}

// Infinite Query Result Interface
export interface InfiniteQueryResult<TData = unknown, TError = TanStackQueryError> {
  data: InfiniteData<TData> | undefined
  isLoading: boolean
  isError: boolean
  error: TError | null
  isSuccess: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  hasNextPage: boolean | undefined
  hasPreviousPage: boolean | undefined
  fetchNextPage: () => Promise<InfiniteData<TData>>
  fetchPreviousPage: () => Promise<InfiniteData<TData>>
  refetch: () => Promise<InfiniteData<TData>>
}

// Infinite Data Structure
export interface InfiniteData<TData = unknown> {
  pages: TData[]
  pageParams: unknown[]
}

// Query Key Factory Interface following Factory Pattern
export interface QueryKeyFactory {
  all: readonly unknown[]
  lists: () => readonly unknown[]
  list: (filters?: Record<string, unknown>) => readonly unknown[]
  details: () => readonly unknown[]
  detail: (id: string | number) => readonly unknown[]
}

// Cache Time Constants following Strategy Pattern
export const CACHE_TIMES = {
  IMMEDIATE: 0,
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 15, // 15 minutes
  LONG: 1000 * 60 * 60, // 1 hour
  VERY_LONG: 1000 * 60 * 60 * 24, // 24 hours
} as const

// Stale Time Constants
export const STALE_TIMES = {
  IMMEDIATE: 0,
  FAST: 1000 * 30, // 30 seconds
  NORMAL: 1000 * 60 * 2, // 2 minutes
  SLOW: 1000 * 60 * 5, // 5 minutes
  STATIC: 1000 * 60 * 60, // 1 hour (for rarely changing data)
} as const

// Query State Interface for client-side state management
export interface QueryState<TData = unknown> {
  data: TData | undefined
  error: TanStackQueryError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  lastUpdated: number | null
}

// Optimistic Update Context Interface
export interface OptimisticUpdateContext<TData = unknown, TVariables = unknown> {
  previousData: TData | undefined
  optimisticData: TData
  variables: TVariables
  rollback: () => void
}

// Background Refetch Strategy Interface following Strategy Pattern
export interface RefetchStrategy {
  name: string
  shouldRefetch: (data: unknown, error: TanStackQueryError | null) => boolean
  refetchInterval?: number
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
}

// Query Client Configuration Interface
export interface QueryClientConfig {
  defaultOptions?: {
    queries?: QueryOptions
    mutations?: MutationOptions
  }
  queryCache?: unknown
  mutationCache?: unknown
  logger?: {
    log: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
  }
}

// Type Guards for TanStack Query patterns
export const isTanStackQueryError = (error: unknown): error is TanStackQueryError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

export const isQuerySuccess = <TData>(
  result: BaseQueryResult<TData>
): result is BaseQueryResult<TData> & { data: TData } => {
  return result.isSuccess && result.data !== undefined
}

export const isMutationSuccess = <TData, TVariables>(
  result: BaseMutationResult<TData, TanStackQueryError, TVariables>
): result is BaseMutationResult<TData, TanStackQueryError, TVariables> & { data: TData } => {
  return result.isSuccess && result.data !== undefined
}

// Utility Types for TanStack Query
export type QueryKey = readonly unknown[]
export type QueryFunction<TData = unknown> = (context: { queryKey: QueryKey }) => Promise<TData>
export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables: TVariables
) => Promise<TData>

// Hook Return Types for consistent typing across the application
export type UseQueryResult<TData = unknown, TError = TanStackQueryError> = BaseQueryResult<
  TData,
  TError
>

export type UseMutationResult<
  TData = unknown,
  TError = TanStackQueryError,
  TVariables = unknown
> = BaseMutationResult<TData, TError, TVariables>

export type UseInfiniteQueryResult<TData = unknown, TError = TanStackQueryError> =
  InfiniteQueryResult<TData, TError>