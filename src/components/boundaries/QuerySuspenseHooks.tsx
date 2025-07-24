import React from 'react'

import { QuerySuspenseBoundary } from './QuerySuspenseBoundary'

import type { QuerySuspenseBoundaryProps } from './QuerySuspenseBoundary'

/**
 * Higher-Order Component for wrapping components with QuerySuspenseBoundary
 * Following Higher-Order Component Pattern for reusable suspense boundary logic
 */
export const withQuerySuspense = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  suspenseProps?: Omit<QuerySuspenseBoundaryProps, 'children'>
) => {
  const WithQuerySuspenseComponent = (props: P) => (
    <QuerySuspenseBoundary {...suspenseProps}>
      <WrappedComponent {...props} />
    </QuerySuspenseBoundary>
  )

  WithQuerySuspenseComponent.displayName = 
    `withQuerySuspense(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithQuerySuspenseComponent
}

/**
 * Hook for managing suspense boundary states
 * Following Custom Hook Pattern for suspense boundary integration
 */
export const useQuerySuspense = () => {
  const [suspenseKey, setSuspenseKey] = React.useState(0)

  const resetSuspense = React.useCallback(() => {
    setSuspenseKey(prev => prev + 1)
  }, [])

  return {
    suspenseKey,
    resetSuspense,
  }
}