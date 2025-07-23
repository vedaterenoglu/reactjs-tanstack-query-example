import { XCircle, ArrowLeft, CreditCard, Info } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'

/**
 * PaymentCancelPage - Handles cancelled/failed Stripe payment redirects
 *
 * Design Patterns Applied:
 * 1. **Page Component Pattern**: Standalone page for payment cancellation flow
 * 2. **Navigation Pattern**: Provides clear paths to retry or exit
 * 3. **User Guidance Pattern**: Shows helpful information for test mode
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for displaying payment cancellation
 * - **OCP**: Extensible for different cancellation scenarios
 * - **DIP**: Depends on router abstractions
 */

export const PaymentCancelPage = () => {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()

  const handleRetryPayment = () => {
    void navigate(`/events/${slug}`)
  }

  const handleBackToEvents = () => {
    void navigate('/events')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Cancel Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
            <XCircle className="relative h-24 w-24 text-red-500" />
          </div>
        </div>

        {/* Cancel Message */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your payment was not completed. No charges were made.
          </p>
        </div>

        {/* Test Card Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Testing with Stripe Test Mode
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Use these test card details to complete a payment:
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">4242 4242 4242 4242</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Expiry:</span> Any future date
              </div>
              <div>
                <span className="font-medium">CVC:</span> Any 3 digits
              </div>
              <div className="col-span-2">
                <span className="font-medium">ZIP:</span> Any valid ZIP code
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={handleRetryPayment} className="w-full" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Button
            onClick={handleBackToEvents}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Browse Events
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Need help? Contact support@onlineticket.com</p>
        </div>
      </div>
    </div>
  )
}
