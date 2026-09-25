import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
}

export default function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isPositiveTrend = trend?.startsWith('+')

  return (
    <div
      className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:border-accentFrom/40 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.18),0_12px_24px_rgba(124,58,237,0.08)] dark:border-darkBorder dark:bg-darkCard dark:hover:border-darkAccentFrom/50 dark:hover:shadow-[0_0_0_1px_rgba(139,92,246,0.2),0_12px_24px_rgba(139,92,246,0.12)]"
      style={{
        backgroundImage: isDark
          ? 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(236,72,153,0.04), rgba(26,20,51,0.96))'
          : 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,72,153,0.04), rgba(255,255,255,0.98))'
      }}
    >
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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 dark:bg-darkPrimary/10 dark:text-darkPrimary dark:ring-darkPrimary/10">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}