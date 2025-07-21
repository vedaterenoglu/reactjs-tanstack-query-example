import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * useScrollAnimation Hook - Reusable scroll-triggered animations
 *
 * Design Patterns Applied:
 * - Observer Pattern: Uses Intersection Observer to watch element visibility
 * - Custom Hook Pattern: Encapsulates scroll animation logic for reuse
 * - Performance Pattern: Uses useCallback for stable references
 *
 * SOLID Principles:
 * - SRP: Only handles scroll-triggered animation detection
 * - OCP: Extensible through options parameter
 * - DIP: Depends on browser's Intersection Observer API abstraction
 */

interface ScrollAnimationOptions {
  threshold?: number // Percentage of element visible to trigger (0-1)
  delay?: number // Delay before animation starts (ms)
  triggerOnce?: boolean // Whether to trigger only once or repeatedly
  rootMargin?: string // Root margin for intersection observer
}

interface ScrollAnimationReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>
  isVisible: boolean
  hasTriggered: boolean
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(options: ScrollAnimationOptions = {}): ScrollAnimationReturn<T> {
  const {
    threshold = 0.1,
    delay = 0,
    triggerOnce = true,
    rootMargin = '0px',
  } = options

  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries

      if (!entry) return

      if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
        if (delay > 0) {
          setTimeout(() => {
            setIsVisible(true)
            setHasTriggered(true)
          }, delay)
        } else {
          setIsVisible(true)
          setHasTriggered(true)
        }
      } else if (!triggerOnce && !entry.isIntersecting) {
        setIsVisible(false)
      }
    },
    [delay, triggerOnce, hasTriggered]
  )

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Check if Intersection Observer is supported
    if (!window.IntersectionObserver) {
      // Fallback: show immediately if not supported
      setIsVisible(true)
      setHasTriggered(true)
      return
    }

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    })

    observer.observe(element)

    return () => {
      observer.unobserve(element)
      observer.disconnect()
    }
  }, [handleIntersection, threshold, rootMargin])

  return {
    ref,
    isVisible,
    hasTriggered,
  }
}

/**
 * Hook for animating multiple elements with staggered delays
 */
interface StaggeredAnimationOptions extends ScrollAnimationOptions {
  staggerDelay?: number // Delay between each element (ms)
  totalElements?: number // Total number of elements for calculation
}

export function useStaggeredScrollAnimation<T extends HTMLElement = HTMLDivElement>(index: number, options: StaggeredAnimationOptions = {}): ScrollAnimationReturn<T> {
  const { staggerDelay = 100, ...restOptions } = options

  const calculatedDelay = (restOptions.delay || 0) + index * staggerDelay

  return useScrollAnimation<T>({
    ...restOptions,
    delay: calculatedDelay,
  })
}
