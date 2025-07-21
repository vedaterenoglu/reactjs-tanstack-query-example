import { ArrowLeft, MapPin } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { City } from '@/lib/types/city.types'

/**
 * EventListHeader Component - Dynamic header for events pages with city context
 *
 * Current Features:
 * - City image background with dark overlay (following CityCard design pattern)
 * - Dynamic content based on context (city-specific vs all events)
 * - City-specific: Shows city image, "Events in [City]", back to cities navigation
 * - All events: Shows New York image, "All Events", "In all cities" subtitle
 * - Back navigation button with proper ARIA labeling
 * - Image error handling with fallback (MapPin icon)
 * - Responsive text sizing and overlay design
 * - Semantic header structure with proper heading hierarchy
 *
 * Design Patterns Applied:
 * - Strategy Pattern: Different content strategies based on city vs allEvents context
 * - Composition Pattern: Composes image background, overlay, text, and navigation button
 * - Template Method Pattern: Consistent header structure with variable content
 * - Event Handler Pattern: Handles back navigation and image error states
 * - Conditional Rendering Pattern: Different content based on context props
 *
 * SOLID Principles:
 * - SRP: Only handles events page header display and navigation
 * - OCP: Extensible via props for different contexts and navigation handlers
 * - LSP: Can substitute other header components with same interface
 * - ISP: Focused EventListHeaderProps interface for header display and navigation
 * - DIP: Depends on Button component and City type abstractions
 *
 * React 19 Patterns:
 * - Props Interface Pattern: Clear TypeScript interface with optional properties
 * - Conditional Rendering: Different content based on city vs allEvents props
 * - Event Handling: useCallback for optimized navigation handlers
 * - Performance Pattern: Optimized image loading and error handling
 * - Accessibility Pattern: Semantic header with proper ARIA labels and navigation
 *
 * Semantic HTML Structure:
 * - <header> element for page header semantics
 * - <h1> for main page title following proper hierarchy
 * - <p> for subtitle text with semantic structure
 * - Button with proper ARIA labels for navigation
 * - Image with alt text and lazy loading
 */

interface EventListHeaderProps {
  city?: City | undefined // When showing events for specific city
  allEvents?: boolean // When showing all events across cities
  onBack?: (() => void) | undefined
  className?: string
}

export const EventListHeader = ({
  city,
  allEvents = false,
  onBack,
  className = '',
}: EventListHeaderProps) => {
  const [imageError, setImageError] = useState(false)

  // Determine header content based on context
  const getHeaderContent = () => {
    if (allEvents) {
      // Use New York as representative image for all events
      // This assumes New York exists in cities data - fallback to generic if needed
      return {
        imageUrl:
          'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=400&fit=crop',
        alt: 'New York City skyline',
        title: 'All Events',
        subtitle: 'In all cities',
        backLabel: 'Back to Cities',
      }
    }

    if (city) {
      return {
        imageUrl: city.url,
        alt: city.alt,
        title: `Events in ${city.city}`,
        subtitle: `Discover what's happening in ${city.city}`,
        backLabel: 'Back to Cities',
      }
    }

    // Fallback content
    return {
      imageUrl: '',
      alt: 'Events',
      title: 'Events',
      subtitle: 'Discover local events',
      backLabel: 'Back',
    }
  }

  const headerContent = getHeaderContent()

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    }
  }, [onBack])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageError(false)
  }, [])

  return (
    <header className={`relative h-64 md:h-80 overflow-hidden ${className}`}>
      {/* Background Image */}
      {!imageError && headerContent.imageUrl ? (
        <img
          src={headerContent.imageUrl}
          alt={headerContent.alt}
          className="w-full h-full object-cover object-center"
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="eager" // Load immediately as it's above fold
        />
      ) : (
        // Fallback when image fails to load
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <MapPin className="h-16 w-16 text-muted-foreground" />
        </div>
      )}

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Header Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-6">
        {/* Back Navigation */}
        {onBack && (
          <div className="absolute top-6 left-6">
            <Button
              onClick={handleBack}
              variant="secondary"
              size="sm"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-white/20"
              aria-label={headerContent.backLabel}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {/* Title and Subtitle */}
        <div className="max-w-4xl">
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
            }}
          >
            {headerContent.title}
          </h1>

          <p
            className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {headerContent.subtitle}
          </p>
        </div>

        {/* City Indicator for City-Specific Context */}
        {city && (
          <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white/80">
            <MapPin className="h-5 w-5" />
            <span
              className="text-sm"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {city.city}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
