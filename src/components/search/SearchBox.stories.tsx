import { SearchBox } from './SearchBox'

/**
 * SearchBox Demo/Stories Component
 * Demonstrates different SearchBox configurations and states
 * Can be used for development, testing, and documentation
 */

export const SearchBoxDemo = () => {
  const handleRefresh = () => {
    // eslint-disable-next-line no-console
    console.log('Refresh clicked - Demo purposes')
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">SearchBox Component Demo</h2>
        <p className="text-muted-foreground mb-8">
          Interactive search component with debouncing, error handling, and accessibility features.
        </p>
      </div>

      <div className="space-y-6">
        {/* Default SearchBox */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Default Configuration</h3>
          <SearchBox onRefresh={handleRefresh} />
        </div>

        {/* SearchBox with custom placeholder */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Custom Placeholder</h3>
          <SearchBox 
            placeholder="Find your destination city..."
            onRefresh={handleRefresh}
          />
        </div>

        {/* SearchBox without refresh button */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Without Refresh Button</h3>
          <SearchBox 
            showRefreshButton={false}
            placeholder="Search only mode..."
          />
        </div>

        {/* SearchBox with faster debounce */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Fast Response (100ms debounce)</h3>
          <SearchBox 
            debounceMs={100}
            placeholder="Quick search..."
            onRefresh={handleRefresh}
          />
        </div>

        {/* SearchBox with auto focus */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Auto Focus</h3>
          <SearchBox 
            autoFocus
            placeholder="Auto focused search..."
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      <div className="mt-12 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Features Demonstrated:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Real-time search with debouncing (300ms default)</li>
          <li>• Clear button appears when typing</li>
          <li>• Refresh button clears search text and reloads data</li>
          <li>• Search automatically cleared on page load</li>
          <li>• Loading states and error handling</li>
          <li>• Results count display</li>
          <li>• Keyboard support (Escape to clear)</li>
          <li>• Accessibility with ARIA labels</li>
          <li>• Mobile-responsive design</li>
        </ul>
      </div>
    </div>
  )
}