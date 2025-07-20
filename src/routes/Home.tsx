import { SignInButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Home() {
  const { isSignedIn, user } = useUser()

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter">
          Welcome to React + Clerk Template
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A modern React application with Clerk authentication, TypeScript, and Tailwind CSS.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Public Access</CardTitle>
            <CardDescription>
              This page is accessible to all users, signed in or not.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Current status: {isSignedIn ? `Signed in as ${user?.firstName}` : 'Not signed in'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Protected Content</CardTitle>
            <CardDescription>
              Access authenticated features and protected routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignedIn ? (
              <Button asChild>
                <Link to="/authenticated">Go to Protected Area</Link>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button>Sign In to Continue</Button>
              </SignInButton>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}