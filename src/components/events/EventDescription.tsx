import type { Event } from '@/lib/types/event.types'

/**
 * EventDescription Component - Displays formatted event description content
 *
 * Design Patterns Applied:
 * 1. **Presentational Component Pattern**: Pure UI component for description display
 * 2. **Single Responsibility Pattern**: Only handles event description presentation
 * 3. **Semantic HTML Pattern**: Uses proper section element for content structure
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for displaying event description with proper formatting
 * - **OCP**: Extensible through additional props without modification
 * - **LSP**: Can be substituted with other description components
 * - **ISP**: Minimal interface focused on description display needs
 * - **DIP**: Depends on Event interface abstraction
 *
 * React 19 Patterns:
 * - Semantic HTML with proper content sections
 * - Preserved whitespace formatting for user content
 * - Accessible content structure with proper heading hierarchy
 */

interface EventDescriptionProps {
  /** Event data containing description information */
  event: Pick<Event, 'description'>
  /** Additional CSS classes for customization */
  className?: string
}

export const EventDescription = ({
  event,
  className = '',
}: EventDescriptionProps) => {
  return (
    <section className={className}>
      <h2 className="text-xl font-semibold mb-3">About This Event</h2>
      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {event.description}
      </p>
    </section>
  )
}
