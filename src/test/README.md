# Testing Guide for TanStack Query Migration

This guide explains the test setup and patterns for testing components and hooks that use TanStack Query.

## Test Setup

### Dependencies

The following testing dependencies have been added:

- **Vitest**: Fast unit test framework that works seamlessly with Vite
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom jest matchers for DOM testing
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM implementation for Node.js

### Configuration Files

1. **vitest.config.ts**: Vitest configuration with React and TypeScript support
2. **src/test/setup.ts**: Global test setup with mocks for browser APIs
3. **src/test/test-utils.tsx**: Custom render utilities for TanStack Query

## Testing Patterns

### 1. Testing Query Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { AllTheProviders } from '@/test/test-utils'

// Mock API functions
vi.mock('@/lib/api/queryFunctions')

// Test the hook
const { result } = renderHook(() => useEventsQuery(), {
  wrapper: AllTheProviders,
})

// Wait for query to complete
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true)
})
```

### 2. Testing Mutation Hooks

```typescript
// Test optimistic updates
act(() => {
  result.current.mutate(data, {
    onSuccess: vi.fn(),
    onError: vi.fn(),
  })
})

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true)
})
```

### 3. Testing Components with Queries

```typescript
import { renderWithQuery } from '@/test/test-utils'

// Use custom render function
renderWithQuery(<YourComponent />)

// Component will have access to QueryClient
```

### 4. Creating Test Query Client

Each test gets a fresh QueryClient with:
- Retries disabled
- Refetch on window focus disabled
- Zero stale time
- No automatic refetching

## Best Practices

### 1. Mock External Dependencies

Always mock API calls and external services:

```typescript
vi.mock('@/lib/api/queryFunctions', () => ({
  fetchEvents: vi.fn(),
  fetchEventBySlug: vi.fn(),
}))
```

### 2. Clean Up Between Tests

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

### 3. Test Loading States

```typescript
// Initially loading
expect(result.current.isLoading).toBe(true)

// After data loads
await waitFor(() => {
  expect(result.current.data).toBeDefined()
})
```

### 4. Test Error States

```typescript
vi.mocked(fetchData).mockRejectedValueOnce(new Error('Failed'))

await waitFor(() => {
  expect(result.current.isError).toBe(true)
  expect(result.current.error).toBeDefined()
})
```

### 5. Test Cache Invalidation

```typescript
const queryClient = createTestQueryClient()

// Perform action that invalidates cache
await service.invalidateEvents()

// Verify cache was invalidated
expect(queryClient.invalidateQueries).toHaveBeenCalled()
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Global test setup
│   ├── test-utils.tsx     # Testing utilities
│   └── README.md          # This file
├── components/
│   └── __tests__/         # Component tests
├── lib/
│   ├── hooks/
│   │   └── tanstack/
│   │       └── __tests__/ # Hook tests
│   └── query/
│       └── __tests__/     # Query utility tests
```

## SOLID Principles in Tests

- **Single Responsibility**: Each test focuses on one behavior
- **Open/Closed**: Tests are extensible through mocks
- **Liskov Substitution**: Mock implementations can replace real ones
- **Interface Segregation**: Test utilities have focused interfaces
- **Dependency Inversion**: Tests depend on abstractions (mocks)

## React 19 Testing Patterns

- Use custom hooks for complex logic testing
- Test components in isolation with mocked dependencies
- Focus on user interactions and outcomes
- Ensure accessibility in all component tests
- Test error boundaries and suspense integration

## Common Testing Scenarios

### Testing Components with Multiple Queries

```typescript
const { result } = renderHook(() => {
  const citiesQuery = useCitiesQuery()
  const eventsQuery = useEventsQuery()
  return { citiesQuery, eventsQuery }
}, { wrapper: AllTheProviders })

await waitFor(() => {
  expect(result.current.citiesQuery.isSuccess).toBe(true)
  expect(result.current.eventsQuery.isSuccess).toBe(true)
})
```

### Testing Infinite Queries

```typescript
const { result } = renderHook(
  () => useInfiniteEventsQuery(),
  { wrapper: AllTheProviders }
)

// Test initial page
await waitFor(() => {
  expect(result.current.data?.pages).toHaveLength(1)
})

// Fetch next page
act(() => {
  result.current.fetchNextPage()
})
```

### Testing with React Router

```typescript
import { MemoryRouter } from 'react-router-dom'

const AllTheProvidersWithRouter = ({ children }) => (
  <MemoryRouter>
    <AllTheProviders>{children}</AllTheProviders>
  </MemoryRouter>
)
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Make sure to run `npm install` after adding test dependencies
2. **Test timeouts**: Increase timeout in test that involves async operations: `it('test', async () => {...}, 10000)`
3. **Act warnings**: Wrap state updates in `act()` from `@testing-library/react`
4. **Query not refetching**: Check that your test QueryClient configuration has the expected defaults

### Debug Tips

- Use `screen.debug()` to see the current DOM state
- Enable query logging: `queryClient.getQueryCache().subscribe(console.log)`
- Check query state: `queryClient.getQueryState(queryKey)`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [TanStack Query Testing Guide](https://tanstack.com/query/latest/docs/react/guides/testing)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
