import { useEffect, useRef, useState } from 'react'
import { Info, PiggyBank, Plus, Server, Workflow, Trash2 } from 'lucide-react'
import RegionCard from '../components/RegionCard'
import RegionMap from '../components/RegionMap'
import { useCloudStore } from '../store/cloudStore'
import { regionReferences } from '../data/regions'
import { awsServices } from '../data/awsServices'
import { getServerMeaning } from '../data/serverNames'
import { plannedResourceCount } from '../data/cloudOpsData'
import { Badge, Button, Field, PageHeader, ProgressBar, Section, SelectInput } from '../components/ui'
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
  'us-west-2': { id: 'us-east-1', name: 'US East (N. Virginia)', latencyMs: 78 },
  'us-east-1': { id: 'eu-west-1', name: 'EU (Ireland)', latencyMs: 65 },
  'sa-east-1': { id: 'us-east-1', name: 'US East (N. Virginia)', latencyMs: 75 },
  'eu-west-1': { id: 'us-east-1', name: 'US East (N. Virginia)', latencyMs: 65 },
  'eu-central-1': { id: 'eu-west-1', name: 'EU (Ireland)', latencyMs: 18 },
  'ap-south-1': { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', latencyMs: 62 },
  'ap-northeast-1': { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', latencyMs: 68 },
  'ap-southeast-1': { id: 'eu-west-1', name: 'EU (Ireland)', latencyMs: 115 }
}

const COMPLIANCE_MAP: Record<string, string[]> = {
  'us-west-2': ['SOC 2', 'ISO 27001'],
  'us-east-1': ['SOC 2', 'ISO 27001'],
  'sa-east-1': ['LGPD'],
  'eu-west-1': ['GDPR', 'ISO 27001'],
  'eu-central-1': ['GDPR', 'ISO 27001'],
  'ap-south-1': ['ISO 27001'],
  'ap-northeast-1': ['APPI', 'ISO 27001'],
  'ap-southeast-1': ['PDPA', 'ISO 27001']
}

type ReplicationState = 'synced' | 'lagging'

const regionPricing: Record<string, { factor: number; currency: string }> = {
  'us-west-2': { factor: 1.04, currency: 'USD' },
  'us-east-1': { factor: 1.0, currency: 'USD' },
  'sa-east-1': { factor: 1.28, currency: 'BRL' },
  'eu-west-1': { factor: 0.92, currency: 'EUR' },
  'eu-central-1': { factor: 0.96, currency: 'EUR' },
  'ap-south-1': { factor: 0.88, currency: 'INR' },
  'ap-northeast-1': { factor: 1.08, currency: 'JPY' },
  'ap-southeast-1': { factor: 1.36, currency: 'SGD' }
}

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
  const { servers, regions, addServer, removeServer, projects } = useCloudStore()
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
    const baseCompute =
      service.id === 's3'
        ? 0.023
        : service.id === 'rds'
          ? 0.235
          : service.id === 'nat'
            ? 0.062
            : 0.045
    const productName =
      service.name === 'EC2'
        ? 'm5.large'
        : service.name === 'RDS'
          ? 'db.t3.micro'
          : service.name === 'VPC'
            ? 'NAT Gateway'
            : service.name === 'Route 53'
              ? 'Zonas DNS'
              : service.name
    return { service: productName, unit: baseCompute }
  })

  const planned = plannedResourceCount(projects)
  const provisionProgress = planned > 0 ? Math.min(100, (servers.length / planned) * 100) : 0

  return (
    <div className="page">
      <PageHeader
        eyebrow="Operación cloud"
        title="Infraestructura Global"
        description="Regiones, zonas de disponibilidad e inventario de recursos en tiempo real."
        badge={<Badge tone={operationalCount === regions.length ? 'success' : 'warning'} dot>
          {operationalCount} de {regions.length} regiones operativas
        </Badge>}
        actions={<Badge tone="info">{servers.length} servidores</Badge>}
      />

      <div className="flex flex-wrap items-center gap-4 text-xs text-textSecondary dark:text-darkTextSecondary">
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

      <RegionMap regions={regions} servers={servers} />

      <Section
        title="Plan frente al inventario"
        description="Recursos planificados en el portafolio de proyectos vs. servidores realmente provisionados."
        icon={Server}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="panel-muted">
            <p className="eyebrow">Recursos planificados</p>
            <p className="metric-value text-xl">{planned}</p>
          </div>
          <div className="panel-muted">
            <p className="eyebrow">Recursos provisionados</p>
            <p className="metric-value text-xl">{servers.length}</p>
          </div>
          <div className="panel-muted">
            <p className="eyebrow">Avance de aprovisionamiento</p>
            <p className="metric-value text-xl">{Math.round(provisionProgress)}%</p>
          </div>
        </div>
        <ProgressBar percent={provisionProgress} tone="info" className="mt-4" />
      </Section>

      <Section
        title="Inventario en tiempo real"
        icon={Server}
        actions={<Badge tone="accent">{servers.length} servidores</Badge>}
        description="Agrega o retira servidores: el mapa, el dashboard y los costos se recalculan al instante."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Servicio">
            <SelectInput value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {awsServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Región">
            <SelectInput value={regionId} onChange={(event) => setRegionId(event.target.value)}>
              {regionReferences.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Entorno">
            <SelectInput
              value={environment}
              onChange={(event) => setEnvironment(event.target.value as CostEnvironment)}
            >
              {environments.map((env) => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex items-end">
            <Button type="button" variant="accent" icon={Plus} onClick={handleAdd} className="w-full">
              Agregar servidor
            </Button>
          </div>
        </div>

        <div className="hint-bar mt-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-accentFrom dark:text-darkAccentFrom" />
          <p>
            Los nombres usan el formato{' '}
            <span className="font-semibold text-textPrimary dark:text-darkTextPrimary">
              servicio-región-número
            </span>
            . Debajo de cada nombre se muestra su significado completo.
          </p>
        </div>

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
          {servers.map((server) => {
            const isRecentlyAdded = server.id === lastAddedServerId

            return (
              <div
                key={server.id}
                ref={(node) => {
                  serverRowRefs.current[server.id] = node
                }}
                className={`flex items-center justify-between gap-3 rounded-control border p-3 transition-all duration-300 ${
                  isRecentlyAdded
                    ? 'border-accentFrom/50 bg-accentFrom/5 shadow-[0_0_0_1px_rgba(124,58,237,0.28),0_0_24px_rgba(124,58,237,0.16)] dark:border-darkAccentFrom/50 dark:bg-darkAccentFrom/10 dark:shadow-[0_0_0_1px_rgba(139,92,246,0.35),0_0_24px_rgba(139,92,246,0.18)]'
                    : 'border-border bg-surface dark:border-darkBorder dark:bg-darkBackground'
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
                    {isRecentlyAdded && <Badge tone="accent">Nuevo</Badge>}
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
            <p className="empty-state">Sin servidores. Agrega el primero arriba.</p>
          )}
        </div>
      </Section>

      <Section title="Regiones y zonas de disponibilidad">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </Section>

      <Section
        title="Comparativa de precios por región"
        icon={PiggyBank}
        badge={<Badge tone="warning">Simulado</Badge>}
        actions={
          <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
            Mismo servicio, costo unitario distinto según región (factores relativos a us-east-1).
          </p>
        }
      >
        <div className="table-wrap">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th scope="col">Servicio</th>
                {regionReferences.map((region) => (
                  <th key={region.id} scope="col">
                    {region.name}
                    <span className="block font-normal normal-case">
                      {regionPricing[region.id]?.factor}x
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servicePricingRows.map((row) => (
                <tr key={row.service}>
                  <td className="font-medium">{row.service}</td>
                  {regionReferences.map((region) => (
                    <td key={region.id} className="tabular-nums text-accentFrom dark:text-darkAccentFrom">
                      {formatPrice(row.unit, regionPricing[region.id]?.factor ?? 1, row.unit < 0.1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Replicación y sincronización entre regiones"
        icon={Workflow}
        badge={<Badge tone="warning">Simulado</Badge>}
        description="Estado de sincronización de datos y servicios entre cada región primaria y su respaldo sugerido."
      >
        {regions.length === 0 ? (
          <p className="panel-muted text-sm text-textSecondary dark:text-darkTextSecondary">
            Sin regiones desplegadas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {regions.map((region) => {
              const backup = FAILOVER_MAP[region.id]
              if (!backup) return null
              const state = getReplicationState(region.id)
              return (
                <div
                  key={region.id}
                  className="flex items-center justify-between gap-3 rounded-control border border-border bg-background p-4 dark:border-darkBorder dark:bg-darkBackground"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                      {region.name}{' '}
                      <span className="text-xs font-normal text-textSecondary dark:text-darkTextSecondary">
                        → {backup.name}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-textSecondary dark:text-darkTextSecondary">
                      {region.deployedServices.length === 0
                        ? 'Sin servicios replicables'
                        : `Replica ${region.deployedServices.join(', ')} · RTT ${backup.latencyMs} ms`}
                    </p>
                  </div>
                  <Badge tone={state === 'synced' ? 'success' : 'warning'} dot className="shrink-0">
                    {state === 'synced' ? 'Sincronizado' : 'Con desfase'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}
