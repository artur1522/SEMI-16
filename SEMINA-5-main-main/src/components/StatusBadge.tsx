import type { ServiceStatus, RegionStatus } from '../types/cloud'

export type StatusBadgeStatus = ServiceStatus | RegionStatus

const styles: Record<StatusBadgeStatus, string> = {
  active:
    'bg-success/10 text-success border-success/30 dark:bg-darkSuccess/10 dark:text-darkSuccess dark:border-darkSuccess/30',
  operational:
    'bg-success/10 text-success border-success/30 dark:bg-darkSuccess/10 dark:text-darkSuccess dark:border-darkSuccess/30',
  warning:
    'bg-warning/10 text-warning border-warning/30 dark:bg-darkWarning/10 dark:text-darkWarning dark:border-darkWarning/30',
  degraded:
    'bg-warning/10 text-warning border-warning/30 dark:bg-darkWarning/10 dark:text-darkWarning dark:border-darkWarning/30',
  inactive:
    'bg-danger/10 text-danger border-danger/30 dark:bg-darkDanger/10 dark:text-darkDanger dark:border-darkDanger/30',
  down:
    'bg-danger/10 text-danger border-danger/30 dark:bg-darkDanger/10 dark:text-darkDanger dark:border-darkDanger/30'
}

const dotColors: Record<StatusBadgeStatus, string> = {
  active: 'bg-success dark:bg-darkSuccess',
  operational: 'bg-success dark:bg-darkSuccess',
  warning: 'bg-warning dark:bg-darkWarning',
  degraded: 'bg-warning dark:bg-darkWarning',
  inactive: 'bg-danger dark:bg-darkDanger',
  down: 'bg-danger dark:bg-darkDanger'
}

const labels: Record<StatusBadgeStatus, string> = {
  active: 'Activo',
  operational: 'Operativo',
  warning: 'Advertencia',
  degraded: 'Degradado',
  inactive: 'Inactivo',
  down: 'Caído'
}

interface StatusBadgeProps {
  status: StatusBadgeStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[status]}`} />
      {labels[status]}
    </span>
  )
}