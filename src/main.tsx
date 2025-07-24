/**
 * Main - Application bootstrap entry point
 * 
 * Initializes React application with createRoot API and StrictMode wrapper.
 * Imports global CSS styles and renders root App component.
 * 
 * Design Patterns Applied:
 * - Bootstrap Pattern: Single entry point for application initialization
 * - Wrapper Pattern: StrictMode wrapping for development checks
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
