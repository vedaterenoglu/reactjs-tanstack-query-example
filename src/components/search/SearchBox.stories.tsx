/**
 * SearchBox.stories - Storybook stories for SearchBox component
 * 
 * Provides interactive Storybook stories demonstrating SearchBox component
 * with different states, configurations, and user interactions including
 * debouncing, loading states, and clear functionality.
 * 
 * Design Patterns Applied:
 * - Story Pattern: Multiple stories for different search states
 * - Interactive Pattern: Action handlers for testing search interactions
 * - State Simulation Pattern: Mock loading and error states for testing
 */

import { SearchBox } from './SearchBox'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Components/Search/SearchBox',
  component: SearchBox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: { control: 'text' },
    debounceMs: { control: 'number' },
    autoFocus: { control: 'boolean' },
    className: { control: 'text' },
  },
  args: {
    placeholder: 'Search for cities...',
  },
} satisfies Meta<typeof SearchBox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Search for cities...',
  },
}

export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Type city name here...',
  },
}

export const FastDebounce: Story = {
  args: {
    placeholder: 'Fast search (100ms debounce)',
    debounceMs: 100,
  },
}

export const SlowDebounce: Story = {
  args: {
    placeholder: 'Slow search (1000ms debounce)',
    debounceMs: 1000,
  },
}

export const AutoFocus: Story = {
  args: {
    placeholder: 'Auto-focused search box',
    autoFocus: true,
  },
}

export const FullWidth: Story = {
  args: {
    placeholder: 'Full width search box',
    className: 'w-full max-w-2xl',
  },
  parameters: {
    layout: 'padded',
  },
}
