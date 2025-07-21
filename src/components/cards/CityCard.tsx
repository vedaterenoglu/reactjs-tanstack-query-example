import { MapPin, Check } from 'lucide-react'
import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useCitySelection } from '@/lib/hooks'
import type { City } from '@/lib/types/city.types'

/**
 * CityCard Component - Interactive city destination card with image overlay and selection
 * 
 * Current Features:
 * - Semantic <article> element for proper content structure
 * - City image with lazy loading and error fallback (MapPin icon)
 * - Text overlay with transparent black background for city name
 * - Hover animations (scale, overlay effects) with disabled state support
 * - Selection state management via useCitySelection hook
 * - Interactive select button with hover effects (green text on hover)
 * - Loading state display with spinner and "Updating..." message
 * - Selection indicator with checkmark when city is selected
 * - Compact/default variants for different layout needs
 * - Full accessibility support with ARIA labels and proper semantics
 * 
 * Design Patterns Applied:
 * - Composition Pattern: Composes article, img, Button, icons within card layout
 * - Observer Pattern: Observes selection state via useCitySelection hook
 * - Strategy Pattern: Different rendering based on hover, selection, loading, error states
 * - Event Handler Pattern: Handles mouse events, image loading, selection clicks
 * - Error Boundary Ready: Graceful image error handling with fallback display
 * 
 * SOLID Principles:
 * - SRP: Handles city card display, selection interactions, and visual state management
 * - OCP: Extensible via props (variant, showSelectButton, disabled, className, onSelect)
 * - LSP: Can substitute other card implementations with same interface
 * - ISP: Focused CityCardProps interface for city display and selection
 * - DIP: Depends on useCitySelection hook and Button/Icon component abstractions
 * 
 * Semantic HTML Structure:
 * - Uses semantic <article> element instead of div
 * - Proper <img> with alt text and lazy loading
 * - Button elements for interactive actions
 * - <h3> for city name with proper text shadow for readability
 * - ARIA labels for screen reader accessibility
 */

interface CityCardProps {
  city: City
  onSelect?: ((city: City) => void) | undefined
  className?: string
  showSelectButton?: boolean
  disabled?: boolean
  variant?: 'default' | 'compact'
}

export const CityCard = ({
  city,
  onSelect,
  className = '',
  showSelectButton = true,
  disabled = false,
  variant = 'default',
}: CityCardProps) => {
  // Custom hook integration
  const { selectedCity, selectCity, isLoading } = useCitySelection()
  
  // Local state for hover animations
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Check if this city is currently selected
  const isSelected = selectedCity?.citySlug === city.citySlug
  
  // Determine if select button should be visible (hover or selected state)
  const showButton = showSelectButton && (isHovered || isSelected)
  
  // Event handlers
  const handleSelectClick = useCallback(() => {
    if (disabled || isLoading) return
    
    try {
      selectCity(city.citySlug)
      onSelect?.(city)
    } catch (error) {
      console.error('Failed to select city:', error)
    }
  }, [city, selectCity, onSelect, disabled, isLoading])

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

  const cardHeight = variant === 'compact' ? 'h-48' : 'h-64'

  return (
    <article
      className={`
        group relative overflow-hidden rounded-lg shadow-sm transition-all duration-300
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${cardHeight}
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`City destination: ${city.city}`}
    >
      {/* Background Image */}
      {!imageError ? (
        <img
          src={city.url}
          alt={city.alt}
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
        // Fallback when image fails to load
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Hover Overlay */}
      <div 
        className={`
          absolute inset-0 bg-black/20 transition-opacity duration-300
          ${isHovered && !disabled ? 'opacity-100' : 'opacity-0'}
        `} 
      />

      {/* City Name - Positioned over image like Boston reference */}
      <div className="absolute bottom-2 left-4 right-4 z-10 bg-black/60 rounded px-2 py-1">
        <div className="flex items-end justify-between">
          <h3 
            className={`
              font-semibold text-white truncate
              ${variant === 'compact' ? 'text-sm' : 'text-base'}
            `}
            style={{
              textShadow: '1px 1px 3px rgba(0,0,0,0.9)'
            }}
          >
            {city.city}
          </h3>

          {/* Selection Indicator */}
          {isSelected && (
            <div 
              className="flex-shrink-0 ml-2"
              aria-label="Selected"
            >
              <Check className="h-5 w-5 text-white" style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }} />
            </div>
          )}
        </div>

        {/* Loading State Indicator */}
        {isLoading && (
          <div className="mt-1 flex items-center gap-2 text-xs text-white/90">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}>Updating...</span>
          </div>
        )}
      </div>

      {/* Select Button - Centered on hover */}
      {showSelectButton && (
        <div 
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20
            transition-all duration-300 ease-out
            ${showButton ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
          `}
        >
          <Button
            onClick={handleSelectClick}
            disabled={disabled || isLoading}
            variant="ghost"
            size="sm"
            className={`
              shadow-lg backdrop-blur-sm min-h-[44px] min-w-[88px]
              bg-black/60 text-white hover:bg-black/70 hover:text-green-500
              transform transition-all duration-200
              ${isHovered ? 'hover:scale-110' : ''}
            `}
            aria-label={isSelected ? `${city.city} selected` : `Select ${city.city}`}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isSelected ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Selected
              </>
            ) : (
              'Select'
            )}
          </Button>
        </div>
      )}
    </article>
  )
}