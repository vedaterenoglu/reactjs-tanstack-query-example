import { StateFrame } from './StateFrame'

/**
 * EventsStateFrame Component - Specialized wrapper around StateFrame for events
 *
 * Design Patterns Applied:
 * 1. **Wrapper Pattern**: Wraps StateFrame with events-specific configuration
 * 2. **Adapter Pattern**: Adapts generic StateFrame for events domain
 * 3. **Facade Pattern**: Provides simplified interface for events state management
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for events-specific state frame configuration
 * - **OCP**: Extensible through additional events-specific props
 * - **LSP**: Can substitute StateFrame in events contexts
 * - **ISP**: Events-focused interface extending StateFrameProps
 * - **DIP**: Depends on StateFrame abstraction
 *
 * React 19 Patterns:
 * - Props forwarding pattern for clean interface
 * - Composition over inheritance
 * - Single responsibility component
 */

interface EventsStateFrameProps {
  error?: string | null
  onRetry?: (() => void) | undefined
  errorTitle?: string
  isLoading?: boolean
  hasData?: boolean
  loadingTitle?: string
  loadingMessage?: string
  isEmpty?: boolean
  isSearchActive?: boolean
  searchQuery?: string
  onRefresh?: (() => void) | undefined
  children?: React.ReactNode
  className?: string
}

export const EventsStateFrame = ({
  error,
  onRetry,
  errorTitle = 'Unable to Load Events',
  isLoading = false,
  hasData = false,
  loadingTitle = 'Loading Events',
  loadingMessage = 'Fetching available events for you...',
  isEmpty = false,
  isSearchActive = false,
  searchQuery = '',
  onRefresh,
  children,
  className = '',
}: EventsStateFrameProps) => {
  // Delegate to StateFrame with events-specific defaults
  return (
    <StateFrame
      error={error || null}
      onRetry={onRetry}
      errorTitle={errorTitle}
      isLoading={isLoading}
      hasData={hasData}
      loadingTitle={loadingTitle}
      loadingMessage={loadingMessage}
      isEmpty={isEmpty}
      isSearchActive={isSearchActive}
      searchQuery={searchQuery}
      onRefresh={onRefresh}
      entityType="events"
      className={className}
    >
      {children}
    </StateFrame>
  )
}
