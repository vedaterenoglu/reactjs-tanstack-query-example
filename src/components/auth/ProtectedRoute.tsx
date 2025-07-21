import { useAuth } from '@clerk/clerk-react'
import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
