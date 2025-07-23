/**
 * TestPaymentModal - Modal dialog for test payment confirmation and instructions
 * Shows test card details, order summary, and payment process explanation
 */

import { X, CreditCard, AlertCircle, Shield, CheckCircle } from 'lucide-react'
import React from 'react'

interface TestPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  eventName: string
  quantity: number
  totalAmount: number
  isProcessing?: boolean
}

/**
 * TestPaymentModal - Detailed test payment information and confirmation
 *
 * Design Patterns Applied:
 * 1. **Modal Pattern**: Overlay component for focused user interaction
 * 2. **Confirmation Pattern**: User confirmation before important actions
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for test payment information display
 * - **OCP**: Extensible for production mode information
 */

export const TestPaymentModal: React.FC<TestPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventName,
  quantity,
  totalAmount,
  isProcessing = false,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Test Payment Confirmation
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Test Mode Notice */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  🧪 Test Mode Active
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This is a <strong>demonstration payment system</strong>. No
                  real money will be charged to any card, and no actual payment
                  will be processed.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Event:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {eventName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Quantity:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {quantity} ticket{quantity > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-900 dark:text-white">Total:</span>
                <span className="text-gray-900 dark:text-white">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Test Card Information */}
          <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="w-full">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                  Use This Test Card
                </h3>
                <div className="bg-white dark:bg-gray-700 rounded border p-3 font-mono text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Card Number (click to copy)
                      </span>
                      <div
                        className="font-bold text-green-700 dark:text-green-300 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded select-all"
                        onClick={() =>
                          navigator.clipboard.writeText('4242424242424242')
                        }
                        title="Click to copy card number"
                      >
                        4242 4242 4242 4242
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        Expiry
                      </span>
                      <div className="font-bold text-green-700 dark:text-green-300">
                        Any future date
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        CVC
                      </span>
                      <div className="font-bold text-green-700 dark:text-green-300">
                        Any 3 digits
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        ZIP
                      </span>
                      <div className="font-bold text-green-700 dark:text-green-300">
                        Any 5 digits
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                    💡 Click the card number above to copy it to your clipboard
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              What Happens Next
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  You'll be redirected to Stripe's secure checkout page
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Enter the test card details above</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Complete the "payment" (no real charge)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Return to the success page with confirmation</span>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>This demo uses Stripe's test environment</li>
              <li>No real credit card will be charged</li>
              <li>Test data will not appear in any real payment records</li>
              <li>You can safely proceed without financial risk</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Proceed to Test Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
