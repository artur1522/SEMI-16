import { useLocation } from 'react-router-dom'
import { Moon, Search, Sun, User, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import NotificationBell from './NotificationBell'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/planning': 'Planificación Cloud',
  '/costs': 'Costos',
  '/infrastructure': 'Infraestructura Global',
  '/security': 'Seguridad',
  '/network': 'Arquitectura de Red',
  '/services': 'Servicios AWS',
  '/config': 'Configuración'
}

export default function Header() {
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const title = titles[pathname] ?? 'CloudOps'

  return (
    <header className="flex h-16 w-full items-center justify-between gap-4">
      <h1 className="truncate text-lg font-semibold text-textPrimary dark:text-darkTextPrimary sm:text-xl">
        {title}
      </h1>

      <div className="flex shrink-0 items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary dark:text-darkTextSecondary" />
          <input
            id="global-search"
            type="text"
            placeholder="Buscar...  ( / )"
            className="w-40 rounded-xl border border-border bg-white py-2 pl-9 pr-3 text-sm text-textPrimary placeholder:text-textSecondary focus:border-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/20 dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary dark:placeholder:text-darkTextSecondary dark:focus:border-darkAccentFrom dark:focus:ring-darkAccentFrom/20 lg:w-64"
          />
        </div>

        <button
          type="button"
          onClick={toggleTheme}
           className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accentFrom/10 text-accentFrom transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/30 hover:bg-gradient-to-r hover:from-accentFrom/15 hover:to-accentTo/15 dark:bg-darkAccentFrom/10 dark:text-darkAccentFrom dark:hover:from-darkAccentFrom/20 dark:hover:to-darkAccentTo/20 dark:focus:ring-2 dark:focus:ring-darkAccentFrom/30"
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          <Sun
            className={`absolute h-5 w-5 transition-all duration-300 ${
              theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <Moon
            className={`absolute h-5 w-5 transition-all duration-300 ${
              theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </button>

        <NotificationBell />

        <Link
          to="/config"
           className="flex h-10 w-10 items-center justify-center rounded-full bg-accentFrom/10 text-accentFrom transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/30 hover:bg-gradient-to-r hover:from-accentFrom/15 hover:to-accentTo/15 dark:bg-darkAccentFrom/10 dark:text-darkAccentFrom dark:hover:from-darkAccentFrom/20 dark:hover:to-darkAccentTo/20 dark:focus:ring-2 dark:focus:ring-darkAccentFrom/30"
          aria-label="Configuración"
        >
          <Settings className="h-5 w-5" />
        </Link>

        <button
          type="button"
           className="flex h-10 w-10 items-center justify-center rounded-full bg-accentFrom/10 text-accentFrom transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/30 hover:bg-gradient-to-r hover:from-accentFrom/15 hover:to-accentTo/15 dark:bg-darkAccentFrom/10 dark:text-darkAccentFrom dark:hover:from-darkAccentFrom/20 dark:hover:to-darkAccentTo/20 dark:focus:ring-2 dark:focus:ring-darkAccentFrom/30"
          aria-label="Perfil de usuario"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}