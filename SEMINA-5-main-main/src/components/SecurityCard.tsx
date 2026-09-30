import { ShieldCheck, type LucideIcon } from 'lucide-react'
import StatusBadge, { type StatusBadgeStatus } from './StatusBadge'

interface SecurityCardProps {
  title: string
  description: string
  status: StatusBadgeStatus
  icon?: LucideIcon
  /** Puntuación / indicador numérico adicional. */
  value?: string
  valueLabel?: string
}

const TONE_CLASS: Record<StatusBadgeStatus, string> = {
  active: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess',
  operational: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess',
  warning: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
  degraded: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
  inactive: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger',
  down: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger'
}

export default function SecurityCard({
  title,
  description,
  status,
  icon: Icon = ShieldCheck,
  value,
  valueLabel
}: SecurityCardProps) {
  return (
    <article className="card-tile">
      <div className="flex items-start justify-between gap-3">
        <div className={`icon-tile ${TONE_CLASS[status]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <StatusBadge status={status} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
        {description}
      </p>

      {value && (
        <p className="divider mt-4 pt-3 text-xs text-textSecondary dark:text-darkTextSecondary">
          <span className="metric-value mr-1 inline-block align-middle text-xl">{value}</span>
          {valueLabel && <span>{valueLabel}</span>}
        </p>
      )}
    </article>
  )
}
