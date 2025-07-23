/**
 * RTK Query Example Component - Demonstrates RTK Query integration
 * Shows how RTK Query complements existing async thunks for enhanced performance
 * 
 * Design Patterns Applied:
 * - Component Composition: Composed of smaller demonstration components
 * - Strategy Pattern: Different data fetching strategies shown
 * - Observer Pattern: Automatic updates when data changes
 * - Facade Pattern: Clean interface for complex RTK Query features
 */

import { useState } from 'react'

import { useEvents } from '@/lib/hooks/useEvents'
import { useRTKEvents, useLazyRTKEvents, useRTKEvent } from '@/lib/hooks/useRTKEvents'

/**
 * Comparison component showing RTK Query vs Async Thunks
 */
export const RTKQueryExample: React.FC = () => {
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [showComparison, setShowComparison] = useState(false)

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          RTK Query Integration Example
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This example demonstrates how RTK Query enhances data fetching with automatic caching,
          background updates, and optimistic updates alongside existing async thunks.
        </p>
      </div>

      {/* Toggle comparison view */}
      <div className="text-center">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showComparison ? 'Hide' : 'Show'} RTK Query vs Async Thunks Comparison
        </button>
      </div>

      {showComparison && <ComparisonSection />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RTK Query Automatic Fetching */}
        <AutomaticFetchingExample />

        {/* RTK Query Lazy Fetching */}
        <LazyFetchingExample onEventSelect={setSelectedSlug} />
      </div>

      {selectedSlug && (
        <div className="mt-8">
          <SingleEventExample slug={selectedSlug} />
        </div>
      )}
    </div>
  )
}

/**
 * Shows automatic data fetching with RTK Query
 */
const AutomaticFetchingExample: React.FC = () => {
  const { events, isLoading, isFetching, isRefreshing, eventsCount, refetch } = useRTKEvents({
    limit: 5,
  })

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          RTK Query: Automatic Fetching
        </h2>
        <div className="flex items-center space-x-2">
          {isRefreshing && (
            <span className="text-sm text-blue-600">↻ Background Update</span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {isFetching ? 'Fetching...' : 'Refetch'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-600">
          Found {eventsCount} events • {isLoading ? 'Initial load...' : 'Cached with auto-updates'}
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 3).map((event) => (
              <div key={event.slug} className="p-3 border rounded-lg hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">{event.name}</h3>
                <p className="text-sm text-gray-600">{event.city} • ${event.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Shows lazy fetching with RTK Query
 */
const LazyFetchingExample: React.FC<{ onEventSelect: (slug: string) => void }> = ({ 
  onEventSelect 
}) => {
  const { fetchEvents, events, isLoading, eventsCount } = useLazyRTKEvents()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      void fetchEvents({ search: searchQuery, limit: 5 })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        RTK Query: Lazy Fetching
      </h2>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !searchQuery.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {eventsCount > 0 && (
          <div className="text-sm text-gray-600">
            Found {eventsCount} events matching "{searchQuery}"
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.slug}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onEventSelect(event.slug)}
            >
              <h3 className="font-medium text-gray-900">{event.name}</h3>
              <p className="text-sm text-gray-600">{event.city} • ${event.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Shows single event fetching with caching
 */
const SingleEventExample: React.FC<{ slug: string }> = ({ slug }) => {
  const { event, isLoading, hasEvent } = useRTKEvent(slug)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!hasEvent) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-500">Event not found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          RTK Query: Cached Event Details
        </h2>
        <span className="text-sm text-green-600">✓ Cached</span>
      </div>
      
      {event && (
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-gray-900">{event.name}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Location:</span>
              <p className="text-gray-600">{event.location}, {event.city}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Price:</span>
              <p className="text-gray-600">${event.price}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Organizer:</span>
              <p className="text-gray-600">{event.organizerName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Date:</span>
              <p className="text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Description:</span>
            <p className="text-gray-600 mt-1">{event.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Comparison between RTK Query and Async Thunks
 */
const ComparisonSection: React.FC = () => {
  // RTK Query hook
  const rtkQueryData = useRTKEvents({ limit: 3 })
  
  // Existing async thunk hook
  const asyncThunkData = useEvents()

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        RTK Query vs Async Thunks Comparison
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RTK Query side */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-blue-600 mb-3 flex items-center">
            <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
            RTK Query
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Loading:</span>
              <span className={rtkQueryData.isLoading ? 'text-orange-600' : 'text-green-600'}>
                {rtkQueryData.isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Background Fetch:</span>
              <span className={rtkQueryData.isRefreshing ? 'text-blue-600' : 'text-gray-500'}>
                {rtkQueryData.isRefreshing ? 'Active' : 'Idle'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Events Count:</span>
              <span>{rtkQueryData.eventsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Status:</span>
              <span className="text-green-600">Auto-managed</span>
            </div>
          </div>
        </div>

        {/* Async Thunks side */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-purple-600 mb-3 flex items-center">
            <span className="w-3 h-3 bg-purple-600 rounded-full mr-2"></span>
            Async Thunks
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Loading:</span>
              <span className={asyncThunkData.isLoading ? 'text-orange-600' : 'text-green-600'}>
                {asyncThunkData.isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Background Fetch:</span>
              <span className="text-gray-500">Manual</span>
            </div>
            <div className="flex justify-between">
              <span>Events Count:</span>
              <span>{asyncThunkData.eventsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Status:</span>
              <span className="text-yellow-600">Manual (5min)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Key Differences:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• RTK Query provides automatic background refetching</li>
          <li>• RTK Query handles request deduplication automatically</li>
          <li>• RTK Query offers optimistic updates for mutations</li>
          <li>• Async thunks give more control over business logic</li>
          <li>• Both can coexist for different use cases</li>
        </ul>
      </div>
    </div>
  )
}

export default RTKQueryExample