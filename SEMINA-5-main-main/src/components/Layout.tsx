import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import OnboardingTour from './OnboardingTour'
import { usePreferences } from '../hooks/usePreferences'

/** Escala de espaciado global: 16 · 24 · 32 px. */
const DENSITY_PADDING: Record<string, string> = {
  compacto: 'p-4',
  comodo: 'p-6',
  espacioso: 'p-8'
}

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
    document.getElementById('app-scroll')?.scrollTo({ top: 0 })
  }, [pathname])

  const mainPadding = DENSITY_PADDING[preferences.density] ?? DENSITY_PADDING.comodo

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div id="app-scroll" className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto md:ml-64">
        <div className="sticky top-0 z-30 border-b border-border/70 bg-white/75 backdrop-blur-xl dark:border-darkBorder dark:bg-darkBackground/75">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              className="btn btn-ghost -ml-1 h-10 w-10 shrink-0 p-0 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Header />
          </div>
        </div>

        <main className={`flex-1 ${mainPadding}`}>
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      <OnboardingTour />
    </div>
  )
}
