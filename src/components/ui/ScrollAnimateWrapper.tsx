import { forwardRef, type ReactNode } from 'react'

import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation'

/**
 * ScrollAnimateWrapper Component - Reusable scroll-triggered animation wrapper
 *
 * Design Patterns Applied:
 * - Wrapper Pattern: Wraps child components with animation behavior
 * - Composition Pattern: Composed with custom hook and CSS classes
 * - Forward Ref Pattern: Allows parent components to access DOM element
 *
 * SOLID Principles:
 * - SRP: Only handles wrapping elements with scroll animations
 * - OCP: Extensible through animation types and options
 * - DIP: Depends on useScrollAnimation hook abstraction
 */

export type AnimationType =
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'scale'
  | 'bounce'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'

interface ScrollAnimateWrapperProps {
  children: ReactNode
  animation?: AnimationType
  delay?: number
  duration?: number
  threshold?: number
  triggerOnce?: boolean
  className?: string
  style?: React.CSSProperties
  rootMargin?: string
}

export const ScrollAnimateWrapper = forwardRef<
  HTMLDivElement,
  ScrollAnimateWrapperProps
>(
  (
    {
      children,
      animation = 'fadeUp',
      delay = 0,
      duration = 600,
      threshold = 0.1,
      triggerOnce = true,
      className = '',
      style = {},
      rootMargin = '0px',
    },
    forwardedRef
  ) => {
    const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
      threshold,
      delay,
      triggerOnce,
      rootMargin,
    })

    // Merge refs if both are provided
    const elementRef = forwardedRef || ref

    const animationClass = `scroll-animate-${animation}`
    const visibilityClass = isVisible
      ? 'scroll-animate-visible'
      : 'scroll-animate-hidden'

    const combinedClassName =
      `scroll-animate ${animationClass} ${visibilityClass} ${className}`.trim()

    const combinedStyle = {
      '--animation-duration': `${duration}ms`,
      '--animation-delay': `${delay}ms`,
      ...style,
    } as React.CSSProperties

    return (
      <div ref={elementRef} className={combinedClassName} style={combinedStyle}>
        {children}
      </div>
    )
  }
)

ScrollAnimateWrapper.displayName = 'ScrollAnimateWrapper'

/**
 * Staggered Animation Wrapper - For animating lists with delays
 */
interface StaggeredScrollAnimateWrapperProps
  extends Omit<ScrollAnimateWrapperProps, 'delay'> {
  index: number
  staggerDelay?: number
  baseDelay?: number
}

export const StaggeredScrollAnimateWrapper = forwardRef<
  HTMLDivElement,
  StaggeredScrollAnimateWrapperProps
>(({ index, staggerDelay = 100, baseDelay = 0, ...props }, ref) => {
  const calculatedDelay = baseDelay + index * staggerDelay

  return <ScrollAnimateWrapper {...props} delay={calculatedDelay} ref={ref} />
})

StaggeredScrollAnimateWrapper.displayName = 'StaggeredScrollAnimateWrapper'
