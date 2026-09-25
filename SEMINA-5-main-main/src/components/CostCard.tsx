import { Boxes, Clock, Calendar, Wallet } from 'lucide-react'
import type { CostCategory, CostEnvironment, CostItem } from '../types/cloud'

interface CostCardProps {
  item: CostItem
}

const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

const environmentLabels: Record<CostEnvironment, string> = {
  dev: 'Desarrollo',
  staging: 'Staging',
  production: 'Producción'
}

export default function CostCard({ item }: CostCardProps) {
  const stats = [
    { label: 'Cantidad', value: `${item.quantity}`, icon: Boxes },
    { label: 'Horas estimadas', value: `${item.estimatedHours}`, icon: Clock },
    { label: 'Costo mensual', value: formatter.format(item.monthlyCost), icon: Wallet },
    { label: 'Costo anual', value: formatter.format(item.annualCost), icon: Calendar }
  ]

  return (
    <article className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            {item.service}
          </h3>
        </div>
        <span className="text-xs text-textSecondary dark:text-darkTextSecondary">
          {formatter.format(item.unitCost)}/unidad
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
          {item.category}
        </span>
        <span className="rounded-full bg-textSecondary/10 px-2.5 py-1 text-xs font-medium text-textSecondary dark:bg-darkTextSecondary/10 dark:text-darkTextSecondary">
          {environmentLabels[item.environment]}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl bg-background p-3 dark:bg-darkBackground"
          >
            <Icon className="h-4 w-4 shrink-0 text-primary dark:text-darkPrimary" />
            <div className="min-w-0">
              <dt className="truncate text-xs text-textSecondary dark:text-darkTextSecondary">{label}</dt>
              <dd className="truncate text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </article>
  )
}