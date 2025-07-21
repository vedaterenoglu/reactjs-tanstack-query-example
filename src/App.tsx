import { RouterProvider } from 'react-router-dom'

import { ClerkProvider, ReduxProvider } from '@/components/providers'
import { ThemeProvider } from '@/components/theme-provider'

import { router } from './router'

function App() {
  return (
    <ClerkProvider>
      <ReduxProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <RouterProvider router={router} />
        </ThemeProvider>
      </ReduxProvider>
    </ClerkProvider>
  )
}

export default App
