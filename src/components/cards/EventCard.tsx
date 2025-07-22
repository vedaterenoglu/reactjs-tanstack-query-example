import { Calendar, MapPin, Clock } from 'lucide-react'
import { useCallback, useState, useMemo } from 'react'

import { Button } from '@/components/ui/button'
import type { Event } from '@/lib/types/event.types'

/**
 * EventCard Component - Interactive event card following CityCard design patterns
 *
 * Current Features:
 * - Semantic <article> element for proper content structure (like CityCard)
 * - Rectangular event image with lazy loading and error fallback (Calendar icon)
 * - Text overlay with transparent black background for event details
 * - Hover animations (scale, overlay effects) matching CityCard behavior
 * - Price badge positioned like CityCard selection indicator
 * - Interactive button with hover effects (follows CityCard button pattern)
 * - Date/time formatting with proper semantic time element
 * - Compact/default variants for different layout needs
 * - Full accessibility support with ARIA labels and proper semantics
 *
 * Design Patterns Applied:
 * - Composition Pattern: Composes article, img, Button, icons within card layout (same as CityCard)
 * - Event Handler Pattern: Handles mouse events, image loading, click events
 * - Strategy Pattern: Different rendering based on hover, loading, error states
 * - Template Method Pattern: Follows CityCard template with event-specific content
 * - Performance Pattern: Memoized formatting operations
 *
 * SOLID Principles:
 * - SRP: Handles event card display, formatting, and interaction only
 * - OCP: Extensible via props (variant, showButton, disabled, className, onClick)
 * - LSP: Can substitute other card implementations with same interface
 * - ISP: Focused EventCardProps interface for event display and interaction
 * - DIP: Depends on Event type interface and Button component abstractions
 *
 * Semantic HTML Structure:
 * - Uses semantic <article> element (consistent with CityCard)
 * - Proper <img> with alt text and lazy loading
 * - Text overlay with semantic <time> element for dates
 * - Button elements for interactive actions
 * - ARIA labels for screen reader accessibility
 */

interface EventCardProps {
  event: Event
  onClick?: ((event: Event) => void) | undefined
  className?: string
  variant?: 'default' | 'compact'
  disabled?: boolean
  showActionButton?: boolean
}

export const EventCard = ({
  event,
  onClick,
  className = '',
  variant = 'default',
  disabled = false,
  showActionButton = true,
}: EventCardProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Memoized formatting operations for performance
  const formattedPrice = useMemo(() => {
    return event.price === 0 ? 'Free' : `$${(event.price / 100).toFixed(2)}`
  }, [event.price])

  const formattedDate = useMemo(() => {
    const date = new Date(event.date)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }, [event.date])

  const formattedTime = useMemo(() => {
    const date = new Date(event.date)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }, [event.date])

  // Event handlers following CityCard pattern
  const handleCardClick = useCallback(() => {
    if (disabled) return
    try {
      onClick?.(event)
    } catch (error) {
      console.error('Failed to handle event click:', error)
    }
  }, [event, onClick, disabled])

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true)
    }
  }, [disabled])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageError(false)
  }, [])

  // Responsive dimensions - rectangular format for events
  const cardHeight = variant === 'compact' ? 'h-64' : 'h-80'

  return (
    <article
      className={`
        group relative overflow-hidden rounded-lg shadow-sm transition-all duration-300
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${cardHeight}
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="article"
      aria-label={`Event: ${event.name} on ${formattedDate}`}
    >
      {/* Background Image - Rectangular format */}
      {!imageError ? (
        <img
          src={event.imageUrl}
          alt={event.alt}
          className={`
            w-full h-full object-cover object-center
            transition-transform duration-300
            ${isHovered && !disabled ? 'scale-105' : ''}
          `}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      ) : (
        // Fallback when image fails to load - same as CityCard pattern
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Calendar className="h-12 w-12 text-muted-foreground" />
        </div>
      )}

      {/* Hover Overlay - matches CityCard */}
      <div
        className={`
          absolute inset-0 bg-black/20 transition-opacity duration-300
          ${isHovered && !disabled ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* Price Badge - top right corner like selection indicator */}
      <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
        {formattedPrice}
      </div>

      {/* Event Details Overlay - bottom section matching CityCard design */}
      <div className="absolute bottom-2 left-4 right-4 z-10 bg-black/60 rounded px-2 py-1">
        {/* Event Name - main title */}
        <h3
          className={`
            font-semibold text-white truncate
            ${variant === 'compact' ? 'text-sm' : 'text-base'}
          `}
          style={{
            textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
          }}
        >
          {event.name}
        </h3>

        {/* Date and Time Row */}
        <div className="flex items-center gap-3 text-white/90 text-xs mt-1">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <time dateTime={event.date}>{formattedDate}</time>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
          <MapPin className="h-3 w-3" />
          <span
            className="line-clamp-1"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {event.location}
          </span>
        </div>
      </div>

      {/* Action Button - Centered on hover like CityCard */}
      {showActionButton && (
        <div
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
            transition-all duration-300 ease-out
            ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
          `}
        >
          <Button
            onClick={handleCardClick}
            disabled={disabled}
            variant="ghost"
            size="sm"
            className={`
              shadow-lg backdrop-blur-sm min-h-[44px] min-w-[88px]
              bg-black/60 text-white hover:bg-black/70 hover:text-green-500
              transform transition-all duration-200
              ${isHovered ? 'hover:scale-110' : ''}
            `}
            aria-label={`View details for ${event.name}`}
          >
            View Details
          </Button>
        </div>
      )}
    </article>
  )
}
