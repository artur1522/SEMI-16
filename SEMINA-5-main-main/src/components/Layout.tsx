import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import OnboardingTour from './OnboardingTour'
import { usePreferences } from '../hooks/usePreferences'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const { preferences } = usePreferences()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === '/') {
        const target = event.target as HTMLElement | null
        const typing =
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
        if (typing) return
        event.preventDefault()
        document.getElementById('global-search')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const mainPadding =
    preferences.density === 'compacto'
      ? 'p-3 sm:p-4 lg:p-6'
      : preferences.density === 'espacioso'
        ? 'p-6 sm:p-8 lg:p-10'
        : 'p-4 sm:p-6 lg:p-8'

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto md:ml-64">
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/40 bg-white/60 px-4 backdrop-blur-xl dark:border-darkBorder dark:bg-darkBackground/65 sm:px-6">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-textSecondary transition-all hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextSecondary dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/30 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Header />
        </div>

        <main className={`flex-1 ${mainPadding}`}>
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      <OnboardingTour />
    </div>
  )
}