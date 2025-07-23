import { Minus, Plus, ShoppingCart, Loader2, AlertCircle } from 'lucide-react'
import { useState, useCallback } from 'react'

import { TestPaymentModal } from '@/components/modals/TestPaymentModal'
import { Button } from '@/components/ui/button'
import type { Event } from '@/lib/types/event.types'

/**
 * TicketPurchase Component - Handles ticket quantity selection and purchase
 *
 * Design Patterns Applied:
 * 1. **State Management Pattern**: Manages ticket quantity state internally
 * 2. **Compound Component Pattern**: Self-contained purchase interface
 * 3. **Command Pattern**: Encapsulates purchase action
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for ticket purchase interface and logic
 * - **OCP**: Extensible through props for different purchase behaviors
 * - **LSP**: Can be substituted with other purchase components
 * - **ISP**: Focused interface for ticket purchase needs
 * - **DIP**: Depends on Event interface and purchase handler abstraction
 *
 * React 19 Patterns:
 * - Local state management with useState
 * - Memoized event handlers for performance
 * - Consistent button animations and interactions
 */

interface TicketPurchaseProps {
  /** Event data containing price information */
  event: Pick<Event, 'price' | 'name'>
  /** Handler for purchase action */
  onPurchase?: (quantity: number) => Promise<void>
  /** Payment processing loading state */
  isProcessingPayment?: boolean
  /** Payment error message */
  paymentError?: string | null
  /** Additional CSS classes for customization */
  className?: string
}

export const TicketPurchase = ({
  event,
  onPurchase,
  isProcessingPayment = false,
  paymentError = null,
  className = '',
}: TicketPurchaseProps) => {
  const [quantity, setQuantity] = useState(0)
  const [showTestModal, setShowTestModal] = useState(false)

  // Calculate total price
  const totalPrice = quantity * event.price

  // Memoized event handlers
  const handleDecrease = useCallback(() => {
    setQuantity(prev => Math.max(0, prev - 1))
  }, [])

  const handleIncrease = useCallback(() => {
    setQuantity(prev => prev + 1)
  }, [])

  const handlePurchaseClick = useCallback(() => {
    if (quantity > 0) {
      setShowTestModal(true)
    }
  }, [quantity])

  const handleConfirmPurchase = useCallback(async () => {
    if (onPurchase) {
      await onPurchase(quantity)
      setShowTestModal(false)
      // Reset quantity after successful purchase
      setQuantity(0)
    } else {
      // Fallback behavior if no purchase handler provided
      console.warn('No purchase handler provided')
      setShowTestModal(false)
    }
  }, [quantity, onPurchase])

  const handleCloseModal = useCallback(() => {
    if (!isProcessingPayment) {
      setShowTestModal(false)
    }
  }, [isProcessingPayment])

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Payment Error Display */}
      {paymentError && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}

      {/* Quantity Controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleDecrease}
            disabled={quantity === 0 || isProcessingPayment}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-muted disabled:hover:scale-100"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <span className="min-w-[3ch] text-center font-semibold text-lg">
            {quantity}
          </span>

          <Button
            onClick={handleIncrease}
            disabled={isProcessingPayment}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-muted disabled:hover:scale-100"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Total Price Display */}
      {quantity > 0 && (
        <div className="flex items-center justify-between py-2 border-t">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold text-primary">
            {formatPrice(totalPrice)}
          </span>
        </div>
      )}

      {/* Purchase Button */}
      <Button
        onClick={handlePurchaseClick}
        disabled={quantity === 0 || isProcessingPayment}
        className="w-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
        size="lg"
      >
        {isProcessingPayment ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {quantity === 0
              ? 'Select Tickets'
              : `Buy ${quantity} Ticket${quantity > 1 ? 's' : ''}`}
          </>
        )}
      </Button>

      {/* Test Payment Modal */}
      <TestPaymentModal
        isOpen={showTestModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPurchase}
        eventName={event.name}
        quantity={quantity}
        totalAmount={totalPrice}
        isProcessing={isProcessingPayment}
      />
    </div>
  )
}
