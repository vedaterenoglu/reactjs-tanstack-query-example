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
 * Authenticated - Protected user dashboard page
 * 
 * Displays user information and authentication controls for logged-in users.
 * Shows personalized welcome message and sign out functionality.
 * 
 * Design Patterns Applied:
 * - Presentational Component Pattern: Pure UI with Clerk integration
 * - Hook Integration Pattern: useUser hook for authentication state
 * - Card Layout Pattern: Information organized in card components
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
