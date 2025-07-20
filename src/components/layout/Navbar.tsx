import { SignInButton, UserButton, useUser } from '@clerk/clerk-react'

import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  title: string
}

export function Navbar({ title }: NavbarProps) {
  const { isSignedIn } = useUser()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
