import type { City } from '@/lib/types/city.types'
import { cities } from '@/mock/events'

import { CityCard } from './CityCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Mock city data from production seed data
const mockCity: City = cities.find(c => c.citySlug === 'austin')!

const meta = {
  title: 'Components/Cards/CityCard',
  component: CityCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    city: { control: 'object' },
    variant: {
      control: 'select',
      options: ['default', 'compact'],
    },
    disabled: { control: 'boolean' },
    showSelectButton: { control: 'boolean' },
    onSelect: { action: 'city-selected' },
  },
  args: {
    city: mockCity,
  },
} satisfies Meta<typeof CityCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    city: mockCity,
  },
}

export const Compact: Story = {
  args: {
    city: mockCity,
    variant: 'compact',
  },
}

export const WithoutSelectButton: Story = {
  args: {
    city: mockCity,
    showSelectButton: false,
  },
}

export const Disabled: Story = {
  args: {
    city: mockCity,
    disabled: true,
  },
}

export const SanFrancisco: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'san-francisco')!,
  },
}

export const Chicago: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'chicago')!,
  },
}

export const Seattle: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'seattle')!,
  },
}

export const WashingtonDC: Story = {
  args: {
    city: cities.find(c => c.citySlug === 'washington-d-c')!,
  },
}

export const BrokenImage: Story = {
  args: {
    city: {
      ...mockCity,
      url: 'https://invalid-url.com/nonexistent-image.jpg',
    },
  },
}
