import { createBrowserRouter } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth'
import { Authenticated, HomePage } from '@/routes'

import { Layout } from './Layout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'authenticated',
        element: (
          <ProtectedRoute>
            <Authenticated />
          </ProtectedRoute>
        ),
      },
    ],
  },
])
