import { useState } from 'react'
import { Boxes, ChevronDown, HeartPulse, Layers, MapPin, RefreshCw, ShieldCheck, Signal, Workflow } from 'lucide-react'
import type { Region } from '../types/cloud'
import { awsServices } from '../data/awsServices'
import StatusBadge from './StatusBadge'

interface RegionCardProps {
  region: Region
  failover?: { id: string; name: string; latencyMs: number }
  compliance?: string[]
  replication?: 'synced' | 'lagging'
}

export default function RegionCard({ region, failover, compliance, replication }: RegionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const latencyTextColor =
    region.latencyMs < 50
      ? 'text-success dark:text-darkSuccess'
      : region.latencyMs <= 150
        ? 'text-warning dark:text-darkWarning'
        : 'text-danger dark:text-darkDanger'

  return (
    <article className={`glass-card flex flex-col rounded-3xl p-6 transition-all duration-300 ${expanded ? 'border-violet-300/60 shadow-[0_16px_45px_rgba(124,58,237,0.15)] dark:border-violet-400/35 dark:shadow-[0_16px_45px_rgba(139,92,246,0.18)]' : ''}`}>
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
         className="flex w-full items-start justify-between gap-3 rounded-xl p-2 text-left transition-all hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:focus:ring-darkAccentFrom/30"
        aria-expanded={expanded}
      >
        <div>
          <h3 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            {region.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-textSecondary dark:text-darkTextSecondary">
            <MapPin className="h-4 w-4 shrink-0 text-textSecondary dark:text-darkTextSecondary" />
            {region.location}
          </p>
          <p
            className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${latencyTextColor}`}
          >
            <Signal className="h-4 w-4 shrink-0" />
            Latencia: {region.latencyMs} ms
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={region.status} />
          <ChevronDown
             className={`h-5 w-5 transition-transform duration-300 ${
               expanded
                 ? 'rotate-180 text-accentFrom dark:text-darkAccentFrom'
                 : 'text-textSecondary dark:text-darkTextSecondary'
             }`}
          />
        </div>
      </button>

      {failover && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 dark:border-darkPrimary/30 dark:bg-darkPrimary/5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-textSecondary dark:text-darkTextSecondary">
              <Workflow className="h-3.5 w-3.5 text-primary dark:text-darkPrimary" />
              Región de respaldo sugerida
            </p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
              {failover.name}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-textSecondary dark:text-darkTextSecondary">
            <HeartPulse className="h-3.5 w-3.5 text-warning dark:text-darkWarning" />
            Distancia de failover estimada: <span className="font-semibold">{failover.latencyMs} ms</span> de RTT
          </p>
        </div>
      )}

      <div className="mt-4">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
          <Boxes className="h-4 w-4" />
          Servicios desplegados
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {region.deployedServices.map((serviceId) => {
            const service = awsServices.find((item) => item.id === serviceId)
            return (
              <span
                key={serviceId}
                className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs dark:bg-darkPrimary/10"
              >
                <span className="block font-semibold text-primary dark:text-darkPrimary">
                  {service?.name ?? serviceId}
                </span>
                {service?.fullName && (
                  <span className="block text-[10px] leading-tight text-textSecondary dark:text-darkTextSecondary">
                    {service.fullName}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>

      {compliance && compliance.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            <ShieldCheck className="h-4 w-4" />
            Cumplimiento normativo
            <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
              Simulado
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {compliance.map((item) => (
              <span key={item} className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success dark:bg-darkSuccess/10 dark:text-darkSuccess">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mt-4 border-t border-border pt-4 dark:border-darkBorder">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            <Layers className="h-4 w-4" />
            Zonas de disponibilidad ({region.availabilityZones.length})
          </p>
          <ul className="mt-2 space-y-2">
            {region.availabilityZones.map((zone) => (
              <li
                key={zone.name}
                className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 dark:bg-darkBackground"
              >
                <span className="text-sm font-medium text-textPrimary dark:text-darkTextPrimary">
                  {zone.name}
                </span>
                <StatusBadge status={zone.status} />
              </li>
            ))}
          </ul>

          {replication && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                <RefreshCw className="h-4 w-4" />
                Replicación
              </p>
              <p
                className={`mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${
                  replication === 'synced'
                    ? 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess'
                    : 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning'
                }`}
              >
                <RefreshCw className="h-4 w-4" />
                {replication === 'synced'
                  ? 'Sincronización al día'
                  : 'Réplica con desfase: revisar replicación'}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}