import { fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import type { Event } from '@/lib/types/event.types'
import { renderWithQuery } from '@/test/test-utils'

import { EventGrid } from '../EventGrid'

/**
 * EventGrid Component Test Suite
 * 
 * Tests the EventGrid component with TanStack Query integration
 * 
 * React 19 Patterns:
 * - Component Testing Pattern
 * - Event Handler Testing
 * - Accessibility Testing
 */

describe('EventGrid', () => {
  const mockEvents: Event[] = [
    {
      id: 1,
      name: 'Summer Music Festival',
      slug: 'summer-music-festival',
      city: 'Austin',
      citySlug: 'austin',
      location: 'Zilker Park',
      date: '2024-07-15T18:00:00Z',
      organizerName: 'Austin Events Co',
      imageUrl: 'https://example.com/festival.jpg',
      alt: 'Music festival stage',
      description: 'Annual summer music festival',
      price: 75,
    },
    {
      id: 2,
      name: 'Tech Conference 2024',
      slug: 'tech-conference-2024',
      city: 'Seattle',
      citySlug: 'seattle',
      location: 'Convention Center',
      date: '2024-09-20T09:00:00Z',
      organizerName: 'Tech Events Inc',
      imageUrl: 'https://example.com/tech.jpg',
      alt: 'Conference hall',
      description: 'Annual technology conference',
      price: 200,
    },
  ]

  const defaultProps = {
    events: mockEvents,
    hasResults: true,
    isLoading: false,
    onEventSelect: vi.fn(),
  }

  it('should render events grid', () => {
    renderWithQuery(<EventGrid {...defaultProps} />)

    expect(screen.getByText('Summer Music Festival')).toBeInTheDocument()
    expect(screen.getByText('Tech Conference 2024')).toBeInTheDocument()
  })

  it('should show empty state when no events', () => {
    renderWithQuery(
      <EventGrid 
        {...defaultProps} 
        events={[]} 
        hasResults={false} 
      />
    )

    expect(screen.getByText('No events available')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    renderWithQuery(
      <EventGrid 
        {...defaultProps} 
        isLoading={true} 
      />
    )

    // Should show skeleton loaders
    const skeletons = screen.getAllByTestId('event-skeleton')
    expect(skeletons).toHaveLength(6) // Default skeleton count
  })

  it('should call onEventSelect when clicking event card', () => {
    const onEventSelect = vi.fn()
    renderWithQuery(
      <EventGrid 
        {...defaultProps} 
        onEventSelect={onEventSelect} 
      />
    )

    const firstEvent = screen.getByText('Summer Music Festival')
    fireEvent.click(firstEvent)

    expect(onEventSelect).toHaveBeenCalledWith(mockEvents[0])
  })

  it('should show action button when enabled', () => {
    renderWithQuery(
      <EventGrid 
        {...defaultProps} 
        showActionButton={true} 
      />
    )

    const buttons = screen.getAllByText('View Details')
    expect(buttons).toHaveLength(2)
  })

  it('should display city context in header', () => {
    renderWithQuery(
      <EventGrid 
        {...defaultProps} 
        cityContext="Austin" 
      />
    )

    expect(screen.getByText('Events in Austin')).toBeInTheDocument()
  })

  it('should show search results info', () => {
    renderWithQuery(
      <EventGrid 
        {...defaultProps} 
        isSearchActive={true}
        searchQuery="music"
        filteredCount={1}
      />
    )

    expect(screen.getByText(/Found 1 event matching "music"/)).toBeInTheDocument()
  })

  it('should be accessible', () => {
    const { container } = renderWithQuery(<EventGrid {...defaultProps} />)

    // Check for proper ARIA attributes
    const grid = container.querySelector('[role="list"]')
    expect(grid).toBeInTheDocument()

    // Check event cards have proper structure
    const eventCards = screen.getAllByRole('listitem')
    expect(eventCards).toHaveLength(2)
  })

  it('should handle keyboard navigation', () => {
    const onEventSelect = vi.fn()
    renderWithQuery(
      <EventGrid 
        {...defaultProps} 
        onEventSelect={onEventSelect} 
      />
    )

    const firstCard = screen.getAllByRole('listitem')[0]
    
    // Focus the card
    firstCard.focus()
    expect(document.activeElement).toBe(firstCard)

    // Press Enter to select
    fireEvent.keyDown(firstCard, { key: 'Enter', code: 'Enter' })
    expect(onEventSelect).toHaveBeenCalledWith(mockEvents[0])
  })

  it('should apply custom className', () => {
    const { container } = renderWithQuery(
      <EventGrid 
        {...defaultProps} 
        className="custom-grid-class" 
      />
    )

    expect(container.firstChild).toHaveClass('custom-grid-class')
  })
})