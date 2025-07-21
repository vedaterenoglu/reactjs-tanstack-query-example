import { SignOutButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Authenticated Component - Protected dashboard page for authenticated users
 *
 * Current Features:
 * - Semantic page structure with <header> and <main> sections
 * - Personalized welcome message using Clerk user data
 * - User information card displaying name and email from Clerk
 * - Protected features card with sign out and navigation options
 * - Responsive grid layout (1 column mobile, 2 columns desktop)
 * - Integration with Clerk authentication (useUser hook)
 * - Navigation back to home page and sign out functionality
 *
 * Design Patterns Applied:
 * - Container/Presentational Pattern: Pure UI component with Clerk integration
 * - Hook Integration Pattern: Uses useUser hook for authentication state
 * - Card Layout Pattern: Information organized in semantic card components
 * - Navigation Pattern: Links and buttons for user actions
 *
 * SOLID Principles:
 * - SRP: Handles authenticated user dashboard display and basic actions only
 * - OCP: Could be extended with additional user features via props
 * - LSP: Can substitute other authenticated page components
 * - ISP: Simple component with no props interface needed
 * - DIP: Depends on Clerk hooks and UI component abstractions
 *
 * React 19 Patterns:
 * - Hook Integration: useUser hook for authentication state access
 * - Component Composition: Header + main content with card layout
 * - Conditional Rendering: User data display with optional chaining
 * - Event Handling: SignOutButton and Link navigation
 *
 * Semantic HTML Structure:
 * - <header> with <h1> and descriptive paragraph
 * - <main> content area with <section> and hidden <h2>
 * - Card components provide structured content areas
 * - Proper heading hierarchy and ARIA labeling
 */
export function Authenticated() {
  const { user } = useUser()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          This is a protected area only accessible to authenticated users.
        </p>
      </header>

      <main>
        <section aria-labelledby="dashboard-heading">
          <h2 id="dashboard-heading" className="sr-only">
            User Dashboard
          </h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>
                  Your account details and profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {user?.fullName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span>{' '}
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protected Features</CardTitle>
                <CardDescription>
                  Features available only to authenticated users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This content is protected by Clerk authentication.
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/">Back to Home</Link>
                  </Button>
                  <SignOutButton>
                    <Button variant="destructive">Sign Out</Button>
                  </SignOutButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
