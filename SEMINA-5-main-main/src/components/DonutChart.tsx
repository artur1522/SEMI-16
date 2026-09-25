import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../hooks/useTheme'

interface CostItem {
  name: string
  value: number
  color: string
}

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

export default function DonutChart({ data }: { data: CostItem[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const total = data.reduce((s, d) => s + d.value, 0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const hovered = activeIndex !== null ? data[activeIndex] : null
  const accentFrom = isDark ? '#8B5CF6' : '#7C3AED'
  const accentTo = '#EC4899'
  const gradientId = isDark ? 'donut-accent-dark' : 'donut-accent-light'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-darkTextPrimary">
              Distribución de Costos Cloud
            </h2>
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:bg-darkPrimary/15 dark:text-darkPrimary">
              Mensual
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-darkTextSecondary">
            Desglose acumulado por categoría de servicio AWS
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-darkTextSecondary">
            Gasto Total Proyectado
          </p>
          <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-darkTextPrimary">
            {currency.format(total)}
          </p>
          <p className="text-xs text-slate-400 dark:text-darkTextSecondary">/ mes</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <div className="mx-auto aspect-square w-full max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={accentFrom} />
                    <stop offset="100%" stopColor={accentTo} />
                  </linearGradient>
                </defs>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={activeIndex === null || activeIndex === index ? `url(#${gradientId})` : entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                      style={{ transition: 'opacity 0.2s ease', cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => currency.format(value)}
                  contentStyle={{
                    backgroundColor: isDark ? '#1A1433' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#31214F' : '#E2E8F0'}`,
                    borderRadius: '12px',
                    color: isDark ? '#E5E7EB' : '#1E293B'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-darkTextSecondary">
                {hovered ? hovered.name : 'Total'}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-darkTextPrimary">
                {hovered ? currency.format(hovered.value) : currency.format(total)}
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-darkTextSecondary">
                {hovered ? `${((hovered.value / total) * 100).toFixed(1)}% del total` : `${data.length} categorías`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 md:col-span-3">
          {data.map((item, index) => {
            const pct = ((item.value / total) * 100).toFixed(0)
            const isActive = activeIndex === index
            return (
              <div
                key={item.name}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? 'border-slate-300 bg-slate-50 shadow-sm dark:border-darkBorder dark:bg-darkBackground'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-darkBackground/70'
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-darkTextPrimary">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 dark:text-darkTextSecondary">
                        {pct}%
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-darkTextPrimary">
                        {currency.format(item.value)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-darkBackground">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(item.value / total) * 100}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
