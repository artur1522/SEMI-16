import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, Circle, ShieldAlert } from 'lucide-react'
import { useNotifications, type NotificationItem } from '../hooks/NotificationContext'

type Filter = 'all' | 'unread' | 'alerts'

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
  { id: 'alerts', label: 'Alertas' }
]

function relativeTime(date: string) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000))
  if (elapsedMinutes < 1) return 'Ahora'
  if (elapsedMinutes < 60) return `Hace ${elapsedMinutes} min`
  const hours = Math.floor(elapsedMinutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  return `Hace ${Math.floor(hours / 24)} d`
}

function NotificationRow({ item, onRead }: { item: NotificationItem; onRead: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onRead(item.id)}
      className={`flex w-full gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors last:border-0 hover:bg-accentFrom/5 dark:border-darkBorder dark:hover:bg-darkAccentFrom/10 ${item.read ? 'opacity-70' : ''}`}
    >
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.severity === 'error' || item.severity === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-accentFrom/10 text-accentFrom dark:text-darkAccentFrom'}`}>
        {item.category === 'alert' ? <ShieldAlert className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">{item.title}</span>
          {!item.read && <Circle className="mt-1 h-2 w-2 shrink-0 fill-accentFrom text-accentFrom dark:fill-darkAccentFrom dark:text-darkAccentFrom" aria-label="No leída" />}
        </span>
        <span className="mt-1 block text-xs leading-5 text-textSecondary dark:text-darkTextSecondary">{item.message}</span>
        <span className="mt-1 block text-[11px] text-textSecondary/80 dark:text-darkTextSecondary/80">{relativeTime(item.createdAt)}</span>
      </span>
    </button>
  )
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const visibleNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read
    if (filter === 'alerts') return notification.category === 'alert'
    return true
  })

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accentFrom/10 text-accentFrom transition-all hover:bg-gradient-to-r hover:from-accentFrom/15 hover:to-accentTo/15 focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:bg-darkAccentFrom/10 dark:text-darkAccentFrom dark:hover:from-darkAccentFrom/20 dark:hover:to-darkAccentTo/20 dark:focus:ring-darkAccentFrom/30"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold leading-none text-white dark:border-darkBackground">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <section className="absolute right-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-darkBorder dark:bg-darkCard" role="dialog" aria-label="Notificaciones">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 dark:border-darkBorder">
            <div>
              <h2 className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">Notificaciones</h2>
              <p className="mt-0.5 text-xs text-textSecondary dark:text-darkTextSecondary">{unreadCount} sin leer</p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-accentFrom hover:bg-accentFrom/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-darkAccentFrom dark:hover:bg-darkAccentFrom/10"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar leídas
            </button>
          </div>
          <div className="flex gap-1 border-b border-border px-3 py-2 dark:border-darkBorder" role="tablist" aria-label="Filtrar notificaciones">
            {filters.map((option) => (
              <button
                type="button"
                role="tab"
                aria-selected={filter === option.id}
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${filter === option.id ? 'bg-accentFrom/10 text-accentFrom dark:bg-darkAccentFrom/15 dark:text-darkAccentFrom' : 'text-textSecondary hover:bg-slate-100 dark:text-darkTextSecondary dark:hover:bg-white/5'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {visibleNotifications.length > 0 ? visibleNotifications.map((item) => (
              <NotificationRow key={item.id} item={item} onRead={markAsRead} />
            )) : (
              <p className="px-4 py-8 text-center text-sm text-textSecondary dark:text-darkTextSecondary">
                No hay notificaciones en esta vista.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}