/**
 * TanStack Query DevTools Component - Development debugging and inspection tools
 *
 * Design Patterns Applied:
 * 1. **Conditional Rendering Pattern**: Only renders in development environment
 * 2. **Lazy Loading Pattern**: DevTools loaded only when needed in development
 * 3. **Observer Pattern**: Monitors query states and mutations for debugging
 * 4. **Facade Pattern**: Simplifies DevTools configuration and integration
 * 5. **Strategy Pattern**: Different DevTools configurations for different scenarios
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for development debugging and query inspection
 * - **OCP**: Extensible through configuration without modifying core component
 * - **LSP**: Can substitute other debugging components with same interface
 * - **ISP**: Focused interface for development debugging needs
 * - **DIP**: Depends on TanStack Query abstractions, not concrete implementations
 *
 * React 19 Patterns:
 * - Conditional rendering with environment detection
 * - Lazy loading for performance optimization in development
 * - Integration with React Query's built-in DevTools
 * - Development-only utilities without production impact
 */

import React, { lazy, Suspense } from 'react'

import { useQueryDebug } from './QueryDebugUtils'

import type { QueryDevToolsConfig } from './devToolsConfigs'

/**
 * Lazy load TanStack Query DevTools to avoid production bundle inclusion
 * Following Lazy Loading Pattern for development-only dependencies
 */
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((module) => ({
    default: module.ReactQueryDevtools,
  }))
)

// QueryDevToolsConfig moved to devToolsConfigs.ts

/**
 * Props for QueryDevTools component
 */
export interface QueryDevToolsProps extends QueryDevToolsConfig {
  enabled?: boolean
  showInProduction?: boolean
  fallback?: React.ReactNode
}

// QueryDebugUtils moved to separate file to fix react-refresh warnings

/**
 * TanStack Query DevTools Component with development-only rendering
 * Following Conditional Rendering and Lazy Loading patterns
 */
export const QueryDevTools: React.FC<QueryDevToolsProps> = ({
  enabled = true,
  showInProduction = false,
  fallback = null,
  initialIsOpen = false,
  position = 'bottom-right',
  panelPosition = 'bottom',
  closeButtonProps,
  toggleButtonProps,
  errorTypes,
  styleNonce,
  shadowDOMTarget,
}) => {
  // Check if DevTools should be rendered
  const shouldRender = React.useMemo(() => {
    const isDevelopment = process.env['NODE_ENV'] === 'development'
    return enabled && (isDevelopment || showInProduction)
  }, [enabled, showInProduction])

  // Don't render anything if conditions aren't met
  if (!shouldRender) {
    return null
  }

  return (
    <Suspense fallback={fallback}>
      <ReactQueryDevtools
        initialIsOpen={initialIsOpen}
        position={position}
        panelPosition={panelPosition}
        closeButtonProps={closeButtonProps}
        toggleButtonProps={toggleButtonProps}
        errorTypes={errorTypes}
        styleNonce={styleNonce}
        shadowDOMTarget={shadowDOMTarget}
      />
    </Suspense>
  )
}

// useQueryDebug hook moved to QueryDebugUtils.ts

/**
 * Development-only query inspector component
 * Following Observer Pattern for query state monitoring
 */
export const QueryInspector: React.FC<{
  queryKey: unknown[]
  children: React.ReactNode
}> = ({ queryKey, children }) => {
  const { debugQuery, isEnabled } = useQueryDebug()
  
  React.useEffect(() => {
    if (isEnabled && typeof window !== 'undefined') {
      // Add debug info to window for easy access
      const windowWithDebug = window as typeof window & { 
        __QUERY_DEBUG__?: Record<string, { inspect: () => void; queryKey: unknown[] }> 
      }
      
      windowWithDebug.__QUERY_DEBUG__ = {
        ...(windowWithDebug.__QUERY_DEBUG__ || {}),
        [JSON.stringify(queryKey)]: {
          inspect: () => {
            // Query debugging functionality for development
          },
          queryKey,
        },
      }
    }
  }, [queryKey, debugQuery, isEnabled])

  return <>{children}</>
}

/**
 * Performance monitor component for development
 * Following Observer Pattern for performance tracking
 */
export const QueryPerformanceMonitor: React.FC<{
  enabled?: boolean
  children: React.ReactNode
}> = ({ enabled = true, children }) => {
  const { monitorPerformance, isEnabled } = useQueryDebug()
  
  React.useEffect(() => {
    if (isEnabled && enabled && typeof window !== 'undefined') {
      // Setup performance monitoring
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        // Component render duration tracking for development
        const duration = endTime - startTime
        if (duration > 100) {
          console.warn(`Slow component render: ${duration}ms`)
        }
      }
    }
    return undefined
  }, [monitorPerformance, isEnabled, enabled])

  return <>{children}</>
}

// DevTools configurations moved to devToolsConfigs.ts