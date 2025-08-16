/**
 * Router - Application routing configuration
 * 
 * Defines React Router v7 routes with lazy loading for code splitting.
 * Includes protected routes, nested routing structure, and Suspense fallbacks.
 * 
 * Design Patterns Applied:
 * - Lazy Loading Pattern: Code splitting with React.lazy
 * - Suspense Pattern: Loading fallbacks for async components
 * - Protected Route Pattern: Authentication-gated routes
 * - Nested Routing Pattern: Layout wrapper with child routes
 */

import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth'

import { Layout } from './Layout'

// Lazy load routes for code splitting - import directly for proper chunking
const HomePage = lazy(() => 
  import('@/routes/HomePage').then(module => ({ default: module.HomePage }))
)
const Authenticated = lazy(() => 
  import('@/routes/Authenticated').then(module => ({ default: module.Authenticated }))
)
const EventsListPage = lazy(() => 
  import('@/routes/EventsListPage').then(module => ({ default: module.EventsListPage }))
)
const SingleEventPage = lazy(() => 
  import('@/routes/SingleEventPage').then(module => ({ default: module.SingleEventPage }))
)
const PaymentSuccessPage = lazy(() => 
  import('@/routes/PaymentSuccessPage').then(module => ({ default: module.PaymentSuccessPage }))
)
const PaymentCancelPage = lazy(() => 
  import('@/routes/PaymentCancelPage').then(module => ({ default: module.PaymentCancelPage }))
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'authenticated',
        element: (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <ProtectedRoute>
              <Authenticated />
            </ProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'events',
        element: (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <EventsListPage />
          </Suspense>
        ),
      },
      {
        path: 'events/:slug',
        element: (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <SingleEventPage />
          </Suspense>
        ),
      },
      {
        path: 'events/:slug/payment-success',
        element: (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <PaymentSuccessPage />
          </Suspense>
        ),
      },
      {
        path: 'events/:slug/payment-cancel',
        element: (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
          >
            <PaymentCancelPage />
          </Suspense>
        ),
      },
    ],
  },
])
