import { useAuth } from '@clerk/clerk-react'
import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * ProtectedRoute Component - Route protection wrapper with Clerk authentication
 * 
 * Current Features:
 * - Clerk authentication integration via useAuth hook
 * - Configurable redirect destination (default: '/' home page)
 * - Loading state with semantic accessibility (role="status", aria-live)
 * - Screen reader support with spinner and loading message
 * - Automatic navigation on authentication failure
 * - Children rendering pattern for protected content
 * 
 * Design Patterns Applied:
 * - Wrapper Pattern: Wraps child components with authentication logic
 * - Guard Pattern: Prevents access to protected content without authentication
 * - Hook Integration Pattern: Uses Clerk's useAuth for authentication state
 * - Conditional Rendering Pattern: Different renders based on auth state
 * - Higher-Order Component Pattern: Enhances components with auth protection
 * 
 * SOLID Principles:
 * - SRP: Only handles route protection and authentication state management
 * - OCP: Extensible via redirectTo prop for different redirect destinations
 * - LSP: Can substitute other route protection implementations
 * - ISP: Focused ProtectedRouteProps interface with children and optional redirect
 * - DIP: Depends on Clerk useAuth hook and React Router Navigate abstractions
 * 
 * React 19 Patterns:
 * - Hook Integration: useAuth hook for authentication state access
 * - Conditional Rendering: Loading, redirect, and content states
 * - Children Pattern: Renders children when authenticated
 * - Navigation Pattern: Uses Navigate component for redirects
 * - Accessibility Pattern: Proper loading state semantics
 * 
 * Authentication Flow:
 * 1. Check if Clerk authentication is loaded (isLoaded)
 * 2. Show accessible loading state while determining auth status
 * 3. Redirect to configured destination if not signed in
 * 4. Render protected children content if authenticated
 * 
 * Semantic HTML Structure:
 * - Loading state with role="status" and aria-live="polite"
 * - Hidden loading message for screen readers (sr-only)
 * - Spinner with aria-hidden to avoid screen reader noise
 */
interface ProtectedRouteProps {
  children: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  redirectTo = '/',
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth()

  // Show loading state while authentication is being determined
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true"></div>
        <span className="sr-only">Loading authentication status...</span>
      </div>
    )
  }

  // Redirect to specified route if not authenticated
  if (!isSignedIn) {
    return <Navigate to={redirectTo} replace />
  }

  // Render protected content if authenticated
  return <>{children}</>
}
