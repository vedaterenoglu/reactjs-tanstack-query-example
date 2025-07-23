# 🎫 Events Portfolio - React Redux TypeScript

<div align="center">

![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Redux](https://img.shields.io/badge/Redux-5.0.1-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.0.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)
[![SOLID Principles](https://img.shields.io/badge/Architecture-SOLID-blue.svg?style=for-the-badge)](https://en.wikipedia.org/wiki/SOLID)

**A production-ready event management platform showcasing modern React patterns, Redux state management, and clean architecture principles.**

</div>

---

## 🎯 Project Overview

This is a comprehensive **event booking platform** built with React 19 and TypeScript, demonstrating advanced state management patterns, payment processing, and modern development practices. The application features city-based event browsing, detailed event pages, ticket purchasing with Stripe integration, and a fully responsive design system.

### 🏗️ Architecture Philosophy

The project is built on **SOLID principles** and follows modern React patterns to ensure maintainability, testability, and scalability:

#### **🔹 Single Responsibility Principle Implementation**

```typescript
// Each component has one clear purpose
export const EventCard = ({ event }: EventCardProps) => {
  // Only handles event card display - no data fetching or state management
  return <Card>{/* Event display logic only */}</Card>
}

export const useEvents = () => {
  // Only handles events data management - no UI logic
  const dispatch = useAppDispatch()
  const events = useAppSelector(selectEvents)
  return { events, actions: { fetchEvents: () => dispatch(fetchEvents()) } }
}
```

#### **🔹 Open/Closed Principle Implementation**

```typescript
// Components extensible through props without modification
interface ButtonProps extends VariantProps<typeof buttonVariants> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  // New variants can be added without changing existing code
}

// Component remains closed for modification, open for extension
export const Button = ({ variant, size, ...props }: ButtonProps) => (
  <button className={cn(buttonVariants({ variant, size }))} {...props} />
)
```

#### **🔹 Liskov Substitution Principle Implementation**

```typescript
// All card components implement the same interface and can be substituted
interface CardProps {
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

export const EventCard = ({ className, onClick, children }: CardProps) => (
  <div className={cn('card-base', className)} onClick={onClick}>
    {children}
  </div>
)

export const CityCard = ({ className, onClick, children }: CardProps) => (
  <div className={cn('card-base', className)} onClick={onClick}>
    {children}
  </div>
)

// Cards can be substituted without breaking functionality
export const CardGrid = ({ cards }: { cards: Array<CardProps> }) => (
  <div className="grid gap-4">
    {cards.map((cardProps, index) => (
      // Any card component can be used here interchangeably
      <EventCard key={index} {...cardProps} />
    ))}
  </div>
)
```

#### **🔹 Interface Segregation Principle Implementation**

```typescript
// Focused, minimal interfaces for specific needs
interface EventDisplayProps {
  event: Event
  className?: string
}

interface EventActionsProps {
  eventId: number
  onSelect: (id: number) => void
  onFavorite: (id: number) => void
}

interface EventLoadingProps {
  isLoading: boolean
  onRetry?: () => void
}

// Components only depend on interfaces they actually use
export const EventCard = ({ event, className }: EventDisplayProps) => (
  <Card className={className}>{event.name}</Card>
)

export const EventActions = ({ eventId, onSelect, onFavorite }: EventActionsProps) => (
  <div>
    <Button onClick={() => onSelect(eventId)}>Select</Button>
    <Button onClick={() => onFavorite(eventId)}>Favorite</Button>
  </div>
)

export const EventLoadingState = ({ isLoading, onRetry }: EventLoadingProps) => (
  isLoading ? <Spinner /> : <Button onClick={onRetry}>Retry</Button>
)
```

#### **🔹 Dependency Inversion Implementation**

```typescript
// Components depend on abstractions (hooks), not concrete implementations
export const EventsListPage = () => {
  // Depends on abstraction (useEvents hook), not direct Redux store access
  const { events, isLoading, actions } = useEvents()
  const { currentPage, actions: paginationActions } = useEventPagination()

  // Can easily swap implementations without changing component
  return <EventGrid events={events} />
}
```

### 🎨 Design Patterns Applied

#### **Custom Hooks Pattern Implementation**

```typescript
// Business logic extracted into reusable hooks
export const useEvents = () => {
  const dispatch = useAppDispatch()
  const state = useAppSelector(selectEventsState)

  const actions = useMemo(
    () => ({
      fetchByCity: (citySlug: string) =>
        dispatch(fetchEventsByCity({ citySlug })),
      selectEvent: (event: Event) => dispatch(setSelectedEvent(event)),
      clearError: () => dispatch(clearEventsError()),
    }),
    [dispatch]
  )

  return { ...state, actions }
}
```

#### **Facade Pattern Implementation**

```typescript
// API service facade hides complexity
export class EventApiService {
  private httpClient: HttpClient

  async getEventsByCity(
    citySlug: string,
    page?: number
  ): Promise<EventsResponse> {
    // Hides complex API interaction, validation, error handling
    const response = await this.httpClient.get(`/events`, {
      params: { citySlug, page },
    })
    return EventsResponseSchema.parse(response.data)
  }
}
```

#### **Factory Pattern Implementation**

```typescript
// Service creation factory
export const createApiService = (config: ApiConfig) => {
  const httpClient = new HttpClient(config)
  return {
    eventApi: new EventApiService(httpClient),
    cityApi: new CityApiService(httpClient),
    paymentApi: new PaymentApiService(httpClient),
  }
}
```

#### **Container/Presentational Pattern Implementation**

```typescript
// Container - handles data and logic
export const EventsListContainer = () => {
  const { events, isLoading, error, actions } = useEvents()
  const { currentPage, actions: paginationActions } = useEventPagination()

  useEffect(() => {
    actions.fetchEvents()
  }, [actions])

  if (error) return <ErrorState error={error} onRetry={actions.retry} />

  // Passes only UI data to presentational component
  return (
    <EventsListPresentation
      events={events}
      isLoading={isLoading}
      currentPage={currentPage}
      onEventSelect={actions.selectEvent}
      onPageChange={paginationActions.goToPage}
    />
  )
}

// Presentational - pure UI rendering
interface EventsListPresentationProps {
  events: Event[]
  isLoading: boolean
  currentPage: number
  onEventSelect: (event: Event) => void
  onPageChange: (page: number) => void
}

export const EventsListPresentation = ({
  events,
  isLoading,
  currentPage,
  onEventSelect,
  onPageChange
}: EventsListPresentationProps) => (
  <div className="events-list">
    {isLoading ? (
      <LoadingGrid />
    ) : (
      <>
        <EventGrid events={events} onEventSelect={onEventSelect} />
        <PaginationControls
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      </>
    )}
  </div>
)
```

#### **Compound Components Pattern Implementation**

```typescript
// Compound components working together as a cohesive unit
export const EventDetails = ({ eventSlug }: { eventSlug: string }) => {
  const { event, isLoading } = useSingleEvent(eventSlug)

  if (isLoading) return <LoadingState />
  if (!event) return <NotFoundState />

  return (
    <div className="event-details">
      <EventDetails.Hero event={event} />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <EventDetails.Header event={event} />
          <EventDetails.Description event={event} />
        </div>
        <div>
          <EventDetails.Card event={event} />
          <EventDetails.Purchase event={event} />
        </div>
      </div>
    </div>
  )
}

// Compound component parts
EventDetails.Hero = ({ event }: { event: Event }) => (
  <div className="relative h-96 bg-cover bg-center"
       style={{ backgroundImage: `url(${event.imageUrl})` }}>
    <div className="absolute top-4 right-4">
      <PriceBadge price={event.price} />
    </div>
  </div>
)

EventDetails.Header = ({ event }: { event: Event }) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
    <div className="flex items-center text-gray-600">
      <MapPin className="h-4 w-4 mr-1" />
      <span>{event.location}</span>
    </div>
  </div>
)

EventDetails.Description = ({ event }: { event: Event }) => (
  <div className="prose max-w-none">
    <p>{event.description}</p>
  </div>
)

EventDetails.Card = ({ event }: { event: Event }) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="font-semibold mb-4">Event Details</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(event.date)}</span>
        </div>
        <div className="flex justify-between">
          <span>Organizer:</span>
          <span>{event.organizerName}</span>
        </div>
      </div>
    </CardContent>
  </Card>
)

EventDetails.Purchase = ({ event }: { event: Event }) => (
  <Card className="mt-4">
    <CardContent className="p-6">
      <TicketPurchase event={event} />
    </CardContent>
  </Card>
)
```

#### **Adapter Pattern Implementation**

```typescript
// Adapter pattern for different API response formats
interface EventApiResponse {
  id: number
  title: string // Different field name from our Event interface
  venue: string // Different field name
  price_cents: number // Different format
  created_date: string // Different format
}

interface Event {
  id: number
  name: string
  location: string
  price: number
  createdAt: Date
}

// Adapter converts external API format to internal format
export class EventApiAdapter {
  static adaptApiResponseToEvent(apiResponse: EventApiResponse): Event {
    return {
      id: apiResponse.id,
      name: apiResponse.title, // Adapt field name
      location: apiResponse.venue, // Adapt field name
      price: apiResponse.price_cents / 100, // Convert cents to dollars
      createdAt: new Date(apiResponse.created_date), // Convert string to Date
    }
  }

  static adaptEventToApiRequest(
    event: Partial<Event>
  ): Partial<EventApiResponse> {
    return {
      title: event.name,
      venue: event.location,
      price_cents: event.price ? event.price * 100 : undefined,
      created_date: event.createdAt?.toISOString(),
    }
  }
}

// Usage in API service
export class EventApiService {
  async getEvents(): Promise<Event[]> {
    const response = await this.httpClient.get<EventApiResponse[]>('/events')

    // Adapter converts external format to internal format
    return response.data.map(EventApiAdapter.adaptApiResponseToEvent)
  }

  async createEvent(event: Partial<Event>): Promise<Event> {
    // Adapter converts internal format to external format
    const apiRequest = EventApiAdapter.adaptEventToApiRequest(event)
    const response = await this.httpClient.post<EventApiResponse>(
      '/events',
      apiRequest
    )

    return EventApiAdapter.adaptApiResponseToEvent(response.data)
  }
}
```

#### **Observer Pattern Implementation**

```typescript
// Redux state changes observed by components
export const EventsGrid = () => {
  // Component observes state changes and re-renders automatically
  const events = useAppSelector(selectFilteredEvents)
  const isLoading = useAppSelector(selectEventsLoading)

  // Network status observer
  const networkStatus = useNetworkStatus()

  return (
    <div>
      {networkStatus.isOffline && <OfflineBanner />}
      {events.map(event => <EventCard key={event.id} event={event} />)}
    </div>
  )
}
```

---

## ✨ Core Features

### 🏙️ **City Selection System**

**Advanced Grid Layout with Smart Search**

```typescript
// Responsive grid implementation
export const CitiesGrid = ({ cities, onCitySelect }: CitiesGridProps) => {
  return (
    <div className="grid gap-6 w-full auto-fit-280">
      {cities.map(city => (
        <CityCard
          key={city.id}
          city={city}
          onClick={() => onCitySelect(city)}
          className="hover:scale-105 transition-transform duration-300"
        />
      ))}
    </div>
  )
}
```

**Real-time Search with Debouncing**

```typescript
export const useCitySearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const dispatch = useAppDispatch()

  // Debounced search to prevent excessive API calls
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        dispatch(filterCities(query))
      }, 300),
    [dispatch]
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
    return () => debouncedSearch.cancel()
  }, [searchQuery, debouncedSearch])

  return { searchQuery, setSearchQuery }
}
```

**Redux State Management Implementation**

```typescript
// City slice with advanced state patterns
const citiesSlice = createSlice({
  name: 'cities',
  initialState: {
    entities: [],
    filteredCities: [],
    selectedCity: null,
    searchQuery: '',
    isLoading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    filterCities: (state, action) => {
      const query = action.payload.toLowerCase()
      state.filteredCities = state.entities.filter(city =>
        city.name.toLowerCase().includes(query)
      )
      state.searchQuery = query
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchCities.fulfilled, (state, action) => {
      state.entities = action.payload
      state.filteredCities = action.payload
      state.isLoading = false
      state.lastFetched = Date.now()
    })
  },
})
```

### 🎫 **Event Management System**

**Auto-Resizing Grid with Performance Optimization**

```typescript
export const AutoResizeEventGrid = ({ events, isChangingPage }: Props) => {
  const [gridColumns, setGridColumns] = useState(1)

  // Responsive grid calculation
  useEffect(() => {
    const calculateColumns = () => {
      const containerWidth = window.innerWidth - 64 // Account for padding
      const minCardWidth = 280
      const maxColumns = 4
      const calculatedColumns = Math.min(
        Math.floor(containerWidth / minCardWidth),
        maxColumns
      )
      setGridColumns(Math.max(1, calculatedColumns))
    }

    calculateColumns()
    window.addEventListener('resize', calculateColumns)
    return () => window.removeEventListener('resize', calculateColumns)
  }, [])

  return (
    <div
      className={cn(
        'grid gap-6 transition-all duration-500',
        isChangingPage && 'opacity-50 scale-95 blur-sm'
      )}
      style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
    >
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
```

**Advanced Prefetching with Request Cancellation**

```typescript
export const usePrefetch = () => {
  const abortControllerRef = useRef<AbortController | null>(null)
  const dispatch = useAppDispatch()

  const prefetchNextPage = useCallback(
    async (citySlug: string, currentPage: number) => {
      // Cancel previous prefetch request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      try {
        // Prefetch next page in background
        await dispatch(
          prefetchEventPage({
            citySlug,
            page: currentPage + 1,
            signal: abortControllerRef.current.signal,
          })
        )
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Prefetch failed:', error)
        }
      }
    },
    [dispatch]
  )

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return { prefetchNextPage }
}
```

**Pagination with Smooth Transitions**

```typescript
export const useEventPagination = () => {
  const dispatch = useAppDispatch()
  const { currentPage, totalPages, isChangingPage } = useAppSelector(
    selectPaginationState
  )

  const goToNextPage = useCallback(async () => {
    if (currentPage < totalPages && !isChangingPage) {
      // Set loading state immediately for instant feedback
      dispatch(setPageChanging(true))

      try {
        await dispatch(goToNextPageThunk())
      } finally {
        // Reset loading state after 500ms to match animation
        setTimeout(() => dispatch(setPageChanging(false)), 500)
      }
    }
  }, [currentPage, totalPages, isChangingPage, dispatch])

  return {
    currentPage,
    totalPages,
    canGoNext: currentPage < totalPages && !isChangingPage,
    canGoPrevious: currentPage > 1 && !isChangingPage,
    isChangingPage,
    actions: { goToNextPage, goToPreviousPage },
  }
}
```

### 💳 **Payment Processing System**

**Stripe Integration with Security**

```typescript
// Server-side price validation prevents manipulation
export const createCheckoutSession = async (
  eventSlug: string,
  quantity: number
) => {
  try {
    // Always fetch fresh event data from database
    const event = await eventApi.getEventBySlug(eventSlug)
    if (!event) throw new Error('Event not found')

    // Server validates price - client cannot manipulate
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: event.name },
            unit_amount: event.price * 100, // Database price, not client input
          },
          quantity: Math.max(1, Math.min(10, quantity)), // Validate quantity
        },
      ],
      mode: 'payment',
      success_url: `${ENV.APP_URL}/events/${eventSlug}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ENV.APP_URL}/events/${eventSlug}/payment-cancel`,
    })

    return { sessionId: session.id, url: session.url }
  } catch (error) {
    throw new PaymentError('Failed to create checkout session', error)
  }
}
```

**Test Payment Modal Implementation**

```typescript
export const TestPaymentModal = ({ isOpen, onClose, onConfirm, orderDetails }: Props) => {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Test Payment Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">
              🧪 This is a test payment - no charges will be made
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium">Card Number:</span>
                <p className="font-mono">4242 4242 4242 4242</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard('4242424242424242', 'card')}
              >
                {copiedField === 'card' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
              <div>Expiry: Any future date</div>
              <div>CVC: Any 3 digits</div>
              <div>ZIP: Any valid ZIP</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Order Summary</h4>
            <div className="flex justify-between text-sm">
              <span>{orderDetails.eventName}</span>
              <span>{orderDetails.quantity} tickets</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${orderDetails.totalAmount}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>Continue to Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 🎨 **UI/UX System Implementation**

**Theme System with Context**

```typescript
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }

      // Apply theme to document
      document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    }

    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)

    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [theme, resolvedTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

**Scroll-Triggered Animations**

```typescript
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target) // Animate only once
        }
      },
      { threshold }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { elementRef, isVisible }
}

// Usage in components
export const AnimatedSection = ({ children }: { children: React.ReactNode }) => {
  const { elementRef, isVisible } = useScrollAnimation()

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95'
      )}
    >
      {children}
    </div>
  )
}
```

**Responsive Design System**

```typescript
// Mobile-first responsive grid utility
export const ResponsiveGrid = ({
  children,
  minWidth = 280,
  maxColumns = 4,
  gap = 24
}: Props) => {
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    const calculateColumns = () => {
      const containerWidth = window.innerWidth - (gap * 2)
      const possibleColumns = Math.floor(containerWidth / minWidth)
      const finalColumns = Math.min(Math.max(1, possibleColumns), maxColumns)
      setColumns(finalColumns)
    }

    calculateColumns()
    window.addEventListener('resize', calculateColumns)
    return () => window.removeEventListener('resize', calculateColumns)
  }, [minWidth, maxColumns, gap])

  return (
    <div
      className="w-full transition-all duration-300"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  )
}
```

---

## 📚 Feature Documentation

Detailed technical documentation for each major system:

### 🏗️ **System Architecture**

- **[🏙️ City Selection System](./src/documents/readme-sub-documents/city-selection-system.md)** - Grid layout, search, and state management
- **[🎫 Event Management System](./src/documents/readme-sub-documents/event-management-system.md)** - Event listing, pagination, and prefetching
- **[💳 Payment Processing System](./src/documents/readme-sub-documents/payment-processing-system.md)** - Stripe integration and security
- **[📄 Pagination System](./src/documents/readme-sub-documents/pagination-system.md)** - Advanced pagination with smooth transitions

### 🔧 **Technical Implementation**

- **[🔄 State Management Architecture](./src/documents/readme-sub-documents/state-management-architecture.md)** - Redux patterns and async handling
- **[🎨 UI & Theming System](./src/documents/readme-sub-documents/ui-theming-system.md)** - Design system and component library

### 🚀 **Deployment & DevOps**

- **[🚀 Deployment Guide](./src/documents/readme-sub-documents/deployment-guide.md)** - Vercel and Docker deployment instructions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm**
- **Backend API** running on port 3060 (for full functionality)

### 1️⃣ Clone & Install

```bash
git clone <repository-url>
cd reactjs-redux-thunk-example
npm install
```

### 2️⃣ Environment Setup

```bash
cp .env.example .env
# Configure your environment variables:
# VITE_API_BASE_URL=http://localhost:3060
# VITE_APP_URL=http://localhost:3061
# VITE_STRIPE_PUBLISHABLE_KEY=your_test_key_here
```

### 3️⃣ Start Development

```bash
npm run dev          # Frontend on http://localhost:3061
npm run typecheck    # TypeScript validation
npm run lint         # Code linting
```

---

## 📁 Project Structure

```
src/
├── 📁 components/              # Reusable UI components
│   ├── 📁 cards/              # City and event cards
│   ├── 📁 events/             # Event-specific components
│   ├── 📁 grids/              # Responsive grid layouts
│   ├── 📁 modals/             # Modal components
│   ├── 📁 navigation/         # Navigation and pagination
│   └── 📁 ui/                 # shadcn/ui base components
├── 📁 lib/                    # Utilities and configuration
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 types/              # TypeScript definitions
│   └── 📁 utils/              # Utility functions
├── 📁 routes/                 # Page components
├── 📁 services/               # API services and facades
├── 📁 store/                  # Redux store and slices
│   ├── 📁 slices/cities/      # City state management
│   └── 📁 slices/events/      # Event state management
└── 📁 mock/                   # Development mock data
```

---

## 🎨 Technology Stack

### **Core Framework**

- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5.8.3** - Full type safety and developer experience
- **Vite 7.0.4** - Lightning-fast build tool and dev server

### **State Management**

- **Redux 5.0.1** - Predictable state container
- **Redux Thunk 3.1.0** - Async action handling
- **Redux Persist 6.0.0** - State persistence across sessions
- **Reselect 5.1.1** - Memoized state selectors

### **UI & Styling**

- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **Class Variance Authority** - Component variant management

### **Data & Validation**

- **Zod 4.0.5** - Runtime schema validation
- **React Hook Form 7.60.0** - Performant form management

### **Payment Processing**

- **Stripe Checkout** - Secure payment processing
- **Server-side Validation** - Price manipulation prevention

---

## 🛡️ Code Quality & Standards

### **Development Practices**

- ✅ **SOLID Principles** - Clean architecture throughout
- ✅ **TypeScript Strict Mode** - No `any` types allowed
- ✅ **ESLint + Prettier** - Consistent code formatting
- ✅ **Zod Validation** - Runtime type safety for all API data

### **State Management Patterns**

- ✅ **Redux Toolkit** - Modern Redux with less boilerplate
- ✅ **Memoized Selectors** - Performance-optimized data access
- ✅ **Custom Hooks** - Business logic abstraction
- ✅ **Error Boundaries** - Graceful error handling

### **Component Patterns**

- ✅ **Single Responsibility** - Each component has one purpose
- ✅ **Composition over Inheritance** - Flexible component building
- ✅ **Props Interface Design** - Clear, focused component APIs
- ✅ **Loading & Error States** - Comprehensive state handling

---

## 🧪 Testing & Quality Assurance

```bash
# Code Quality
npm run lint              # ESLint validation
npm run typecheck         # TypeScript validation
npm run format            # Prettier formatting

# Development
npm run dev               # Start development server
npm run build             # Production build
npm run preview           # Preview production build
```

---

## 🏆 Key Achievements

### **Architecture Excellence**

- **Clean Code**: SOLID principles applied throughout
- **Type Safety**: 100% TypeScript coverage with strict mode
- **Performance**: Optimized with memoization and lazy loading
- **Maintainability**: Modular architecture with clear separation of concerns

### **User Experience**

- **Responsive Design**: Mobile-first approach with perfect scaling
- **Accessibility**: Full ARIA support and keyboard navigation
- **Performance**: Fast load times and smooth interactions
- **Visual Design**: Consistent design system with dark/light themes

### **Developer Experience**

- **Hot Reload**: Instant feedback during development
- **Redux DevTools**: Complete state inspection and time-travel debugging
- **TypeScript Integration**: Excellent IntelliSense and error detection
- **Modern Tooling**: Vite for fast builds and optimal development experience

---

## 🔮 Future Roadmap

- 🔄 **Real-time Updates** - WebSocket integration for live data
- 🔄 **Advanced Search** - Full-text search with filters and sorting
- 🔄 **User Profiles** - Enhanced authentication with user preferences
- 🔄 **Social Features** - Event sharing, reviews, and recommendations
- 🔄 **PWA Features** - Offline support and push notifications
- 🔄 **Analytics** - User behavior tracking and performance monitoring

---

## 🤝 Contributing

This project serves as a **portfolio demonstration** of modern React development practices. While not actively seeking contributions, the codebase is designed to be educational and follows industry best practices.

### **Learning Resources**

- Study the **[Feature Documentation](./src/documents/readme-sub-documents/)** for implementation details
- Review **[PROJECT.md](./src/documents/ignore/PROJECT.md)** for comprehensive technical reference
- Examine the **Redux patterns** and **custom hooks** for advanced React techniques
- Analyze the **component architecture** for clean code principles

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Vedat Erenoglu**

- 🌐 Website: [vedaterenoglu.com](https://vedaterenoglu.com)
- 💼 LinkedIn: [@vedaterenoglu](https://www.linkedin.com/in/vedaterenoglu/)
- 📧 Email: info@vedaterenoglu.com

---

<div align="center">

**⭐ Star this repository if you find it helpful for learning modern React patterns!**

_Built with ❤️ using React 19, TypeScript, Redux, and modern development practices_

</div>
