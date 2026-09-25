import React, { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type Item = { name: string; value: number; color: string }

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

export default function CostDistribution({ data }: { data: Item[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const total = useMemo(() => data.reduce((s, it) => s + it.value, 0), [data])

  const active = activeIndex === null ? null : data[activeIndex]

  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-3 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            Distribución de Costos Cloud
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Mensual</span>
          </h3>
          <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">Desglose acumulado por categoría de servicio AWS</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Gasto Total Proyectado</p>
          <p className="mt-1 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
            {currency.format(total)} <span className="text-sm font-medium text-textSecondary">/ mes</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="relative md:col-span-5 flex items-center justify-center">
          <div className="w-full max-w-md">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={3}
                  onMouseEnter={(_, index) => setActiveIndex(index as number)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      stroke={idx === activeIndex ? '#00000020' : 'transparent'}
                      strokeWidth={idx === activeIndex ? 6 : 0}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-sm text-textSecondary dark:text-darkTextSecondary">{active ? active.name : 'Total'}</p>
              <p className="mt-1 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">{active ? currency.format(active.value) : currency.format(total)}</p>
              <p className="mt-0.5 text-xs text-textSecondary dark:text-darkTextSecondary">{active ? `${Math.round((active.value / total) * 100)}%` : '100%'}</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="flex flex-col gap-3">
            {data.map((item, idx) => {
              const pct = Math.round((item.value / total) * 100)
              const isActive = activeIndex === idx
              return (
                <button
                  key={item.name}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 text-left transition-shadow hover:shadow-sm dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary ${isActive ? 'shadow-md' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ background: item.color }} className="h-3 w-3 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-textPrimary dark:text-darkTextPrimary">{item.name}</p>
                      <p className="mt-0.5 text-xs text-textSecondary dark:text-darkTextSecondary">{pct}% • {currency.format(item.value)}</p>
                    </div>
                  </div>

                  <div className="ml-4 flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-darkBackground">
                      <div style={{ width: `${pct}%`, background: item.color }} className="h-2" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
