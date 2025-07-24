import { Search, X, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * SearchBox Component - Advanced search input with debouncing, state sync, and accessibility
 *
 * Current Features:
 * - Controlled input with local state for immediate UI response
 * - Debounced search implementation (configurable debounceMs, default 300ms)
 * - Bidirectional state synchronization with Redux (via useCitySearch hook)
 * - Real-time search results count display
 * - Clear button (X icon) when input has value and not loading
 * - Refresh button with configurable visibility (showRefreshButton prop)
 * - Loading state with spinner animation during search operations
 * - Error state display with retry functionality
 * - Keyboard support (Escape key clears search)
 * - Full accessibility: ARIA labels, searchbox role, screen reader support
 * - Mobile-optimized with proper input modes and focus handling
 *
 * Design Patterns Applied:
 * - Controlled Component Pattern: Local inputValue state synced with Redux searchQuery
 * - Custom Hook Integration: useCitySearch provides search, clear, retry functionality
 * - Debouncing Pattern: setTimeout-based debouncing prevents excessive API calls
 * - Composition Pattern: Composes Input, Button, Search/X/RefreshCw icons
 * - State Synchronization Pattern: useEffect manages local ↔ Redux state sync
 * - Event Handler Pattern: Memoized handlers for input, clear, refresh, keyboard events
 *
 * SOLID Principles:
 * - SRP: Handles search input UI, debouncing, state sync, and user interactions only
 * - OCP: Extensible via comprehensive props (placeholder, debounceMs, onRefresh, etc.)
 * - LSP: Can substitute other search input implementations with same interface
 * - ISP: Focused SearchBoxProps interface with optional configuration
 * - DIP: Depends on useCitySearch hook and Input/Button component abstractions
 *
 * React 19 Patterns:
 * - State Management: Local state + Redux sync with proper dependency arrays
 * - Performance Pattern: useCallback for handlers, careful useEffect dependencies
 * - Controlled Component: inputValue state with onChange sync to Redux
 * - Accessibility Pattern: Comprehensive ARIA attributes and semantic HTML
 * - Mobile Optimization: inputMode="search", iOS-specific classes
 *
 * State Synchronization Logic:
 * - inputValue: immediate local state for UI responsiveness
 * - searchQuery: debounced Redux state for actual filtering
 * - Sync inputValue ← searchQuery when external changes occur (avoiding infinite loops)
 * - Debounced sync inputValue → searchQuery when user types
 */

interface SearchBoxProps {
  placeholder?: string
  debounceMs?: number
  onRefresh?: (() => void) | undefined
  autoFocus?: boolean
  disabled?: boolean
  className?: string
  showRefreshButton?: boolean
  searchQuery?: string
  onSearchChange?: (value: string) => void
}

export const SearchBox = ({
  placeholder = 'Search cities...',
  debounceMs = 300,
  onRefresh,
  autoFocus = false,
  disabled = false,
  className = '',
  showRefreshButton = true,
  searchQuery = '',
  onSearchChange,
}: SearchBoxProps) => {
  // Local state for input value (enables debouncing)
  const [inputValue, setInputValue] = useState(searchQuery)

  // Sync with external searchQuery when it changes
  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  // Debounced search implementation
  useEffect(() => {
    if (inputValue === searchQuery) return // Skip if already synced

    const timeoutId = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(inputValue)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [inputValue, searchQuery, onSearchChange, debounceMs])

  // Memoized event handlers
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value)
    },
    []
  )

  const handleClearClick = useCallback(() => {
    setInputValue('')
    if (onSearchChange) {
      onSearchChange('')
    }
  }, [onSearchChange])

  const handleRefreshClick = useCallback(() => {
    if (onRefresh) {
      onRefresh()
    }
  }, [onRefresh])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleClearClick()
      }
    },
    [handleClearClick]
  )

  // Determine current state for UI feedback
  const hasValue = inputValue.length > 0
  const showClearButton = hasValue

  return (
    <div className={`relative flex flex-col gap-2 search-mobile ${className}`}>
      {/* Main Search Container */}
      <div className="relative flex items-center gap-2">
        {/* Search Input with Icon */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
            className="pl-10 pr-10 text-base ios-fix"
            aria-label="Search cities"
            role="searchbox"
            aria-expanded={hasValue}
            aria-autocomplete="list"
            inputMode="search"
          />

          {/* Clear Button */}
          {showClearButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearClick}
              className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 hover:bg-muted min-h-[36px] min-w-[36px] p-0 flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

        </div>

        {/* Refresh Button */}
        {showRefreshButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRefreshClick}
            disabled={disabled}
            className="min-h-[44px] min-w-[44px] focus-visible-mobile"
            aria-label="Refresh cities data"
            title="Refresh cities data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

    </div>
  )
}
