import { useEffect, useRef, useState } from 'react'
import { Info, PiggyBank, Plus, Server, ShieldCheck, Workflow, Trash2 } from 'lucide-react'
import RegionCard from '../components/RegionCard'
import { useCloudStore } from '../store/cloudStore'
import { regionReferences } from '../data/regions'
import { awsServices } from '../data/awsServices'
import { getServerMeaning } from '../data/serverNames'
import type { CostEnvironment } from '../types/cloud'

const environments: { value: CostEnvironment; label: string }[] = [
  { value: 'dev', label: 'Dev' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Producción' }
]

interface FailoverSuggestion {
  id: string
  name: string
  latencyMs: number
}

const FAILOVER_MAP: Record<string, FailoverSuggestion> = {
  'us-east-1': { id: 'eu-west-1', name: 'EU (Ireland)', latencyMs: 65 },
  'sa-east-1': { id: 'us-east-1', name: 'US East (N. Virginia)', latencyMs: 75 },
  'eu-west-1': { id: 'us-east-1', name: 'US East (N. Virginia)', latencyMs: 65 },
  'ap-southeast-1': { id: 'eu-west-1', name: 'EU (Ireland)', latencyMs: 115 }
}

const COMPLIANCE_MAP: Record<string, string[]> = {
  'us-east-1': ['SOC 2', 'ISO 27001'],
  'sa-east-1': ['LGPD'],
  'eu-west-1': ['GDPR', 'ISO 27001'],
  'ap-southeast-1': ['PDPA', 'ISO 27001']
}

type ReplicationState = 'synced' | 'lagging'

const regionPricing: Record<string, { factor: number; currency: string }> = {
  'us-east-1': { factor: 1.0, currency: 'USD' },
  'sa-east-1': { factor: 1.28, currency: 'BRL' },
  'eu-west-1': { factor: 0.92, currency: 'EUR' },
  'ap-southeast-1': { factor: 1.36, currency: 'SGD' }
}

const pricingUnits = ['$0.023', '$0.045']

function formatPrice(amount: number, factor: number, isStorage: boolean) {
  const value = amount * factor
  return isStorage ? `$${value.toFixed(3)}/GB` : `$${value.toFixed(2)}`
}

function getReplicationState(regionId: string): ReplicationState {
  const zoneIssues = regionReferences
    .find((r) => r.id === regionId)
    ?.availabilityZones.some((zone) => zone.status !== 'active')
  return zoneIssues ? 'lagging' : 'synced'
}

export default function Infrastructure() {
  const { servers, regions, addServer, removeServer } = useCloudStore()
  const operationalCount = regions.filter((region) => region.status === 'operational').length

  const [serviceId, setServiceId] = useState('ec2')
  const [regionId, setRegionId] = useState(regionReferences[0].id)
  const [environment, setEnvironment] = useState<CostEnvironment>('production')
  const [lastAddedServerId, setLastAddedServerId] = useState<string | null>(null)
  const serverRowRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!lastAddedServerId) return

    const node = serverRowRefs.current[lastAddedServerId]
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    const timeout = window.setTimeout(() => {
      setLastAddedServerId(null)
    }, 2200)

    return () => window.clearTimeout(timeout)
  }, [lastAddedServerId])

  function handleAdd() {
    const newServer = addServer({ serviceId, regionId, environment })
    setLastAddedServerId(newServer.id)
  }

  const servicePricingRows = awsServices.map((service) => {
    const baseCompute = service.id === 's3' ? 0.023 : service.id === 'rds' ? 0.235 : service.id === 'nat' ? 0.062 : 0.045
    const productName = service.name === 'EC2' ? 'm5.large' : service.name === 'RDS' ? 'db.t3.micro' : service.name === 'VPC' ? 'NAT Gateway' : service.name === 'Route 53' ? 'Zonas DNS' : service.name
    return { service: productName, unit: baseCompute }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
        Infraestructura Global
      </h1>
      <p className="mt-2 text-textSecondary dark:text-darkTextSecondary">
        {operationalCount} de {regions.length} regiones operativas · {servers.length} servidores en total
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-textSecondary dark:text-darkTextSecondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success dark:bg-darkSuccess" />
          Latencia baja (&lt; 50 ms)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning dark:bg-darkWarning" />
          Latencia media (50–150 ms)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger dark:bg-darkDanger" />
          Latencia alta (&gt; 150 ms)
        </span>
      </div>

      <section className="glass-card mt-6 rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
              <Server className="h-5 w-5 text-primary dark:text-darkPrimary" />
              Inventario en tiempo real
            </h2>
            <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
              Agrega o retira servidores: el mapa, el dashboard y los costos se recalculan al instante.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
            {servers.length} servidores
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            Servicio
            <select
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentFrom/20 dark:focus:ring-darkAccentFrom/20 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary"
            >
              {awsServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            Región
            <select
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentFrom/20 dark:focus:ring-darkAccentFrom/20 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary"
            >
              {regionReferences.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            Entorno
            <select
              value={environment}
              onChange={(event) => setEnvironment(event.target.value as CostEnvironment)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentFrom/20 dark:focus:ring-darkAccentFrom/20 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary"
            >
              {environments.map((env) => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgba(124,58,237,0.2)] transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accentFrom/40 dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_16px_rgba(139,92,246,0.26)] dark:focus:ring-darkAccentFrom/40 md:w-auto"
            >
              <Plus className="h-4 w-4" />
              Agregar servidor
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-accentFrom/20 bg-gradient-to-r from-accentFrom/5 to-accentTo/5 p-3 text-xs leading-relaxed text-textSecondary dark:border-darkAccentFrom/30 dark:from-darkAccentFrom/10 dark:to-darkAccentTo/10 dark:text-darkTextSecondary">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accentFrom dark:text-darkAccentFrom" />
          <p>
            Los nombres usan el formato <span className="font-semibold text-textPrimary dark:text-darkTextPrimary">servicio-región-número</span>. Debajo de cada nombre se muestra su significado completo.
          </p>
        </div>

        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
          {servers.map((server) => {
            const isRecentlyAdded = server.id === lastAddedServerId

            return (
            <div
              key={server.id}
              ref={(node) => {
                serverRowRefs.current[server.id] = node
              }}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all duration-300 ${
                isRecentlyAdded
                  ? 'border-violet-300/60 bg-violet-500/[0.06] shadow-[0_0_0_1px_rgba(168,85,247,0.28),0_0_24px_rgba(168,85,247,0.16)] dark:border-violet-400/40 dark:bg-violet-500/10 dark:shadow-[0_0_0_1px_rgba(192,132,252,0.35),0_0_24px_rgba(168,85,247,0.18)]'
                  : 'border-white/40 bg-white/60 dark:border-white/5 dark:bg-slate-900/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className="truncate text-sm font-semibold text-textPrimary dark:text-darkTextPrimary"
                    title={getServerMeaning(server)}
                  >
                    {server.name}
                  </p>
                  {isRecentlyAdded && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
                      Nuevo
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-textSecondary dark:text-darkTextSecondary">
                  {getServerMeaning(server)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeServer(server.id)}
                aria-label={`Eliminar ${server.name}: ${getServerMeaning(server)}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-textSecondary transition-colors hover:bg-danger/10 hover:text-danger dark:text-darkTextSecondary dark:hover:bg-darkDanger/10 dark:hover:text-darkDanger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            )
          })}
          {servers.length === 0 && (
            <p className="rounded-xl bg-background p-4 text-center text-sm text-textSecondary dark:bg-darkBackground dark:text-darkTextSecondary">
              Sin servidores. Agrega el primero arriba.
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {regions.map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            failover={FAILOVER_MAP[region.id]}
            compliance={COMPLIANCE_MAP[region.id]}
            replication={getReplicationState(region.id)}
          />
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            <PiggyBank className="h-5 w-5 text-primary dark:text-darkPrimary" />
            Comparativa de precios por región
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
              Simulado
            </span>
          </h2>
          <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
            Mismo servicio, costo unitario distinto según región (factores relativos a us-east-1).
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-textSecondary dark:border-darkBorder dark:text-darkTextSecondary">
                <th className="px-2 py-2">Servicio</th>
                {regionReferences.map((region) => (
                  <th key={region.id} className="px-2 py-2">
                    {region.name}
                    <span className="block font-normal normal-case">{regionPricing[region.id]?.factor}x</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servicePricingRows.map((row) => (
                <tr key={row.service} className="border-b border-border dark:border-darkBorder">
                  <td className="px-2 py-2 font-medium text-textPrimary dark:text-darkTextPrimary">
                    {row.service}
                  </td>
                  {regionReferences.map((region) => (
                    <td key={region.id} className="px-2 py-2 text-primary dark:text-darkPrimary">
                      {formatPrice(row.unit, regionPricing[region.id]?.factor ?? 1, row.unit < 0.1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            <Workflow className="h-5 w-5 text-primary dark:text-darkPrimary" />
            Replicación y sincronización entre regiones
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
              Simulado
            </span>
          </h2>
        </div>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Estado de sincronización de datos y servicios entre cada región primaria y su respaldo sugerido.
        </p>
        {regions.length === 0 ? (
          <p className="mt-4 rounded-xl bg-background p-4 text-sm text-textSecondary dark:bg-darkBackground dark:text-darkTextSecondary">
            Sin regiones desplegadas.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {regions.map((region) => {
              const backup = FAILOVER_MAP[region.id]
              if (!backup) return null
              const state = getReplicationState(region.id)
              return (
                <div key={region.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 dark:border-darkBorder dark:bg-darkBackground">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                      {region.name} <span className="text-xs font-normal text-textSecondary dark:text-darkTextSecondary">→ {backup.name}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-textSecondary dark:text-darkTextSecondary">
                      {region.deployedServices.length === 0
                        ? 'Sin servicios replicables'
                        : `Replica ${region.deployedServices.join(', ')} · RTT ${backup.latencyMs} ms`}
                    </p>
                  </div>
                  <span
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      state === 'synced'
                        ? 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess'
                        : 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${state === 'synced' ? 'bg-success dark:bg-darkSuccess' : 'bg-warning dark:bg-darkWarning'}`} />
                    {state === 'synced' ? 'Sincronizado' : 'Con desfase'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}