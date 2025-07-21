import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth'

import { Layout } from './Layout'

// Lazy load routes for code splitting
const HomePage = lazy(() =>
  import('@/routes').then(module => ({ default: module.HomePage }))
)
const Authenticated = lazy(() =>
  import('@/routes').then(module => ({ default: module.Authenticated }))
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
    ],
  },
])
