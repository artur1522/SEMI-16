import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
}

export default function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  const isPositiveTrend = trend?.startsWith('+')

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-textSecondary dark:text-darkTextSecondary">
          {title}
        </p>
        <p className="mt-1 truncate text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
          {value}
        </p>
        {trend && (
          <p
            className={`mt-1 flex items-center gap-1 text-xs font-medium ${
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
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}