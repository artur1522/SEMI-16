import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface UptimeCardProps {
  uptime: number
  series: number[]
  period: string
}

export default function UptimeCard({ uptime, series, period }: UptimeCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const lineColor = isDark ? '#22C55E' : '#16A34A'
  const data = series.map((value, index) => ({ index, value }))

  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-textSecondary dark:text-darkTextSecondary">
            Uptime general
          </p>
          <p className="mt-1 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
            {uptime.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </p>
          <p className="mt-1 text-xs font-medium text-success dark:text-darkSuccess">{period}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
          <Activity className="h-6 w-6" />
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