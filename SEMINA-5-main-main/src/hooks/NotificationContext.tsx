import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'
export type NotificationCategory = 'alert' | 'update' | 'system'

export interface NotificationItem {
  id: string
  title: string
  message: string
  createdAt: string
  read: boolean
  category: NotificationCategory
  severity: NotificationSeverity
}

export interface NotificationInput {
  title: string
  message: string
  category?: NotificationCategory
  severity?: NotificationSeverity
}

export interface ToastItem {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
}

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  toasts: ToastItem[]
  addNotification: (input: NotificationInput) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissToast: (id: string) => void
}

const STORAGE_KEY = 'cloudops-notifications'
const initialNotifications: NotificationItem[] = [
  {
    id: 'security-review',
    title: 'Revisión de seguridad pendiente',
    message: 'Hay controles de seguridad que requieren atención en la configuración actual.',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'alert',
    severity: 'warning'
  },
  {
    id: 'cloud-status',
    title: 'Panel CloudOps listo',
    message: 'La información de infraestructura y costos está actualizada.',
    createdAt: new Date().toISOString(),
    read: false,
    category: 'system',
    severity: 'info'
  }
]

function loadNotifications(): NotificationItem[] {
  if (typeof window === 'undefined') return initialNotifications
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialNotifications
    const parsed = JSON.parse(saved) as NotificationItem[]
    return Array.isArray(parsed) ? parsed : initialNotifications
  } catch {
    return initialNotifications
  }
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(loadNotifications)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const addNotification = useCallback((input: NotificationInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const severity = input.severity ?? 'info'
    const notification: NotificationItem = {
      id,
      title: input.title,
      message: input.message,
      createdAt: new Date().toISOString(),
      read: false,
      category: input.category ?? 'system',
      severity
    }

    setNotifications((current) => [notification, ...current])
    setToasts((current) => [...current, { id, title: input.title, message: input.message, severity }])
    window.setTimeout(() => dismissToast(id), 5000)
  }, [dismissToast])

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
  }, [])

  const unreadCount = notifications.filter((notification) => !notification.read).length
  const value = useMemo(
    () => ({ notifications, unreadCount, toasts, addNotification, markAsRead, markAllAsRead, dismissToast }),
    [notifications, unreadCount, toasts, addNotification, markAsRead, markAllAsRead, dismissToast]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  return context
}