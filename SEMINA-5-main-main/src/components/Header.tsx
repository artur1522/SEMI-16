import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Moon, Search, Settings, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { navItemByPath } from '../config/navigation'
import NotificationBell from './NotificationBell'

export default function Header() {
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const current = navItemByPath(pathname)

  return (
    <header className="flex h-16 w-full min-w-0 items-center justify-between gap-4">
      <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 text-sm">
        <span className="hidden font-semibold text-textSecondary sm:inline dark:text-darkTextSecondary">
          CloudOps
        </span>
        <ChevronRight
          className="hidden h-4 w-4 shrink-0 text-textSecondary/50 sm:inline dark:text-darkTextSecondary/50"
          aria-hidden="true"
        />
        <span className="truncate font-semibold text-textPrimary dark:text-darkTextPrimary">
          {current?.shortTitle ?? 'CloudOps'}
        </span>
        {current && (
          <span className="hidden truncate text-xs text-textSecondary lg:inline dark:text-darkTextSecondary">
            {current.eyebrow}
          </span>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary dark:text-darkTextSecondary" />
          <input
            id="global-search"
            type="text"
            placeholder="Buscar…  ( / )"
            aria-label="Buscar en CloudOps"
            className="input w-40 pl-9 lg:w-64"
          />
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-ghost relative h-10 w-10 rounded-full p-0 text-accentFrom hover:text-accentFrom dark:text-darkAccentFrom"
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
          className="btn btn-ghost h-10 w-10 rounded-full p-0 text-accentFrom hover:text-accentFrom dark:text-darkAccentFrom"
          aria-label="Configuración"
        >
          <Settings className="h-5 w-5" />
        </Link>

        <span
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accentFrom to-accentTo text-xs font-bold text-white shadow-[0_6px_16px_rgba(124,58,237,0.35)]"
          aria-label="Perfil de usuario"
          title="Ana Martínez · Administradora"
        >
          AM
        </span>
      </div>
    </header>
  )
}
