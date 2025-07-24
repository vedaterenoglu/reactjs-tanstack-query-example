import type { Preview, Decorator } from '@storybook/react-vite'
import React from 'react'

import { QueryProvider } from '../src/components/providers/QueryProvider'

// Import only essential CSS files to avoid Tailwind processing issues
import '../src/index.css'
import '../src/styles/globals.css'
import '../src/styles/animations.css'
// Temporarily skip responsive.css due to Tailwind v4 @apply issues
// import '../src/styles/responsive.css'

// TanStack Query Provider decorator for all stories
const withQueryProvider: Decorator = Story => {
  return React.createElement(QueryProvider, null, React.createElement(Story))
}

const preview: Preview = {
  decorators: [withQueryProvider],
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0a0a0a',
        },
      ],
    },
    layout: 'centered',
  },
}

export default preview
