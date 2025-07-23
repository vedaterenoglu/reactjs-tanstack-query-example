import type { Event } from '@/lib/types/event.types'

/**
 * EventHeroSection Component - Displays event hero image with price badge
 *
 * Design Patterns Applied:
 * 1. **Presentational Component Pattern**: Pure UI component without business logic
 * 2. **Single Responsibility Pattern**: Only responsible for hero image display
 * 3. **Composition Pattern**: Can be composed with other event components
 *
 * SOLID Principles:
 * - **SRP**: Only handles hero image display with price badge
 * - **OCP**: Extensible through additional props without modification
 * - **LSP**: Can be substituted with other hero components
 * - **ISP**: Minimal interface focused on hero display needs
 * - **DIP**: Depends on Event interface abstraction
 *
 * React 19 Patterns:
 * - Memoized by default for performance
 * - Semantic HTML structure
 * - Accessible image with proper alt text
 */

interface EventHeroSectionProps {
  /** Event data containing image, alt text, and price information */
  event: Pick<Event, 'imageUrl' | 'alt' | 'price'>
  /** Formatted price string to display in badge */
  formattedPrice: string
  /** Additional CSS classes for customization */
  className?: string
}

export const EventHeroSection = ({
  event,
  formattedPrice,
  className = '',
}: EventHeroSectionProps) => {
  return (
    <div
      className={`relative mb-8 rounded-lg overflow-hidden shadow-lg ${className}`}
    >
      <img
        src={event.imageUrl}
        alt={event.alt}
        className="w-full h-64 md:h-80 lg:h-96 object-cover"
        loading="eager" // Load immediately for hero image
      />

      {/* Price Badge */}
      <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-lg font-bold shadow-lg">
        {formattedPrice}
      </div>
    </div>
  )
}
