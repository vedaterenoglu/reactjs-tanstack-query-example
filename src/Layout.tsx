import { Outlet } from 'react-router-dom'

import { Footer, Navbar } from '@/components/layout'

export function Layout() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <Navbar title="React + Clerk Template" />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer author="Vedat Erenoglu" />
    </div>
  )
}