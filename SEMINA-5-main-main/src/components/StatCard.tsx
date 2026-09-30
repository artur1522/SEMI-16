import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  /** Tono del icono: `info` (por defecto) o `accent` para destacar. */
  iconTone?: 'primary' | 'accent' | 'success' | 'warning'
  hint?: string
}

const ICON_TONE: Record<string, string> = {
  primary: 'bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary',
  accent:
    'bg-accentFrom/10 text-accentFrom dark:bg-darkAccentFrom/10 dark:text-darkAccentFrom',
  success: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess',
  warning: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning'
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconTone = 'primary',
  hint
}: StatCardProps) {
  const isPositiveTrend = trend?.startsWith('+') || trend?.startsWith('↑')

  return (
    <article className="card-tile flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="metric-label">{title}</p>
        <p className="metric-value">{value}</p>
        {trend && (
          <p
            className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
              isPositiveTrend
                ? 'text-success dark:text-darkSuccess'
                : 'text-danger dark:text-darkDanger'
            }`}
          >
            {isPositiveTrend ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend}
          </p>
        )}
        {hint && !trend && (
          <p className="mt-1 truncate text-xs text-textSecondary dark:text-darkTextSecondary">
            {hint}
          </p>
        )}
      </div>
      <div className={`icon-tile ${ICON_TONE[iconTone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </article>
  )
}
