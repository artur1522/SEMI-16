import { ShieldCheck, type LucideIcon } from 'lucide-react'
import StatusBadge, { type StatusBadgeStatus } from './StatusBadge'

interface SecurityCardProps {
  title: string
  description: string
  status: StatusBadgeStatus
  icon?: LucideIcon
}

const iconStyles: Record<StatusBadgeStatus, string> = {
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
  icon: Icon = ShieldCheck
}: SecurityCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyles[status]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <StatusBadge status={status} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-textPrimary dark:text-darkTextPrimary">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
        {description}
      </p>
    </article>
  )
}