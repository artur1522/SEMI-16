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

const serviceFullNames: Record<string, string> = {
  EC2: 'Elastic Compute Cloud',
  S3: 'Simple Storage Service',
  RDS: 'Relational Database Service',
  CloudFront: 'Content Delivery Network',
  'Route 53': 'Domain Name System',
  'VPC (NAT Gateway)': 'Virtual Private Cloud / NAT Gateway'
}

export default function CostCard({ item }: CostCardProps) {
  const stats = [
    { label: 'Cantidad', value: `${item.quantity}`, icon: Boxes },
    { label: 'Horas estimadas', value: `${item.estimatedHours}`, icon: Clock },
    { label: 'Costo mensual', value: formatter.format(item.monthlyCost), icon: Wallet },
    { label: 'Costo anual', value: formatter.format(item.annualCost), icon: Calendar }
  ]

  return (
    <article className="section-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="section-title">{item.service}</h3>
          <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
            {serviceFullNames[item.service] ?? 'Servicio de infraestructura en la nube'}
          </p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-textSecondary dark:text-darkTextSecondary">
          {formatter.format(item.unitCost)}/unidad
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="badge badge-solid">{item.category}</span>
        <span className="badge badge-neutral">{environmentLabels[item.environment]}</span>
      </div>

      <dl className="section-body grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-control bg-background p-3 dark:bg-darkBackground"
          >
            <Icon className="h-4 w-4 shrink-0 text-accentFrom dark:text-darkAccentFrom" />
            <div className="min-w-0">
              <dt className="truncate text-xs text-textSecondary dark:text-darkTextSecondary">
                {label}
              </dt>
              <dd className="truncate text-sm font-semibold tabular-nums text-textPrimary dark:text-darkTextPrimary">
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </article>
  )
}