import type { City } from '@/lib/types/city.types'
import { cities } from '@/mock/events'

import { CitiesGrid } from './CitiesGrid'

import type { Meta, StoryObj } from '@storybook/react-vite'

// Mock city data from production seed data
const mockCities: City[] = cities.slice(0, 8) // Get first 8 cities for demo

const meta = {
  title: 'Components/Grids/CitiesGrid',
  component: CitiesGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    cities: { control: 'object' },
    hasResults: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isSearchActive: { control: 'boolean' },
    searchQuery: { control: 'text' },
    filteredCount: { control: 'number' },
    maxCities: { control: 'number' },
    onCitySelect: { action: 'city-selected' },
  },
  args: {
    cities: mockCities,
    hasResults: true,
  },
} satisfies Meta<typeof CitiesGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    cities: mockCities,
  },
}

export const SearchResults: Story = {
  args: {
    cities: mockCities.slice(0, 2),
    isSearchActive: true,
    searchQuery: 'a',
    filteredCount: 2,
  },
}

export const Loading: Story = {
  args: {
    cities: mockCities,
    isLoading: true,
  },
}

export const CustomGrid: Story = {
  args: {
    cities: mockCities,
    gridClasses: 'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  },
}

export const CompactGrid: Story = {
  args: {
    cities: mockCities,
    gridClasses:
      'grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    showSelectButton: false,
  },
}

export const WithLoadMore: Story = {
  args: {
    cities: mockCities,
    maxCities: 3,
    filteredCount: 10,
  },
}
