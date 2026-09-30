import { ArrowUpRight, Box, Gauge, Layers, Users } from 'lucide-react'
import {
  AVAILABILITY_META,
  NETWORK_HEALTH_META,
  PRIORITY_META,
  SECURITY_POSTURE_META,
  SERVICE_LABELS,
  STAGE_META,
  STATUS_META,
  projectMonthlyCost,
  type CloudProject,
  type Tone
} from '../data/cloudOpsData'
import { Badge, KeyValue, ProgressBar } from './ui'

const money = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

interface ProjectCardProps {
  project: CloudProject
  regionName?: string
  onSelect?: (project: CloudProject) => void
  /** Bloque adicional (acciones, botones). */
  footer?: React.ReactNode
  /** Etiqueta de la métrica principal. */
  costLabel?: string
}

export default function ProjectCard({
  project,
  regionName,
  onSelect,
  footer,
  costLabel = 'Costo mensual'
}: ProjectCardProps) {
  const cost = project.liveMonthlyCost ?? projectMonthlyCost(project)
  const usage = project.monthlyBudget > 0 ? (cost / project.monthlyBudget) * 100 : 0
  const usageTone: Tone =
    usage > 100 ? 'danger' : usage > 85 ? 'warning' : 'success'
  const status = STATUS_META[project.status]
  const stage = STAGE_META[project.stage]
  const posture = SECURITY_POSTURE_META[project.security.posture]
  const health = NETWORK_HEALTH_META[project.network.health]
  const availability = AVAILABILITY_META[project.availabilityLevel]

  return (
    <article className="card-tile flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">{project.code}</span>
          <h3 className="mt-1 text-base font-semibold text-textPrimary dark:text-darkTextPrimary">
            {project.name}
          </h3>
        </div>
        <Badge tone={status.tone} dot className="shrink-0">
          {status.label}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone={stage.tone}>{stage.label}</Badge>
        <Badge tone={PRIORITY_META[project.priority].tone}>
          {PRIORITY_META[project.priority].label}
        </Badge>
        <Badge tone={availability.tone}>{availability.sla}</Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
        {project.description}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <KeyValue label="Región">{regionName ?? project.regionId}</KeyValue>
        <KeyValue label="Responsable">{project.owner}</KeyValue>
        <KeyValue label="Usuarios">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-accentFrom dark:text-darkAccentFrom" />
            {project.estimatedUsers.toLocaleString('es-ES')}
          </span>
        </KeyValue>
        <KeyValue label="Postura">{posture.label}</KeyValue>
      </dl>

      <div className="divider mt-4 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{costLabel}</p>
            <p className="metric-value text-xl">{money.format(cost)}</p>
          </div>
          <div className="text-right text-xs text-textSecondary dark:text-darkTextSecondary">
            <p>Presupuesto {money.format(project.monthlyBudget)}</p>
            <p className="font-semibold tabular-nums" >
              {Math.round(usage)}% usado
            </p>
          </div>
        </div>
        <ProgressBar percent={usage} tone={usageTone} className="mt-2" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {project.services.slice(0, 5).map((id) => (
          <span key={id} className="badge badge-neutral">
            {SERVICE_LABELS[id] ?? id.toUpperCase()}
          </span>
        ))}
        {project.services.length > 5 && (
          <span className="badge badge-neutral">+{project.services.length - 5}</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-textSecondary dark:text-darkTextSecondary">
        <span className="inline-flex items-center gap-1">
          <Gauge className={`h-3.5 w-3.5 ${health.tone === 'success' ? 'text-success' : health.tone === 'warning' ? 'text-warning' : 'text-danger'}`} />
          Red {health.label}
        </span>
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-accentFrom dark:text-darkAccentFrom" />
          {project.resources.reduce((n, r) => n + r.quantity, 0)} recursos
        </span>
        <span className="inline-flex items-center gap-1">
          <Box className="h-3.5 w-3.5 text-accentFrom dark:text-darkAccentFrom" />
          {project.appType}
        </span>
      </div>

      <div className="divider mt-4" />
      {footer ??
        (onSelect && (
          <button
            type="button"
            onClick={() => onSelect(project)}
            className="btn btn-secondary btn-sm mt-4 w-full"
          >
            Ver detalle
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
    </article>
  )
}
