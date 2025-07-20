import { RouterProvider } from 'react-router-dom'

import { ClerkProvider } from '@/components/providers'
import { ThemeProvider } from '@/components/theme-provider'

import { router } from './router'

function App() {
  return (
    <ClerkProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </ClerkProvider>
  )
}

export default App
