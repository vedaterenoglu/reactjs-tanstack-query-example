import { SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

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
            <Link
              to="/"
              className="group relative text-xl font-semibold text-foreground/90 hover:text-foreground transition-all duration-300 ease-out"
            >
              <span className="relative z-10">{title}</span>
              <span className="absolute inset-0 -z-10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out bg-gradient-to-r from-primary/20 to-primary/10 blur-sm rounded-md" />
              <span className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 ease-out" />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
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
