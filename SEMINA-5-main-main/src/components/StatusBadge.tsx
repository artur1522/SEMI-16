import type { ServiceStatus, RegionStatus } from '../types/cloud'
import type { Tone } from '../data/cloudOpsData'

export type StatusBadgeStatus = ServiceStatus | RegionStatus

const TONE: Record<StatusBadgeStatus, Tone> = {
  active: 'success',
  operational: 'success',
  warning: 'warning',
  degraded: 'warning',
  inactive: 'danger',
  down: 'danger'
}

const TONE_CLASS: Record<Tone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
  accent: 'badge-accent'
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
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const tone = TONE[status]
  return (
    <span className={`badge ${TONE_CLASS[tone]} ${className}`} title={labels[status]}>
      <span className="badge-dot" aria-hidden="true" />
      {labels[status]}
    </span>
  )
}
