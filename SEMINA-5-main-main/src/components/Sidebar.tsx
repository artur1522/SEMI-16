import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  ClipboardList,
  DollarSign,
  Globe,
  Shield,
  Network,
  Server,
  Cloud,
  Settings,
  X,
  type LucideIcon
} from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/planning', label: 'Planificación', icon: ClipboardList },
  { path: '/costs', label: 'Costos', icon: DollarSign },
  { path: '/infrastructure', label: 'Infraestructura', icon: Globe },
  { path: '/security', label: 'Seguridad', icon: Shield },
  { path: '/network', label: 'Red', icon: Network },
  { path: '/services', label: 'Servicios', icon: Server },
  { path: '/config', label: 'Configuración', icon: Settings }
]

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const { pathname } = useLocation()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-sidebar/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))] shadow-[0_0_35px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-transform duration-300 ease-in-out md:fixed md:inset-y-0 md:left-0 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-white/10 px-6">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" strokeWidth={2.2} />
            <span className="text-lg font-semibold text-white">CloudOps</span>
          </div>
          <button
            type="button"
            className="text-slate-400 transition-colors hover:text-white md:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = pathname === path
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500/90 via-fuchsia-500/90 to-pink-500/90 text-white shadow-[0_12px_30px_rgba(168,85,247,0.35)]'
                    : 'text-slate-300 hover:bg-white/7 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-xs text-slate-500">CloudOps Console</p>
        </div>
      </aside>
    </>
  )
}