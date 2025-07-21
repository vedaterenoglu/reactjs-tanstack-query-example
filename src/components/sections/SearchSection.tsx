import { SearchBox } from '@/components/search'

/**
 * SearchSection Component - Semantic search section wrapper with accessibility features
 * 
 * Current Features:
 * - Semantic <section> element with proper ARIA labeling
 * - Hidden <h2> heading for screen reader navigation (aria-labelledby)
 * - Centered layout with max-width constraint (max-w-2xl mx-auto)
 * - Configurable props passed through to SearchBox component
 * - Default responsive margins (mb-8 className)
 * 
 * Design Patterns Applied:
 * - Container/Presentational Pattern: Pure layout component wrapping SearchBox
 * - Composition Pattern: Composes semantic section with SearchBox
 * - Proxy Pattern: Passes all SearchBox configuration props through
 * - Dependency Injection Pattern: Receives handlers via props (onRefresh callback)
 * 
 * SOLID Principles:
 * - SRP: Only handles search section semantic structure and layout styling
 * - OCP: Extensible through comprehensive SearchSectionProps (all SearchBox options)
 * - LSP: Can substitute other search section layouts with same interface
 * - ISP: Focused interface mirroring SearchBox props for search configuration
 * - DIP: Depends on SearchBox component abstraction, not implementation
 * 
 * React 19 Patterns:
 * - Props Interface Pattern: SearchSectionProps with optional configuration
 * - Performance Pattern: Lightweight wrapper with minimal rendering overhead
 * - Composition Pattern: Reusable semantic search section layout
 * - Accessibility Pattern: Semantic <section> with hidden heading for screen readers
 * - Props Forwarding: Cleanly forwards all SearchBox props
 * 
 * Semantic HTML Structure:
 * - <section> with aria-labelledby pointing to hidden heading
 * - <h2> with "Search Destinations" text and sr-only class
 * - Proper heading hierarchy within page structure
 * - Screen reader accessible section identification
 */

interface SearchSectionProps {
  onRefresh?: (() => void) | undefined
  placeholder?: string
  className?: string
  showRefreshButton?: boolean
  debounceMs?: number
  autoFocus?: boolean
  disabled?: boolean
}

export const SearchSection = ({
  onRefresh,
  placeholder = "Search for your city...",
  className = "mb-8",
  showRefreshButton = true,
  debounceMs = 300,
  autoFocus = false,
  disabled = false
}: SearchSectionProps) => {
  return (
    <section className={className} aria-labelledby="search-heading">
      <h2 id="search-heading" className="sr-only">
        Search Cities
      </h2>
      <div className="max-w-2xl mx-auto">
        <SearchBox
          placeholder={placeholder}
          onRefresh={onRefresh}
          debounceMs={debounceMs}
          autoFocus={autoFocus}
          disabled={disabled}
          showRefreshButton={showRefreshButton}
        />
      </div>
    </section>
  )
}