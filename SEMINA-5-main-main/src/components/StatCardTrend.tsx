import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { useTheme } from '../hooks/useTheme'

interface StatCardTrendProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  history: number[]
}

export default function StatCardTrend({
  title,
  value,
  icon: Icon,
  trend,
  history
}: StatCardTrendProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isPositive = history[history.length - 1] >= history[0]
  const lineColor = isPositive
    ? isDark
      ? '#22C55E'
      : '#16A34A'
    : isDark
      ? '#F87171'
      : '#DC2626'

  const data = history.map((item, index) => ({ index, value: item }))

  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex items-start justify-between gap-4">
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
                trend.startsWith('+') || trend.startsWith('↑')
                  ? 'text-success dark:text-darkSuccess'
                  : 'text-danger dark:text-darkDanger'
              }`}
            >
              {trend.startsWith('+') || trend.startsWith('↑') ? (
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

      <div className="mt-3 h-12 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}