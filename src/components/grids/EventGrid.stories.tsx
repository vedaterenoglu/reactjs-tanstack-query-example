/**
 * EventGrid.stories - Storybook stories for EventGrid component
 * 
 * Demonstrates EventGrid component with various grid states including
 * loading, search results, and different data configurations using
 * realistic event data and comprehensive controls.
 * 
 * Design Patterns Applied:
 * - Story Pattern: Multiple stories showcasing different grid states
 * - Mock Data Pattern: Uses first 8 production events for realistic demos
 * - State Variation Pattern: Shows loading, search, and normal grid states
 */

import type { Event } from '@/lib/types/event.types'
import { events } from '@/mock/events'

import { EventGrid } from './EventGrid'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Mock event data from production seed data
const mockEvents: Event[] = events.slice(0, 8) // Get first 8 events for stories

const meta = {
  title: 'Components/Grids/EventGrid',
  component: EventGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    events: { control: 'object' },
    hasResults: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isSearchActive: { control: 'boolean' },
    searchQuery: { control: 'text' },
    filteredCount: { control: 'number' },
    maxEvents: { control: 'number' },
    cityContext: { control: 'text' },
    onEventSelect: { action: 'event-selected' },
  },
  args: {
    events: mockEvents,
    hasResults: true,
  },
} satisfies Meta<typeof EventGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    events: mockEvents,
  },
}

export const AustinEvents: Story = {
  args: {
    events: mockEvents.filter(e => e.city === 'Austin'),
    cityContext: 'Austin',
  },
}

export const SeattleEvents: Story = {
  args: {
    events: mockEvents.filter(e => e.city === 'Seattle'),
    cityContext: 'Seattle',
  },
}

export const SearchResults: Story = {
  args: {
    events: mockEvents.filter(
      e =>
        e.name.toLowerCase().includes('dj') ||
        e.name.toLowerCase().includes('music')
    ),
    isSearchActive: true,
    searchQuery: 'music',
    filteredCount: mockEvents.filter(
      e =>
        e.name.toLowerCase().includes('dj') ||
        e.name.toLowerCase().includes('music')
    ).length,
  },
}

export const Loading: Story = {
  args: {
    events: mockEvents,
    isLoading: true,
  },
}

export const CustomGrid: Story = {
  args: {
    events: mockEvents,
    gridClasses: 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  },
}

export const WithLoadMore: Story = {
  args: {
    events: mockEvents,
    maxEvents: 2,
    filteredCount: 10,
  },
}
