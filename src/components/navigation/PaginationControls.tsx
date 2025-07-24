/**
 * PaginationControls - Navigation controls for paginated content
 * Provides previous/next buttons with Redux state management integration
 */

import { useCallback, useEffect } from 'react'

import { useEventPagination } from '@/lib/hooks/useEvents'

/**
 * Pagination Controls Component - Traditional React + Redux Pattern
 *
 * Design Patterns Applied:
 * 1. **Component Composition Pattern**: Composed of smaller button/info components
 * 2. **Observer Pattern**: Subscribes to Redux state via useSelector hooks
 * 3. **Command Pattern**: Button clicks dispatch action commands
 * 4. **Custom Hook Pattern**: Logic extracted into reusable usePagination hook
 * 5. **Accessibility Pattern**: ARIA labels and keyboard navigation support
 *
 * SOLID Principles:
 * - **SRP**: Only handles pagination UI and user interactions
 * - **OCP**: Can extend with jump-to-page without modifying existing code
 * - **LSP**: Implements standard component interface
 * - **ISP**: Focused interface for pagination controls only
 * - **DIP**: Depends on Redux selector/thunk abstractions
 *
 * React 19 Patterns:
 * - Custom hooks for stateful logic extraction
 * - Compound component pattern for button grouping
 * - Memoized callbacks for performance
 * - Accessibility-first design with ARIA attributes
 */

interface PaginationControlsProps {
  /**
   * Additional CSS classes for styling
   */
  className?: string
  /**
   * Show pagination info (e.g., "Page 1 of 5")
   */
  showInfo?: boolean
  /**
   * Mobile-optimized layout
   */
  variant?: 'desktop' | 'mobile'
  /**
   * Called when page changes (for scroll-to-top, etc.)
   */
  onPageChange?: (page: number) => void
}

/**
 * Custom hook for pagination logic - follows Single Responsibility Principle
 * Extracts all pagination state and actions into reusable hook
 */
function usePagination(onPageChange?: (page: number) => void) {
  const {
    pagination,
    currentPage,
    totalPages,
    hasMore,
    isLoading,
    goToPage,
  } = useEventPagination()

  const canGoPrevious = currentPage > 1
  const canGoNext = hasMore
  const isChanging = isLoading

  const paginationInfo = {
    currentPage,
    totalPages,
    startItem: pagination.offset + 1,
    endItem: Math.min(pagination.offset + pagination.limit, pagination.total),
  }

  // Memoized action dispatchers
  const handlePreviousPage = useCallback(async () => {
    if (canGoPrevious && !isChanging) {
      const previousPage = currentPage - 1
      goToPage(previousPage)
      if (onPageChange) {
        onPageChange(previousPage)
      }
    }
  }, [canGoPrevious, isChanging, onPageChange, currentPage, goToPage])

  const handleNextPage = useCallback(async () => {
    if (canGoNext && !isChanging) {
      const nextPage = currentPage + 1
      goToPage(nextPage)
      if (onPageChange) {
        onPageChange(nextPage)
      }
    }
  }, [canGoNext, isChanging, onPageChange, currentPage, goToPage])

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle if not typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          void handlePreviousPage()
          break
        case 'ArrowRight':
          event.preventDefault()
          void handleNextPage()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handlePreviousPage, handleNextPage])

  return {
    currentPage,
    totalPages,
    canGoPrevious,
    canGoNext,
    isChanging,
    paginationInfo,
    handlePreviousPage,
    handleNextPage,
  }
}

/**
 * Previous Button Component - Follows Component Composition Pattern
 */
interface PaginationButtonProps {
  onClick: () => void
  disabled: boolean
  isLoading: boolean
  children: React.ReactNode
  ariaLabel: string
  variant: 'desktop' | 'mobile'
}

function PaginationButton({
  onClick,
  disabled,
  isLoading,
  children,
  ariaLabel,
  variant,
}: PaginationButtonProps) {
  const baseClasses =
    variant === 'mobile'
      ? 'min-h-[44px] w-24 px-3 py-2 text-sm font-medium' // More compact mobile with fixed width
      : 'min-h-[36px] w-20 px-3 py-1.5 text-xs font-medium' // Smaller desktop size with fixed width

  const stateClasses = disabled
    ? 'bg-gray-50/70 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200/60 dark:border-gray-700/50'
    : `bg-gradient-to-r from-gray-50 to-gray-100/80 dark:from-gray-800 dark:to-gray-700/90 
       text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-600/50
       hover:from-gray-100 hover:to-gray-200/90 dark:hover:from-gray-700 dark:hover:to-gray-600/90
       hover:text-gray-800 dark:hover:text-gray-100 hover:border-gray-300/90 dark:hover:border-gray-500/70
       hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/20
       hover:-translate-y-0.5 focus:-translate-y-0.5 active:translate-y-0
       focus:from-gray-100 focus:to-gray-200/90 dark:focus:from-gray-700 dark:focus:to-gray-600/90`

  const loadingClasses = isLoading
    ? 'opacity-70 pointer-events-none animate-pulse'
    : ''

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      className={`
        ${baseClasses}
        ${stateClasses}
        ${loadingClasses}
        border rounded-xl backdrop-blur-sm
        focus:outline-none focus:ring-2 focus:ring-blue-400/50 dark:focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-white/50 dark:focus:ring-offset-gray-900/50
        transition-all duration-300 ease-out
        flex items-center justify-center gap-1
        select-none shadow-sm shadow-gray-200/40 dark:shadow-gray-900/20
        relative overflow-hidden group
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      {isLoading ? (
        <div className="animate-spin h-4 w-4 border-2 border-gray-400/60 dark:border-gray-500/60 border-t-gray-600 dark:border-t-gray-300 rounded-full" />
      ) : (
        children
      )}
    </button>
  )
}

/**
 * Pagination Info Component - Shows current page status
 */
interface PaginationInfoProps {
  paginationInfo: {
    currentPage: number
    totalPages: number
    startItem: number
    endItem: number
  }
  variant: 'desktop' | 'mobile'
}

function PaginationInfo({ paginationInfo, variant }: PaginationInfoProps) {
  const textSize = variant === 'mobile' ? 'text-base' : 'text-sm'

  return (
    <div
      className={`${textSize} text-gray-600 font-medium flex items-center`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Pagination status: </span>
      Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
    </div>
  )
}

/**
 * Main Pagination Controls Component
 * Implements accessibility, mobile optimization, and keyboard navigation
 */
export function PaginationControls({
  className = '',
  showInfo = true,
  variant = 'desktop',
  onPageChange,
}: PaginationControlsProps) {
  const {
    currentPage,
    totalPages,
    canGoPrevious,
    canGoNext,
    isChanging,
    paginationInfo,
    handlePreviousPage,
    handleNextPage,
  } = usePagination(onPageChange)

  // Don't render if no pages
  if (totalPages <= 1) {
    return null
  }

  const containerClasses =
    variant === 'mobile'
      ? 'flex flex-col items-center gap-4 py-6' // Mobile: vertical layout
      : 'flex items-center justify-between gap-4 py-4' // Desktop: horizontal layout

  return (
    <nav
      className={`${containerClasses} ${className}`}
      role="navigation"
      aria-label="Events pagination"
    >
      {/* Previous Button */}
      <PaginationButton
        onClick={handlePreviousPage}
        disabled={!canGoPrevious}
        isLoading={isChanging}
        ariaLabel={`Go to previous page (page ${currentPage - 1})`}
        variant={variant}
      >
        <svg
          className="w-3 h-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span>Previous</span>
      </PaginationButton>

      {/* Pagination Info */}
      {showInfo && (
        <PaginationInfo paginationInfo={paginationInfo} variant={variant} />
      )}

      {/* Next Button */}
      <PaginationButton
        onClick={handleNextPage}
        disabled={!canGoNext}
        isLoading={isChanging}
        ariaLabel={`Go to next page (page ${currentPage + 1})`}
        variant={variant}
      >
        <span>Next</span>
        <svg
          className="w-3 h-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </PaginationButton>
    </nav>
  )
}

/**
 * Mobile-optimized pagination controls with touch gestures
 * Extends base PaginationControls with swipe support
 */
export function MobilePaginationControls(props: PaginationControlsProps) {
  const pagination = usePagination(props.onPageChange)

  // Touch gesture support
  useEffect(() => {
    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (touch) {
        touchStartX = touch.screenX
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (touch) {
        touchEndX = touch.screenX
        handleSwipeGesture()
      }
    }

    const handleSwipeGesture = () => {
      const swipeThreshold = 50
      const swipeDistance = touchEndX - touchStartX

      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0 && pagination.canGoPrevious) {
          // Swipe right - go to previous page
          void pagination.handlePreviousPage()
        } else if (swipeDistance < 0 && pagination.canGoNext) {
          // Swipe left - go to next page
          void pagination.handleNextPage()
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pagination])

  return <PaginationControls {...props} variant="mobile" />
}

export default PaginationControls
