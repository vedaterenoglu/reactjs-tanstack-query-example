/**
 * EventListContainer.stories - Storybook stories for EventListContainer component
 * 
 * Demonstrates EventListContainer component in different contexts including
 * city-specific events and all events scenarios with mock data and
 * interactive navigation controls.
 * 
 * Design Patterns Applied:
 * - Story Pattern: Stories for different container contexts
 * - Mock Data Pattern: Uses production Austin city data for realistic demos
 * - Container Pattern: Shows how container orchestrates child components
 */

import type { City } from '@/lib/types/city.types'
import { cities } from '@/mock/events'

import { EventListContainer } from './EventListContainer'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Mock city data from production seed data
const mockCity: City = cities.find(c => c.citySlug === 'austin')!

const meta = {
  title: 'Components/Containers/EventListContainer',
  component: EventListContainer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    city: { control: 'object' },
    allEvents: { control: 'boolean' },
    onBack: { action: 'back-clicked' },
    onEventSelect: { action: 'event-selected' },
    className: { control: 'text' },
  },
  args: {},
} satisfies Meta<typeof EventListContainer>

export default meta
type Story = StoryObj<typeof meta>

export const AustinEvents: Story = {
  args: {
    city: mockCity,
  },
}

export const AllEvents: Story = {
  args: {
    allEvents: true,
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

export const DenverEvents: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'denver')!,
  },
}
