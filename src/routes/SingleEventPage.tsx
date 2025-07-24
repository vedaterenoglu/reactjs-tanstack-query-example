import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { EventDescription } from '@/components/events/EventDescription'
import { EventDetailsCard } from '@/components/events/EventDetailsCard'
import { EventHeader } from '@/components/events/EventHeader'
import { EventHeroSection } from '@/components/events/EventHeroSection'
import { StateFrame } from '@/components/frames'
import { BackNavigation } from '@/components/navigation/BackNavigation'
import { getAppUrl } from '@/lib/config/env'
import { useEvent } from '@/lib/hooks/useEvents'
import {
  processPayment,
  validatePaymentRequest,
} from '@/services/payment/paymentService'

/**
 * SingleEventPage Component - Container component orchestrating event display components
 *
 * Design Patterns Applied:
 * 1. **Container/Presentational Pattern**: Pure container component that:
 *    - Handles data fetching through useEvent hook with TanStack Query
 *    - Manages loading, error, and data states
 *    - Orchestrates extracted presentational components
 *    - Delegates all presentation to specialized components
 *
 * 2. **Compound Component Pattern**: Composes multiple related event components
 *
 * 3. **Custom Hook Pattern**: Uses useEvent for data fetching abstraction
 *
 * 4. **Dependency Injection Pattern**: Injects formatted data and handlers to components
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for orchestrating component composition
 * - **OCP**: Extensible through component composition without modification
 * - **LSP**: Can be substituted with other page containers
 * - **ISP**: Components receive focused, minimal prop interfaces
 * - **DIP**: Depends on component and hook abstractions
 *
 * React 19 Patterns:
 * - Component composition over inheritance
 * - Custom hook integration for data management
 * - Presentational component orchestration
 */

export const SingleEventPage = () => {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()

  // Payment processing state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Custom hook integration following DIP and Facade patterns
  const { event, isLoading, error } = useEvent(slug)
  
  const retry = useCallback(() => {
    // TanStack Query handles retries automatically
    window.location.reload()
  }, [])

  // Memoized formatting operations for performance
  const formattedPrice = useMemo(() => {
    if (!event) return ''
    return event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`
  }, [event])

  const formattedDate = useMemo(() => {
    if (!event) return ''
    const date = new Date(event.date)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [event])

  const formattedTime = useMemo(() => {
    if (!event) return ''
    const date = new Date(event.date)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }, [event])

  // Event handlers following Performance Pattern
  const handleBackClick = useCallback(() => {
    void navigate(-1) // Go back to previous page
  }, [navigate])

  const handleRetry = useCallback(() => {
    retry()
  }, [retry])

  const handlePurchase = useCallback(
    async (quantity: number) => {
      if (!slug) return

      try {
        setIsProcessingPayment(true)
        setPaymentError(null)

        // Construct redirect URLs for Stripe using environment configuration
        const successUrl = getAppUrl(`/events/${slug}/payment-success`)
        const cancelUrl = getAppUrl(`/events/${slug}/payment-cancel`)

        // Validate payment request
        const paymentRequest = validatePaymentRequest({
          eventSlug: slug,
          quantity,
          successUrl,
          cancelUrl,
        })

        // Process secure payment with server-side validation
        const paymentResponse = await processPayment(paymentRequest)

        // Redirect to Stripe checkout
        window.location.href = paymentResponse.checkoutUrl
      } catch (error) {
        console.error('Payment processing failed:', error)

        // Handle payment errors with user-friendly messages
        if (error && typeof error === 'object' && 'message' in error) {
          setPaymentError(error.message as string)
        } else {
          setPaymentError('Payment processing failed. Please try again.')
        }
      } finally {
        setIsProcessingPayment(false)
      }
    },
    [slug]
  )

  // Early return for invalid slug
  if (!slug) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">Invalid event URL</p>
          <BackNavigation onBackClick={handleBackClick} label="Go Back" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <BackNavigation onBackClick={handleBackClick} />

      <StateFrame
        error={error ? error.message : null}
        onRetry={handleRetry}
        errorTitle="Unable to Load Event"
        isLoading={isLoading && !event}
        hasData={!!event}
        loadingTitle="Loading Event Details"
        loadingMessage="Fetching event information..."
        isEmpty={false} // Single event pages don't have empty states
        onRefresh={handleRetry}
      >
        {event && (
          <article className="max-w-4xl mx-auto">
            {/* Hero Image Section */}
            <EventHeroSection event={event} formattedPrice={formattedPrice} />

            {/* Event Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Header */}
                <EventHeader event={event} />

                {/* Event Description */}
                <EventDescription event={event} />
              </div>

              {/* Event Details Sidebar */}
              <div className="lg:col-span-1">
                <EventDetailsCard
                  event={event}
                  formattedDate={formattedDate}
                  formattedTime={formattedTime}
                  formattedPrice={formattedPrice}
                  onPurchase={handlePurchase}
                  isProcessingPayment={isProcessingPayment}
                  paymentError={paymentError}
                />
              </div>
            </div>
          </article>
        )}
      </StateFrame>
    </div>
  )
}
