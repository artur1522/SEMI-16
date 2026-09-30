import { Link, useLocation } from 'react-router-dom'
import { Cloud, X } from 'lucide-react'
import { NAV_GROUPS, NAV_ITEMS } from '../config/navigation'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white/95 shadow-elevated dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.97),rgba(15,23,42,0.9))] backdrop-blur-xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-5 dark:border-white/10">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accentFrom to-accentTo shadow-[0_6px_16px_rgba(124,58,237,0.4)]">
              <Cloud className="h-5 w-5 text-white" strokeWidth={2.2} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold leading-tight text-textPrimary dark:text-white">CloudOps</span>
              <span className="block text-2xs uppercase tracking-wider text-textSecondary dark:text-slate-400">
                Cloud Management
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="btn btn-ghost h-9 w-9 p-0 text-textSecondary hover:text-textPrimary dark:text-slate-400 dark:hover:text-white md:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group) => {
            const items = NAV_ITEMS.filter((item) => item.group === group.key)
            if (items.length === 0) return null

            return (
              <div key={group.key}>
                <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-widest text-textSecondary dark:text-slate-500">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {items.map(({ path, label, icon: Icon }) => {
                    const isActive = pathname === path
                    return (
                      <li key={path}>
                        <Link
                          to={path}
                          onClick={onClose}
                          aria-current={isActive ? 'page' : undefined}
                          className={`relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-accentFrom/90 to-accentTo/90 text-white shadow-[0_10px_24px_rgba(124,58,237,0.35)]'
                              : 'text-textSecondary hover:bg-accentFrom/10 hover:text-textPrimary dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                          }`}
                        >
                          <Icon
                            className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-white' : 'text-textSecondary dark:text-slate-400'}`}
                          />
                          <span>{label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-border px-5 dark:border-white/10 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-2xs uppercase tracking-wider text-textSecondary dark:text-slate-500">Consola CloudOps</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-2xs font-semibold text-success dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-success dark:bg-emerald-400" aria-hidden="true" />
              En línea
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
