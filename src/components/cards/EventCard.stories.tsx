import type { Event } from '@/lib/types/event.types'
import { events } from '@/mock/events'

import { EventCard } from './EventCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Mock event data from production seed data
const mockEvent: Event = events[0]! // DJ Practice Session - DJ Practice Session

const meta = {
  title: 'Components/Cards/EventCard',
  component: EventCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    event: { control: 'object' },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
    disabled: { control: 'boolean' },
    showActionButton: { control: 'boolean' },
    onClick: { action: 'event-selected' },
  },
  args: {
    event: mockEvent,
  },
} satisfies Meta<typeof EventCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    event: mockEvent,
  },
}

export const Compact: Story = {
  args: {
    event: mockEvent,
    variant: 'compact',
  },
}

export const WithoutActionButton: Story = {
  args: {
    event: mockEvent,
    showActionButton: false,
  },
}

export const Disabled: Story = {
  args: {
    event: mockEvent,
    disabled: true,
  },
}

export const HoverState: Story = {
  args: {
    event: mockEvent,
  },
  parameters: {
    pseudo: { hover: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement as HTMLElement
    const card = canvas.querySelector('article')
    if (card) {
      card.dispatchEvent(new MouseEvent('mouseenter'))
    }
  },
}

export const HarmonyFestival: Story = {
  args: {
    event: events[1]!, // Harmony Festival
  },
}

export const AnimationWorkshop: Story = {
  args: {
    event: events[2]!, // 3D Animation Workshop
  },
}

export const DifferentCityEvent: Story = {
  args: {
    event: events.find(e => e.city === 'Seattle') ?? events[10]!, // Get a Seattle event
  },
}

export const FreeEvent: Story = {
  args: {
    event: { ...mockEvent, price: 0 },
  },
}

export const BrokenImage: Story = {
  args: {
    event: {
      ...mockEvent,
      imageUrl: 'https://invalid-url.com/nonexistent-image.jpg',
    },
  },
}
