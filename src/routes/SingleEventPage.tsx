import { ArrowLeft, Calendar, Clock, MapPin, User, DollarSign } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { StateFrame } from '@/components/frames'
import { Button } from '@/components/ui/button'
import { useSingleEvent } from '@/lib/hooks/useSingleEvent'

/**
 * SingleEventPage Component - Displays detailed view of a single event
 *
 * Design Patterns Applied:
 * 1. **Container/Presentational Pattern**: This is a container component that:
 *    - Handles data fetching through useSingleEvent hook
 *    - Manages loading, error, and data states
 *    - Delegates presentation to semantic HTML structure
 *
 * 2. **Custom Hook Pattern**: Uses useSingleEvent for data fetching abstraction
 *
 * 3. **Template Method Pattern**: Follows existing page structure patterns
 *
 * 4. **Error Boundary Pattern**: Implements error handling with retry capability
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for orchestrating single event display
 * - **OCP**: Extensible through composition and props
 * - **LSP**: Can be substituted with other page components
 * - **ISP**: Minimal interface, focused on single event display
 * - **DIP**: Depends on abstractions (useSingleEvent hook, Event type, UI components)
 *
 * React 19 Patterns:
 * - Suspense-ready with loading states
 * - Error boundaries with graceful degradation
 * - Proper semantic HTML structure
 * - Custom hook integration for data management
 */

export const SingleEventPage = () => {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  
  // Custom hook integration following DIP and Facade patterns
  const { event, isLoading, error, retry } = useSingleEvent(slug)

  // Memoized formatting operations for performance
  const formattedPrice = useMemo(() => {
    if (!event) return ''
    return event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`
  }, [event])

  const formattedDate = useMemo(() => {
    if (!event) return ''
    const date = new Date(event.date)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [event])

  const formattedTime = useMemo(() => {
    if (!event) return ''
    const date = new Date(event.date)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }, [event])

  // Event handlers following Performance Pattern
  const handleBackClick = useCallback(() => {
    void navigate(-1) // Go back to previous page
  }, [navigate])

  const handleRetry = useCallback(() => {
    retry()
  }, [retry])

  // Early return for invalid slug
  if (!slug) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">Invalid event URL</p>
          <Button onClick={handleBackClick} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button
          onClick={handleBackClick}
          variant="ghost"
          className="hover:bg-muted"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>

      <StateFrame
        error={error}
        onRetry={handleRetry}
        errorTitle="Unable to Load Event"
        isLoading={isLoading && !event}
        hasData={!!event}
        loadingTitle="Loading Event Details"
        loadingMessage="Fetching event information..."
        isEmpty={false} // Single event pages don't have empty states
        onRefresh={handleRetry}
      >
        {event && (
          <article className="max-w-4xl mx-auto">
            {/* Hero Image Section */}
            <div className="relative mb-8 rounded-lg overflow-hidden shadow-lg">
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

            {/* Event Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Title */}
                <header>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {event.name}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    {event.city}
                  </p>
                </header>

                {/* Event Description */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">About This Event</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </section>
              </div>

              {/* Event Details Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-muted/50 rounded-lg p-6 space-y-4 sticky top-8">
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
                      <p className="text-2xl font-bold text-primary">
                        {formattedPrice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}
      </StateFrame>
    </div>
  )
}