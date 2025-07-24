/**
 * Layout - Main application layout structure
 * 
 * Provides consistent page layout with Navbar, content area using React Router Outlet,
 * and Footer. Implements responsive flex layout with environment-based configuration.
 * 
 * Design Patterns Applied:
 * - Layout Pattern: Consistent page structure template
 * - Outlet Pattern: React Router content placeholder
 * - Configuration Pattern: Environment-based app name
 */

import { Outlet } from 'react-router-dom'

import { Footer, Navbar } from '@/components/layout'

export function Layout() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <Navbar title={import.meta.env['VITE_APP_NAME'] || 'Online Ticket'} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer author="Vedat Erenoglu" />
    </div>
  )
}
