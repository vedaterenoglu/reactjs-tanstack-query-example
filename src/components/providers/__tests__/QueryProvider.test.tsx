import { useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import { QueryProvider } from '../QueryProvider'

/**
 * QueryProvider Component Test Suite
 * 
 * Tests the TanStack Query provider setup and configuration
 * 
 * Design Patterns Applied:
 * - Provider Pattern: Tests provider functionality
 * - Component Testing Pattern: Render and verify behavior
 */

// Test component that uses TanStack Query
function TestComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: () => Promise.resolve('test data'),
  })

  if (isLoading) return <div>Loading...</div>
  return <div>Data: {data}</div>
}

describe('QueryProvider', () => {
  it('should render children', () => {
    render(
      <QueryProvider>
        <div>Test Child</div>
      </QueryProvider>
    )

    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide query client to children', async () => {
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>
    )

    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Eventually shows data
    const dataElement = await screen.findByText('Data: test data')
    expect(dataElement).toBeInTheDocument()
  })

  it('should not render ReactQueryDevtools in production', () => {
    // Mock production environment
    const originalEnv = import.meta.env.MODE
    Object.defineProperty(import.meta.env, 'MODE', {
      value: 'production',
      writable: true,
    })

    const { container } = render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    )

    // Check that devtools are not rendered
    const devtoolsElement = container.querySelector('[class*="devtools"]')
    expect(devtoolsElement).not.toBeInTheDocument()

    // Restore original env
    Object.defineProperty(import.meta.env, 'MODE', {
      value: originalEnv,
      writable: true,
    })
  })

  it('should handle persistence initialization', () => {
    // Mock console to check for persistence logs
    const consoleSpy = vi.spyOn(console, 'warn')

    render(
      <QueryProvider>
        <div>Test</div>
      </QueryProvider>
    )

    // Should initialize without errors
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('persistence')
    )

    consoleSpy.mockRestore()
  })
})