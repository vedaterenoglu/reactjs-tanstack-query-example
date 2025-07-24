/**
 * EventListHeader.stories - Storybook stories for EventListHeader component
 * 
 * Provides comprehensive Storybook stories demonstrating EventListHeader
 * component in different contexts (city-specific, all events) with
 * interactive controls and proper mock data.
 * 
 * Design Patterns Applied:
 * - Story Pattern: Individual stories for different component states
 * - Mock Data Pattern: Uses production-like city data for realistic demos
 * - Configuration Pattern: Storybook meta configuration with controls
 */

import type { City } from '@/lib/types/city.types'
import { cities } from '@/mock/events'

import { EventListHeader } from './EventListHeader'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Mock city data from production seed data
const mockCity: City = cities.find(c => c.citySlug === 'austin')!

const meta = {
  title: 'Components/Sections/EventListHeader',
  component: EventListHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    city: { control: 'object' },
    allEvents: { control: 'boolean' },
    onBack: { action: 'back-clicked' },
    className: { control: 'text' },
  },
  args: {},
} satisfies Meta<typeof EventListHeader>

export default meta
type Story = StoryObj<typeof meta>

export const AustinEvents: Story = {
  args: {
    city: mockCity,
  },
}

export const SeattleEvents: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'seattle')!,
  },
}

export const SanFranciscoEvents: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'san-francisco')!,
  },
}

export const ChicagoEvents: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'chicago')!,
  },
}

export const NewYorkEvents: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'new-york')!,
  },
}

export const AllEvents: Story = {
  args: {
    allEvents: true,
  },
}

export const WithoutBackButton: Story = {
  args: {
    city: mockCity,
  },
}

export const BrokenImage: Story = {
  args: {
    city: {
      citySlug: 'broken-image',
      city: 'Test City',
      url: 'https://invalid-url.com/nonexistent-image.jpg',
      alt: 'Test city with broken image',
    },
  },
}

export const FallbackState: Story = {
  args: {},
}
