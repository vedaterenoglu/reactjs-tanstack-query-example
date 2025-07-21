import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import { store, persistor } from '@/store'

import type { ReactNode } from 'react'

/**
 * Redux Provider Component - Wraps app with Redux store and persistence
 * 
 * Design Patterns Applied:
 * - Provider Pattern: Provides Redux store context to component tree
 * - Composition Pattern: Integrates with other providers in app stack
 * - Gateway Pattern: Acts as gateway to Redux store and persistence
 * 
 * SOLID Principles:
 * - SRP: Only handles Redux store provision and persistence setup
 * - OCP: Extensible for additional Redux middleware or store enhancers
 * - DIP: Components depend on Redux context, not direct store imports
 * 
 * React 19 Patterns:
 * - Provider Integration: Seamlessly integrates with React context system
 * - Error Boundary Ready: Structured for error boundary integration
 * - Performance Optimized: Minimal re-renders through proper context usage
 */

interface ReduxProviderProps {
  children: ReactNode
}

export const ReduxProvider = ({ children }: ReduxProviderProps) => {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  )
}