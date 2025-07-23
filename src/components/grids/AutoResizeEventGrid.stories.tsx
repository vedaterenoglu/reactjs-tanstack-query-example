import { events } from '@/mock/events'

import { AutoResizeEventGrid } from './AutoResizeEventGrid'

import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * AutoResizeEventGrid Storybook Stories
 *
 * Design Patterns Applied:
 * 1. **Story Pattern**: Interactive documentation for component behavior
 * 2. **Mock Data Pattern**: Uses production-like event data for realistic testing
 * 3. **Configuration Pattern**: Multiple story variants demonstrating different use cases
 *
 * SOLID Principles:
 * - **SRP**: Each story demonstrates a specific AutoResizeEventGrid scenario
 * - **OCP**: Extensible story structure for additional grid configurations
 * - **DIP**: Depends on mock event data abstractions
 *
 * React 19 Patterns:
 * - **Component Documentation**: Interactive examples with real-time controls
 * - **Performance Testing**: Various event counts to test grid performance
 * - **Responsive Testing**: Stories demonstrate auto-resize behavior
 */

// Use a subset of events for better story performance
const mockEvents = events.slice(0, 12)
const manyEvents = events.slice(0, 24)
const fewEvents = events.slice(0, 3)

const meta = {
  title: 'Components/Grids/AutoResizeEventGrid',
  component: AutoResizeEventGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
AutoResizeEventGrid is a responsive grid component that automatically adjusts column count and card sizes based on available space.

Key Features:
- **Auto-resizing columns**: Uses CSS Grid auto-fit for responsive layout
- **3:2 aspect ratio**: Maintains proper image proportions
- **Responsive card sizes**: 280px (compact) to 400px (default)
- **Semantic HTML**: Proper grid roles and accessibility
- **Performance optimized**: Efficient layout calculations with auto-rows-fr

Perfect for displaying event cards that need to adapt to different container sizes while maintaining visual consistency.
        `,
      },
    },
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
    showActionButton: { control: 'boolean' },
    cityContext: { control: 'text' },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
    onEventSelect: { action: 'event-selected' },
  },
  args: {
    events: mockEvents,
    hasResults: true,
    isLoading: false,
    isSearchActive: false,
    searchQuery: '',
    filteredCount: mockEvents.length,
    showActionButton: true,
    variant: 'default',
  },
} satisfies Meta<typeof AutoResizeEventGrid>

export default meta
type Story = StoryObj<typeof meta>

// Default auto-resizing grid with standard events
export const Default: Story = {
  args: {
    events: mockEvents,
  },
}

// Compact variant with smaller cards
export const Compact: Story = {
  args: {
    events: mockEvents,
    variant: 'compact',
  },
}

// Many events to demonstrate auto-resizing with larger datasets
export const ManyEvents: Story = {
  args: {
    events: manyEvents,
    filteredCount: manyEvents.length,
  },
}

// Few events to show grid behavior with minimal content
export const FewEvents: Story = {
  args: {
    events: fewEvents,
    filteredCount: fewEvents.length,
  },
}

// Loading state demonstration
export const Loading: Story = {
  args: {
    events: mockEvents,
    isLoading: true,
  },
}

// Search results state
export const SearchResults: Story = {
  args: {
    events: events
      .filter(
        event =>
          event.name.toLowerCase().includes('tech') ||
          event.description.toLowerCase().includes('tech')
      )
      .slice(0, 8),
    isSearchActive: true,
    searchQuery: 'tech',
    filteredCount: 15, // Simulated total results
  },
}

// City context demonstration
export const CityContext: Story = {
  args: {
    events: events.filter(event => event.city === 'Seattle').slice(0, 6),
    cityContext: 'Seattle',
    filteredCount: 8,
  },
}

// Limited results with load more hint
export const LimitedResults: Story = {
  args: {
    events: mockEvents,
    maxEvents: 12,
    filteredCount: 25, // More results available
  },
}

// No action buttons
export const WithoutActionButtons: Story = {
  args: {
    events: mockEvents,
    showActionButton: false,
  },
}

// Different container sizes to test auto-resizing
export const NarrowContainer: Story = {
  args: {
    events: mockEvents.slice(0, 6),
  },
  decorators: [
    Story => (
      <div className="max-w-md mx-auto border-2 border-dashed border-gray-300 p-4">
        <p className="text-sm text-gray-500 mb-4">Container width: ~400px</p>
        <Story />
      </div>
    ),
  ],
}

export const WideContainer: Story = {
  args: {
    events: mockEvents,
  },
  decorators: [
    Story => (
      <div className="max-w-7xl mx-auto border-2 border-dashed border-gray-300 p-4">
        <p className="text-sm text-gray-500 mb-4">Container width: ~1280px</p>
        <Story />
      </div>
    ),
  ],
}

// Interactive playground for testing different configurations
export const Playground: Story = {
  args: {
    events: mockEvents,
    isSearchActive: false,
    searchQuery: '',
    cityContext: '',
    maxEvents: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground to test different AutoResizeEventGrid configurations. Adjust the controls to see how the grid adapts.',
      },
    },
  },
}
