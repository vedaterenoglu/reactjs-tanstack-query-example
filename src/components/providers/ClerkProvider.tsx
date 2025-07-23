/**
 * ClerkProvider - Authentication provider wrapper for Clerk
 * Configures Clerk authentication with publishable key from environment
 */

import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react'
import { type ReactNode } from 'react'

interface ClerkProviderProps {
  children: ReactNode
}

const publishableKey = import.meta.env['VITE_CLERK_PUBLISHABLE_KEY']

if (!publishableKey) {
  throw new Error(
    'Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file.'
  )
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <ClerkReactProvider publishableKey={publishableKey}>
      {children}
    </ClerkReactProvider>
  )
}
