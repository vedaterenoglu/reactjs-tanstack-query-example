import type { City } from '@/lib/types/city.types'

import { CityCard } from './CityCard'

/**
 * CityCard Demo/Stories Component
 * Demonstrates different CityCard configurations and states
 * Can be used for development, testing, and documentation
 */

// Mock city data for demonstration
const mockCities: City[] = [
  {
    citySlug: 'istanbul',
    city: 'Istanbul',
    url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Beautiful view of Istanbul with Bosphorus bridge'
  },
  {
    citySlug: 'ankara',
    city: 'Ankara',
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Ankara cityscape with modern architecture'
  },
  {
    citySlug: 'izmir',
    city: 'İzmir',
    url: 'https://images.unsplash.com/photo-1598946485207-2d43cf2f7d6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'İzmir coastal view with blue sea'
  },
  {
    citySlug: 'antalya',
    city: 'Antalya',
    url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    alt: 'Antalya Mediterranean coastline and old town'
  }
]

// Mock city with broken image URL for error state testing
const mockCityWithBrokenImage: City = {
  citySlug: 'broken-image',
  city: 'Test City',
  url: 'https://invalid-url.com/nonexistent-image.jpg',
  alt: 'Test city with broken image'
}

export const CityCardDemo = () => {
  const handleCitySelect = (city: City) => {
    // eslint-disable-next-line no-console
    console.log('City selected:', city.city, '- Demo purposes')
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div>
        <h2 className="text-3xl font-bold mb-4">CityCard Component Demo</h2>
        <p className="text-muted-foreground mb-8">
          Interactive city cards with image overlay text, black transparent backgrounds, and green hover effects.
        </p>
      </div>

      {/* Default Cards Grid */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Default Cards (4-column responsive grid)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockCities.map(city => (
            <CityCard
              key={city.citySlug}
              city={city}
              onSelect={handleCitySelect}
            />
          ))}
        </div>
      </section>

      {/* Compact Variant */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Compact Variant</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {mockCities.map(city => (
            <CityCard
              key={`compact-${city.citySlug}`}
              city={city}
              variant="compact"
              onSelect={handleCitySelect}
            />
          ))}
        </div>
      </section>

      {/* Different States */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Different States</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Normal Card */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Normal State</h4>
            <CityCard
              city={mockCities[0]!}
              onSelect={handleCitySelect}
            />
          </div>

          {/* Card without Select Button */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">No Select Button</h4>
            <CityCard
              city={mockCities[1]!}
              showSelectButton={false}
              onSelect={handleCitySelect}
            />
          </div>

          {/* Disabled Card */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Disabled State</h4>
            <CityCard
              city={mockCities[2]!}
              disabled={true}
              onSelect={handleCitySelect}
            />
          </div>
        </div>
      </section>

      {/* Error States */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Error Handling</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Broken Image */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Broken Image Fallback</h4>
            <CityCard
              city={mockCityWithBrokenImage}
              onSelect={handleCitySelect}
            />
          </div>

          {/* Long City Name */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Long Name Truncation</h4>
            <CityCard
              city={{
                citySlug: 'very-long-city-name',
                city: 'This is a Very Long City Name That Should Be Truncated Properly',
                url: mockCities[0]!.url,
                alt: 'Test city with very long name'
              }}
              onSelect={handleCitySelect}
            />
          </div>
        </div>
      </section>

      {/* Mobile Preview */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Mobile Layout Preview</h3>
        <div className="max-w-sm mx-auto border-2 border-dashed border-muted-foreground/30 p-4 rounded-lg">
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground mb-4">
              Mobile viewport simulation (380px)
            </div>
            {mockCities.slice(0, 2).map(city => (
              <CityCard
                key={`mobile-${city.citySlug}`}
                city={city}
                onSelect={handleCitySelect}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Summary */}
      <section className="mt-16 p-6 bg-muted rounded-lg">
        <h4 className="font-semibold mb-3">CityCard Features:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Full image background with overlay text</li>
            <li>• Black transparent stripe behind city name (bg-black/60)</li>
            <li>• White text with strong text-shadow for readability</li>
            <li>• Select button with black/60 background and white text</li>
            <li>• Green text color on button hover</li>
            <li>• Hover animations with scale and overlay effects</li>
            <li>• Selection state with visual indicators</li>
            <li>• Loading states during selection</li>
          </ul>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Image error fallback with icon</li>
            <li>• Text truncation for long city names</li>
            <li>• Responsive design (mobile-first)</li>
            <li>• Accessibility with ARIA labels</li>
            <li>• Disabled state support</li>
            <li>• Compact variant for dense layouts</li>
            <li>• SOLID principles compliance</li>
            <li>• TypeScript strict typing</li>
          </ul>
        </div>
      </section>
    </div>
  )
}