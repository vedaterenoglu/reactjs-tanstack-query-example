import type { Event } from '@/lib/types/event.types'

/**
 * EventHeader Component - Displays event title and city in semantic header structure
 *
 * Design Patterns Applied:
 * 1. **Presentational Component Pattern**: Pure UI component for header display
 * 2. **Single Responsibility Pattern**: Only handles event title and city presentation
 * 3. **Semantic HTML Pattern**: Uses proper header elements for accessibility
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for displaying event header information
 * - **OCP**: Extensible through additional props without modification
 * - **LSP**: Can be substituted with other header components
 * - **ISP**: Minimal interface focused on header display needs
 * - **DIP**: Depends on Event interface abstraction
 *
 * React 19 Patterns:
 * - Semantic HTML with proper heading hierarchy
 * - Responsive typography scaling
 * - Accessible header structure
 */

interface EventHeaderProps {
  /** Event data containing name and city information */
  event: Pick<Event, 'name' | 'city'>
  /** Additional CSS classes for customization */
  className?: string
}

export const EventHeader = ({ event, className = '' }: EventHeaderProps) => {
  return (
    <header className={className}>
      <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.name}</h1>
      <p className="text-xl text-muted-foreground">{event.city}</p>
    </header>
  )
}
