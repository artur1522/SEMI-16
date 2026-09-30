import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useNotifications, type ToastItem } from '../hooks/NotificationContext'

const appearance = {
  info: { icon: Info, color: 'text-blue-600 dark:text-blue-400' },
  success: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
  error: { icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400' }
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const { icon: Icon, color } = appearance[toast.severity]
  return (
    <div className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-lg dark:border-darkBorder dark:bg-darkCard" role="status">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">{toast.title}</p>
        <p className="mt-1 text-sm leading-5 text-textSecondary dark:text-darkTextSecondary">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-textSecondary hover:bg-slate-100 hover:text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextSecondary dark:hover:bg-white/5 dark:hover:text-darkTextPrimary"
        aria-label="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications()
  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />)}
    </div>
  )
}