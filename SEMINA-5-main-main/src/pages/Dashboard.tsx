import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
  Settings,
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
import NetworkFlowDiagram from '../components/NetworkFlowDiagram'
import CloudWatchMetrics from '../components/CloudWatchMetrics'
import WellArchitectedScorecard from '../components/WellArchitectedScorecard'
import { suggestArchitectures } from '../data/architecture'
import { awsServices } from '../data/awsServices'
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
  const {
    servers,
    events,
    history,
    proposals,
    monthlyBudgetLimit,
    securityScore,
    networkSimulationActive
  } = useCloudStore()
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

  const securityStatus =
    securityScore < 50 ? 'En riesgo' : securityScore <= 80 ? 'Requiere revisión' : 'Correcto'

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

  const fallbackAlerts = [
    {
      id: 'alert-default-1',
      timestamp: new Date(Date.now() - 4 * 60_000).toISOString(),
      severity: 'warning' as const,
      message: 'Pico de tráfico detectado en us-east-1 con latencia elevada.'
    },
    {
      id: 'alert-default-2',
      timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
      severity: 'critical' as const,
      message: 'RDS principal sin réplica activa en sa-east-1; requiere revisión.'
    },
    {
      id: 'alert-default-3',
      timestamp: new Date(Date.now() - 19 * 60_000).toISOString(),
      severity: 'info' as const,
      message: 'Se detectó tráfico de alta demanda y balanceo desbalanceado.'
    }
  ]

  const alertFeed = scopedEvents.length > 0 ? scopedEvents : trafficLoad ? fallbackAlerts : fallbackAlerts

  const sortedProposals = useMemo(
    () =>
      [...proposals].sort(
        (first, second) =>
          new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
      ),
    [proposals]
  )
  const approvedProposal = sortedProposals.find((proposal) => proposal.status === 'aprobada')
  const activeProposal = approvedProposal ?? sortedProposals[0]
  const architectureSuggestion = activeProposal
    ? suggestArchitectures(
        activeProposal.appType,
        activeProposal.estimatedUsers,
        activeProposal.availabilityLevel
      )[0]
    : undefined
  const activeServices = awsServices.filter((service) => service.status === 'active').length
  const costUsagePercent =
    monthlyBudgetLimit > 0
      ? Math.min(100, Math.round((scoped.totalMonthly / monthlyBudgetLimit) * 100))
      : 0
  const moduleCards: {
    label: string
    detail: string
    value: string
    to: string
    icon: LucideIcon
  }[] = [
    {
      label: 'Planificación',
      detail: 'propuestas',
      value: String(proposals.length),
      to: '/planning',
      icon: LayoutGrid
    },
    {
      label: 'Costos',
      detail: 'del presupuesto',
      value: `${costUsagePercent}%`,
      to: '/costs',
      icon: DollarSign
    },
    {
      label: 'Infraestructura',
      detail: 'regiones operativas',
      value: `${operationalRegions}/${displayedRegions.length}`,
      to: '/infrastructure',
      icon: Server
    },
    {
      label: 'Seguridad',
      detail: 'controles completados',
      value: `${securityScore}%`,
      to: '/security',
      icon: ShieldCheck
    },
    {
      label: 'Red',
      detail: 'simulación de tráfico',
      value: networkSimulationActive ? 'Activa' : 'Inactiva',
      to: '/network',
      icon: Network
    },
    {
      label: 'Servicios',
      detail: 'servicios activos',
      value: String(activeServices),
      to: '/services',
      icon: Boxes
    },
    {
      label: 'Configuración',
      detail: 'moneda activa',
      value: preferences.currency,
      to: '/config',
      icon: Settings
    }
  ]

  return (
    <div className={compact ? 'space-y-5' : 'space-y-8'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-textPrimary dark:text-darkTextPrimary">
              Dashboard
            </h1>
            {selectedRegion && (
               <span className="rounded-full border border-transparent bg-gradient-to-r from-accentFrom/10 to-accentTo/10 px-2 py-0.5 text-xs font-semibold text-accentFrom shadow-[0_0_10px_rgba(124,58,237,0.12)] dark:from-darkAccentFrom/20 dark:to-darkAccentTo/20 dark:text-darkAccentFrom dark:shadow-[0_0_10px_rgba(139,92,246,0.18)]">
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
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-textPrimary transition-all hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/40 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/40"
            title="Alternar vista compacta / detallada"
          >
            {compact ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            {compact ? 'Vista detallada' : 'Vista compacta'}
          </button>
        </div>
      </div>

      <RegionFilter value={regionId} regions={regionReferences} onChange={setRegionId} />

      <RegionMap regions={displayedRegions} servers={filteredServers} />

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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-start">
        <div className="xl:col-span-2">
          <CloudWatchMetrics servers={filteredServers} trafficLoad={trafficLoad} />
        </div>
        <WellArchitectedScorecard servers={filteredServers} />
      </div>

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
                 className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/40 ${
                   trafficLoad
                     ? 'border-transparent bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 text-white shadow-[0_0_14px_rgba(124,58,237,0.2)] dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_14px_rgba(139,92,246,0.26)] dark:focus:ring-darkAccentFrom/40'
                     : 'border-border bg-background text-textPrimary hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-accentFrom dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/40'
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
            {alertFeed.map((event) => {
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
            {alertFeed.length === 0 && (
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

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
              Arquitectura de la solución
            </h2>
            <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
              Sigue la propuesta activa y salta directamente a cada módulo de la plataforma.
            </p>
          </div>
          <Link
            to="/planning"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-textPrimary shadow-sm transition-all hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-accentFrom dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkAccentFrom"
          >
            Ver propuestas
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                  Propuesta activa
                </p>
                <h3 className="mt-1 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
                  {activeProposal?.solutionName ?? 'Sin propuesta disponible'}
                </h3>
              </div>
              {activeProposal && (
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success dark:bg-darkSuccess/10 dark:text-darkSuccess">
                  {activeProposal.status === 'aprobada' ? 'Aprobada' : 'Más reciente'}
                </span>
              )}
            </div>

            {activeProposal ? (
              <>
                {!approvedProposal && (
                  <p className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-xs font-medium text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
                    Sin propuestas aprobadas aún, mostrando la más reciente
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-3 border-b border-border pb-3 dark:border-darkBorder">
                  <span className="text-xs text-textSecondary dark:text-darkTextSecondary">
                    Arquitectura sugerida
                  </span>
                  <strong className="text-right text-sm text-textPrimary dark:text-darkTextPrimary">
                    {architectureSuggestion?.name ?? activeProposal.appType}
                  </strong>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
                  {architectureSuggestion?.rationale ?? activeProposal.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(architectureSuggestion?.stack ?? activeProposal.selectedServices).map((service) => (
                    <span
                      key={service}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary"
                    >
                      {service}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-3 dark:bg-darkBackground">
                  <span className="text-xs text-textSecondary dark:text-darkTextSecondary">
                    Estimación mensual
                  </span>
                  <strong className="text-sm text-primary dark:text-darkPrimary">
                    {formatCurrency(architectureSuggestion?.estimatedCost ?? 0)}
                  </strong>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-textSecondary dark:text-darkTextSecondary">
                Crea una propuesta desde Planificación para ver aquí su arquitectura recomendada.
              </p>
            )}
          </article>

          <div className="min-w-0">
            <NetworkFlowDiagram compact />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
            Módulos de la plataforma
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {moduleCards.map(({ label, detail, value, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                 className="group flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm transition-all hover:border-accentFrom/50 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 dark:border-darkBorder dark:bg-darkCard dark:hover:border-darkAccentFrom/50 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                   <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accentFrom/10 text-accentFrom dark:bg-darkAccentFrom/10 dark:text-darkAccentFrom">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                      {label}
                    </span>
                    <span className="block truncate text-[11px] text-textSecondary dark:text-darkTextSecondary">
                      {detail}
                    </span>
                  </span>
                </div>
                 <span className="shrink-0 text-right text-sm font-bold text-accentFrom dark:text-darkAccentFrom">
                  {value}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}