import { CheckCircle, ArrowRight, Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'

/**
 * PaymentSuccessPage - Handles successful Stripe payment redirects
 *
 * Design Patterns Applied:
 * 1. **Page Component Pattern**: Standalone page for payment success flow
 * 2. **State Management Pattern**: Manages session verification state
 * 3. **Navigation Pattern**: Provides clear next steps after payment
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for displaying payment success
 * - **OCP**: Extensible for different success scenarios
 * - **DIP**: Depends on router abstractions
 */

export const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [, setIsVerifying] = useState(false)

  // In production, verify the session with your backend
  useEffect(() => {
    if (sessionId) {
      setIsVerifying(true)
      // Simulate session verification
      setTimeout(() => {
        setIsVerifying(false)
      }, 1000)
    }
  }, [sessionId])

  const handleBackToEvents = () => {
    void navigate('/events')
  }

  const handleViewEvent = () => {
    void navigate(`/events/${slug}`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle className="relative h-24 w-24 text-green-500" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your tickets have been confirmed and will be sent to your email.
          </p>
        </div>

        {/* Test Mode Notice */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            <strong>Test Mode:</strong> This was a test payment using card 4242
            4242 4242 4242
          </p>
        </div>

        {/* Session Details */}
        {sessionId && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Session ID:</span>
            </div>
            <p className="text-xs font-mono break-all">{sessionId}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={handleViewEvent} className="w-full" size="lg">
            View Event Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            onClick={handleBackToEvents}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Browse More Events
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            A confirmation email has been sent to your registered email address.
          </p>
          <p className="mt-2">Questions? Contact support@onlineticket.com</p>
        </div>
      </div>
    </div>
  )
}
