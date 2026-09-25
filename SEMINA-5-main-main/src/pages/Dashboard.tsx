import { useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Boxes,
  Calendar,
  DollarSign,
  Gauge,
  Info,
  Key,
  LayoutGrid,
  List,
  Network,
  Server,
  ShieldCheck,
  type LucideIcon
} from 'lucide-react'
import CostDistribution from '../components/CostDistribution'
import MaintenanceCard from '../components/MaintenanceCard'
import RangeSelector, { type RangeKey } from '../components/RangeSelector'
import RegionFilter from '../components/RegionFilter'
import RegionMap from '../components/RegionMap'
import StatCard from '../components/StatCard'
import StatCardTrend from '../components/StatCardTrend'
import StatusBadge from '../components/StatusBadge'
import SecurityCard from '../components/SecurityCard'
import TopCostServices from '../components/TopCostServices'
import UptimeCard from '../components/UptimeCard'
import { deriveMetrics, useCloudStore } from '../store/cloudStore'
import { usePreferences, useFormatters } from '../hooks/usePreferences'
import { regionReferences } from '../data/regions'
import type { CloudLog, CloudServer } from '../types/cloud'

const severityColors: Record<
  CloudLog['severity'],
  { icon: LucideIcon; classes: string }
> = {
  critical: {
    icon: AlertCircle,
    classes: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger'
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning'
  },
  info: {
    icon: Info,
    classes: 'bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary'
  }
}

const RANGE_HOURS: Record<RangeKey, number> = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30
}

const RANGE_LABELS: Record<RangeKey, string> = {
  '24h': 'últimas 24 h',
  '7d': 'últimos 7 días',
  '30d': 'este mes'
}

function formatRelative(timestamp: string): string {
  const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000))
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `hace ${diffHours} h`
  return `hace ${Math.round(diffHours / 24)} d`
}

function deriveTrend(history: number[], unit: string, period: string): string {
  if (history.length < 2) return unit === '%' ? '+0.0% en el período' : '+0 en el período'
  const first = history[0]
  const last = history[history.length - 1]
  const delta = last - first
  if (delta === 0) return unit === '%' ? '+0.0% en el período' : '+0 en el período'
  if (unit === '%') {
    const pct = (delta / (first || 1)) * 100
    return `${delta > 0 ? '+' : ''}${pct.toFixed(1)}% en ${period}`
  }
  return `${delta > 0 ? '+' : ''}${delta} en ${period}`
}

function computeUptimePercent(servers: CloudServer[]): number {
  if (servers.length === 0) return 100
  const total = servers.length
  const weighted = servers.reduce(
    (sum, server) => sum + (server.status === 'active' ? 1 : server.status === 'warning' ? 0.998 : 0.99),
    0
  )
  return (weighted / total) * 100
}

export default function Dashboard() {
  const { servers, events, history } = useCloudStore()
  const { preferences, updatePreferences } = usePreferences()
  const { formatCurrency } = useFormatters()

  const compact = preferences.density === 'compacto'

  const [trafficLoad, setTrafficLoad] = useState(false)
  const [range, setRange] = useState<RangeKey>('30d')
  const [regionId, setRegionId] = useState('all')

  const selectedRegion = regionId === 'all' ? null : regionReferences.find((r) => r.id === regionId)

  const filteredServers = selectedRegion
    ? servers.filter((server) => server.regionId === selectedRegion.id)
    : servers

  const scoped = useMemo(() => deriveMetrics(filteredServers), [filteredServers])
  const displayedRegions = selectedRegion
    ? scoped.regions.filter((region) => region.serversDeployed > 0)
    : scoped.regions

  const rangeMs = RANGE_HOURS[range] * 3_600_000
  const slice = history.filter((point) => point.at >= Date.now() - rangeMs)

  const serversSeries =
    slice.length > 0
      ? slice.map((point) =>
          selectedRegion ? (point.regionCounts[selectedRegion.id] ?? 0) : point.servers
        )
      : [filteredServers.length]

  const monthlySeries =
    slice.length > 0
      ? slice.map((point) =>
          selectedRegion ? (point.regionCost[selectedRegion.id] ?? 0) : point.monthlyCost
        )
      : [scoped.totalMonthly]

  const annualSeries = monthlySeries.map((value) => Math.round(value * 12))

  const uptimeSeries =
    slice.length > 0 ? slice.map((point) => point.uptime) : [computeUptimePercent(filteredServers)]
  const uptimeNow = computeUptimePercent(filteredServers)

  const loadFactor = trafficLoad ? 1.22 : 1

  const servicesValue = String(filteredServers.length)
  const servicesTrend = deriveTrend(serversSeries, '', RANGE_LABELS[range])

  const monthlyValue = formatCurrency(scoped.totalMonthly * loadFactor)
  const monthlyTrend = trafficLoad
    ? '↑ pico de demanda simulado'
    : deriveTrend(monthlySeries, '%', RANGE_LABELS[range])

  const annualValue = formatCurrency(scoped.totalAnnual * (trafficLoad ? 1.1 : 1))
  const annualTrend = trafficLoad
    ? '↑ pico anual simulado'
    : deriveTrend(annualSeries, '%', RANGE_LABELS[range])

  const operationalRegions = displayedRegions.filter((region) => region.status === 'operational').length
  const maxRegionServers = displayedRegions.reduce(
    (max, region) => Math.max(max, region.serversDeployed),
    1
  )

  const securityItems = [
    {
      title: 'Identidades bajo control',
      description: '24 usuarios activos y 8 roles configurados con políticas revisadas.',
      status: 'active' as const,
      icon: ShieldCheck
    },
    {
      title: 'MFA incompleto',
      description: 'MFA habilitado en el 72% de las cuentas. Se recomienda exigirlo en todas.',
      status: 'warning' as const,
      icon: Key
    },
    {
      title: 'Parches pendientes',
      description: '3 instancias EC2 presentan actualizaciones de seguridad sin aplicar.',
      status: 'inactive' as const,
      icon: AlertTriangle
    }
  ]

  const securityStatus = securityItems.some((item) => item.status === 'inactive')
    ? 'En riesgo'
    : securityItems.some((item) => item.status === 'warning')
      ? 'Requiere revisión'
      : 'Correcto'

  const cloudResources = new Set(displayedRegions.flatMap((region) => region.deployedServices)).size

  const architectureStatus = trafficLoad
    ? 'Degradada'
    : displayedRegions.some((region) => region.status === 'down')
      ? 'Caída'
      : displayedRegions.some((region) => region.status === 'degraded')
        ? 'Degradada'
        : 'Operativa'

  const scopedEvents = selectedRegion
    ? events.filter(
        (event) =>
          event.message.includes(selectedRegion.name) || event.message.includes(selectedRegion.id)
      )
    : events

  return (
    <div className={compact ? 'space-y-5' : 'space-y-8'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-textPrimary dark:text-darkTextPrimary">
              Dashboard
            </h1>
            {selectedRegion && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
                {selectedRegion.name}
              </span>
            )}
          </div>
          <p className="mt-2 text-textSecondary dark:text-darkTextSecondary">
            Resumen general de servicios, infraestructura y costos de la nube.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RangeSelector value={range} onChange={setRange} />
          <button
            type="button"
            onClick={() => updatePreferences('density', compact ? 'comodo' : 'compacto')}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-textPrimary transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary dark:hover:bg-darkPrimary/10 dark:hover:text-darkPrimary"
            title="Alternar vista compacta / detallada"
          >
            {compact ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            {compact ? 'Vista detallada' : 'Vista compacta'}
          </button>
        </div>
      </div>

      <RegionFilter value={regionId} regions={regionReferences} onChange={setRegionId} />

      <RegionMap regions={displayedRegions} />

      {!compact && (
        <section>
          <h2 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            Distribución de recursos por región
          </h2>
          <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
            Servidores y servicios activos por cada región, comparables a simple vista.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {displayedRegions.map((region) => (
              <article
                key={region.id}
                className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:border-darkBorder dark:bg-darkCard"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                    {region.name}
                  </p>
                  <StatusBadge status={region.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-textSecondary dark:text-darkTextSecondary">
                  <div>
                    Servidores:{' '}
                    <strong className="font-semibold text-textPrimary dark:text-darkTextPrimary">
                      {region.serversDeployed}
                    </strong>
                  </div>
                  <div>
                    Servicios:{' '}
                    <strong className="font-semibold text-textPrimary dark:text-darkTextPrimary">
                      {region.deployedServices.length}
                    </strong>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-textSecondary dark:text-darkTextSecondary">
                    <span>Servidores desplegados</span>
                    <span>{Math.round((region.serversDeployed / maxRegionServers) * 100)}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-background dark:bg-darkBackground">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300 dark:bg-darkPrimary"
                      style={{ width: `${(region.serversDeployed / maxRegionServers) * 100}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3 xl:items-start">
        <div className={compact ? 'space-y-5 xl:col-span-2' : 'space-y-8 xl:col-span-2'}>
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
                Indicadores clave
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSecondary">
                Rango aplicado a los gráficos: {RANGE_LABELS[range]}
              </span>
            </div>
            <div className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 ${compact ? 'sm:gap-4' : 'sm:gap-6'}`}>
              <StatCardTrend
                title="Servidores activos"
                value={servicesValue}
                icon={Server}
                trend={servicesTrend}
                history={serversSeries}
              />
              <StatCardTrend
                title="Costo mensual"
                value={monthlyValue}
                icon={DollarSign}
                trend={monthlyTrend}
                history={monthlySeries}
              />
              <StatCardTrend
                title="Costo anual"
                value={annualValue}
                icon={Calendar}
                trend={annualTrend}
                history={annualSeries}
              />
              <UptimeCard
                uptime={uptimeNow}
                series={uptimeSeries}
                period={`${uptimeNow.toFixed(2)}% en ${RANGE_LABELS[range]}`}
              />
              <StatCard
                title="Regiones operativas"
                value={`${operationalRegions} de ${displayedRegions.length}`}
                icon={Activity}
              />
              <StatCard title="Estado de seguridad" value={securityStatus} icon={ShieldCheck} />
              <StatCard
                title="Recursos Cloud"
                value={`${cloudResources} desplegados`}
                icon={Boxes}
              />
              <StatCard title="Estado de la arquitectura" value={architectureStatus} icon={Network} />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <TopCostServices items={scoped.costItems} />
            <MaintenanceCard region={selectedRegion?.name ?? 'todas las regiones'} />
          </div>

          <CostDistribution data={scoped.costDistribution} />
        </div>

        <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard xl:sticky xl:top-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
              Alertas y actividad reciente
            </h2>
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => setTrafficLoad((previous) => !previous)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  trafficLoad
                    ? 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 dark:border-darkWarning/40 dark:bg-darkWarning/10 dark:text-darkWarning dark:hover:bg-darkWarning/20'
                    : 'border-border bg-background text-textPrimary hover:bg-primary/10 hover:text-primary dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary dark:hover:bg-darkPrimary/10 dark:hover:text-darkPrimary'
                }`}
              >
                <Gauge className="h-4 w-4" />
                {trafficLoad ? 'Detener simulación' : 'Simular carga de tráfico'}
              </button>
              <span className="rounded-full bg-textSecondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-textSecondary dark:bg-darkTextSecondary/10 dark:text-darkTextSecondary">
                Simulación
              </span>
            </div>
          </div>

          <ul className="mt-2 max-h-80 divide-y divide-border overflow-y-auto dark:divide-darkBorder">
            {scopedEvents.map((event) => {
              const meta = severityColors[event.severity]
              const Icon = meta.icon
              return (
                <li key={event.id} className="flex animate-slide-in items-start gap-3 py-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.classes}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-textPrimary dark:text-darkTextPrimary">
                      {event.message}
                    </p>
                    <p className="mt-0.5 text-xs text-textSecondary dark:text-darkTextSecondary">
                      {formatRelative(event.timestamp)}
                    </p>
                  </div>
                </li>
              )
            })}
            {scopedEvents.length === 0 && (
              <li className="py-6 text-center text-sm text-textSecondary dark:text-darkTextSecondary">
                No hay alertas ni actividad reciente en esta región.
              </li>
            )}
          </ul>
        </aside>
      </div>

      {!compact && (
        <section>
          <h2 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            Resumen de seguridad
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {securityItems.map(({ icon, ...item }) => (
              <SecurityCard key={item.title} icon={icon} {...item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}