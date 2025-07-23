import { Calendar, Clock, MapPin, User, DollarSign } from 'lucide-react'

import type { Event } from '@/lib/types/event.types'

import { TicketPurchase } from './TicketPurchase'

/**
 * EventDetailsCard Component - Displays structured event details in sidebar format
 *
 * Design Patterns Applied:
 * 1. **Compound Component Pattern**: Part of larger event display system
 * 2. **Presentational Component Pattern**: Pure UI component with formatted data
 * 3. **Template Method Pattern**: Consistent structure for detail display
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for displaying event details in card format
 * - **OCP**: Extensible through additional detail props without modification
 * - **LSP**: Can be substituted with other detail card components
 * - **ISP**: Focused interface for event detail display needs
 * - **DIP**: Depends on Event interface and formatted data abstractions
 *
 * React 19 Patterns:
 * - Semantic HTML structure with proper accessibility
 * - Icon integration with consistent sizing
 * - Sticky positioning for optimal UX
 */

interface EventDetailsCardProps {
  /** Event data containing detail information */
  event: Pick<Event, 'location' | 'organizerName' | 'price' | 'name'>
  /** Pre-formatted date string for display */
  formattedDate: string
  /** Pre-formatted time string for display */
  formattedTime: string
  /** Pre-formatted price string for display */
  formattedPrice: string
  /** Handler for ticket purchase action */
  onPurchase?: (quantity: number) => Promise<void>
  /** Payment processing loading state */
  isProcessingPayment?: boolean
  /** Payment error message */
  paymentError?: string | null
  /** Additional CSS classes for customization */
  className?: string
}

export const EventDetailsCard = ({
  event,
  formattedDate,
  formattedTime,
  formattedPrice,
  onPurchase,
  isProcessingPayment = false,
  paymentError = null,
  className = '',
}: EventDetailsCardProps) => {
  return (
    <div
      className={`bg-muted/50 rounded-lg p-6 space-y-4 sticky top-8 ${className}`}
    >
      <h2 className="text-xl font-semibold mb-4">Event Details</h2>

      {/* Date & Time */}
      <div className="flex items-start gap-3">
        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">{formattedDate}</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-3">
        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Location</p>
          <p className="text-muted-foreground">{event.location}</p>
        </div>
      </div>

      {/* Organizer */}
      <div className="flex items-start gap-3">
        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Organized by</p>
          <p className="text-muted-foreground">{event.organizerName}</p>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-start gap-3">
        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Ticket Price</p>
          <p className="text-2xl font-bold text-primary">{formattedPrice}</p>
        </div>
      </div>

      {/* Ticket Purchase */}
      <div className="pt-4 border-t">
        <TicketPurchase
          event={event}
          onPurchase={onPurchase || (async () => {})}
          isProcessingPayment={isProcessingPayment}
          paymentError={paymentError}
        />
      </div>
    </div>
  )
}
