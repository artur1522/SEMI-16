import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

interface UptimeCardProps {
  uptime: number
  series: number[]
  period: string
}

export default function UptimeCard({ uptime, series, period }: UptimeCardProps) {
  const data = series.map((value, index) => ({ index, value }))

  return (
    <article className="card-tile">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="metric-label">Uptime general</p>
          <p className="metric-value">
            {uptime.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            %
          </p>
          <p className="mt-1 text-xs font-semibold text-success dark:text-darkSuccess">{period}</p>
        </div>
        <div className="icon-tile bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess">
          <Activity className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 h-12 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#16A34A"
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
