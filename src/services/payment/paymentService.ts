import { getApiUrl } from '@/lib/config/env'
import type { Event } from '@/lib/types/event.types'

/**
 * PaymentService - Handles secure Stripe payment processing with server-side validation
 *
 * Design Patterns Applied:
 * 1. **Service Pattern**: Encapsulates payment processing business logic
 * 2. **Facade Pattern**: Provides clean interface hiding complex Stripe/API interactions
 * 3. **Command Pattern**: Encapsulates payment request as executable command
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for payment processing logic
 * - **OCP**: Extensible for different payment providers without modification
 * - **LSP**: Can be substituted with other payment services
 * - **ISP**: Focused interface for payment processing needs
 * - **DIP**: Depends on API and Stripe abstractions, not implementations
 *
 * React 19 Patterns:
 * - Async/await for clean promise handling
 * - Type-safe interfaces with TypeScript
 * - Error boundary compatible error handling
 */

interface PaymentRequest {
  /** Event slug for server-side price validation */
  eventSlug: string
  /** User-selected ticket quantity */
  quantity: number
  /** Success redirect URL for Stripe */
  successUrl: string
  /** Cancel/error redirect URL for Stripe */
  cancelUrl: string
}

interface PaymentResponse {
  /** Stripe checkout session URL for redirect */
  checkoutUrl: string
  /** Payment session ID for tracking */
  sessionId: string
}

interface PaymentError {
  /** User-friendly error message */
  message: string
  /** Error type for categorization */
  type: 'validation' | 'network' | 'stripe' | 'server'
}

/**
 * Fetches fresh event data from server to prevent client-side price manipulation
 */
async function fetchEventForPayment(slug: string): Promise<Event> {
  const url = getApiUrl(`/events/${slug}`)
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch event: ${response.status}`)
  }

  const responseData = await response.json()

  // Handle API response wrapper
  if (responseData.data) {
    return responseData.data
  }

  // Fallback for direct event response (backward compatibility)
  return responseData
}

/**
 * Creates Stripe checkout session with server-validated pricing
 */
async function createStripeCheckoutSession(paymentData: {
  eventSlug: string
  eventName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  successUrl: string
  cancelUrl: string
}): Promise<PaymentResponse> {
  const url = getApiUrl('/payments/create-checkout-session')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventSlug: paymentData.eventSlug,
      eventName: paymentData.eventName,
      quantity: paymentData.quantity,
      unitPrice: paymentData.unitPrice,
      totalAmount: paymentData.totalAmount,
      successUrl: paymentData.successUrl,
      cancelUrl: paymentData.cancelUrl,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Payment creation failed: ${response.status}`
    )
  }

  const result = await response.json()
  return {
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
  }
}

/**
 * Processes secure payment with server-side price validation and Stripe integration
 */
export async function processPayment(
  request: PaymentRequest
): Promise<PaymentResponse> {
  try {
    // Step 1: Fetch fresh event data from server for price validation
    const event = await fetchEventForPayment(request.eventSlug)

    // Step 2: Calculate total on server-validated price (prevent fraud)
    const unitPrice = event.price
    const totalAmount = unitPrice * request.quantity

    // Step 3: Create Stripe checkout session with validated pricing
    const paymentResponse = await createStripeCheckoutSession({
      eventSlug: request.eventSlug,
      eventName: event.name,
      quantity: request.quantity,
      unitPrice,
      totalAmount,
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
    })

    return paymentResponse
  } catch (error) {
    // Transform errors into user-friendly messages
    const paymentError: PaymentError = {
      message: 'Payment processing failed. Please try again.',
      type: 'server',
    }

    if (error instanceof Error) {
      if (error.message.includes('fetch event')) {
        paymentError.message =
          'Unable to verify event details. Please try again.'
        paymentError.type = 'validation'
      } else if (error.message.includes('Payment creation failed')) {
        paymentError.message = 'Payment setup failed. Please try again.'
        paymentError.type = 'stripe'
      } else if (error.message.includes('Failed to fetch')) {
        paymentError.message =
          'Network error. Please check your connection and try again.'
        paymentError.type = 'network'
      }
    }

    throw paymentError
  }
}

/**
 * Validates payment request before processing
 */
export function validatePaymentRequest(
  request: Partial<PaymentRequest>
): PaymentRequest {
  if (!request.eventSlug || typeof request.eventSlug !== 'string') {
    throw new Error('Event slug is required')
  }

  if (!request.quantity || request.quantity < 1) {
    throw new Error('Quantity must be at least 1')
  }

  if (!request.successUrl || !request.cancelUrl) {
    throw new Error('Success and cancel URLs are required')
  }

  return {
    eventSlug: request.eventSlug,
    quantity: request.quantity,
    successUrl: request.successUrl,
    cancelUrl: request.cancelUrl,
  }
}
