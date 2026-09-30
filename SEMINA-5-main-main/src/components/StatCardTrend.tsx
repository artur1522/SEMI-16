import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { Area, Line, LineChart, ResponsiveContainer } from 'recharts'
import { useTheme } from '../hooks/useTheme'

interface StatCardTrendProps {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
  history: number[]
  hint?: string
}

export default function StatCardTrend({
  title,
  value,
  icon: Icon,
  trend,
  history,
  hint
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
  const gradientId = `trend-fill-${isDark ? 'dark' : 'light'}-${title.replace(/\W+/g, '')}`
  const data = history.map((item, index) => ({ index, value: item }))

  return (
    <article className="card-tile">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="metric-label">{title}</p>
          <p className="metric-value">{value}</p>
          {trend && (
            <p
              className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
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
          {!trend && hint && (
            <p className="mt-1 truncate text-xs text-textSecondary dark:text-darkTextSecondary">
              {hint}
            </p>
          )}
        </div>
        <div className="icon-tile bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 h-12 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#8B5CF6' : '#7C3AED'} stopOpacity={0.35} />
                <stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke="none" fill={`url(#${gradientId})`} />
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
