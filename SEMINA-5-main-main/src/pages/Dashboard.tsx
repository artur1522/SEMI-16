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
  LayoutGrid,
  List,
  Network,
  Server,
  ShieldCheck,
  Sparkles,
  type LucideIcon
} from 'lucide-react'
import CostDistribution from '../components/CostDistribution'
import MaintenanceCard from '../components/MaintenanceCard'
import ProjectCard from '../components/ProjectCard'
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
import { MODULE_META } from '../config/navigation'
import { Badge, Button, PageHeader, ProgressBar, Section } from '../components/ui'
import type { CloudLog, CloudServer } from '../types/cloud'

const severityColors: Record<CloudLog['severity'], { icon: LucideIcon; classes: string }> = {
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
    classes: 'bg-info/10 text-info dark:bg-darkInfo/10 dark:text-darkInfo'
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
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000)
  )
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
    (sum, server) =>
      sum + (server.status === 'active' ? 1 : server.status === 'warning' ? 0.998 : 0.99),
    0
  )
  return (weighted / total) * 100
}

const regionNameOf = (id: string) =>
  regionReferences.find((region) => region.id === id)?.name ?? id

export default function Dashboard() {
  const {
    servers,
    events,
    history,
    monthlyBudgetLimit,
    securityScore,
    networkSimulationActive,
    projects,
    portfolio
  } = useCloudStore()
  const { preferences, updatePreferences } = usePreferences()
  const { formatCurrency } = useFormatters()

  const compact = preferences.density === 'compacto'

  const [trafficLoad, setTrafficLoad] = useState(false)
  const [range, setRange] = useState<RangeKey>('30d')
  const [regionId, setRegionId] = useState('all')

  const selectedRegion =
    regionId === 'all' ? null : regionReferences.find((r) => r.id === regionId)

  const filteredServers = selectedRegion
    ? servers.filter((server) => server.regionId === selectedRegion.id)
    : servers
  const scopedProjects = selectedRegion
    ? projects.filter((project) => project.regionId === selectedRegion.id)
    : projects

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

  const operationalRegions = displayedRegions.filter(
    (region) => region.status === 'operational'
  ).length
  const maxRegionServers = displayedRegions.reduce(
    (max, region) => Math.max(max, region.serversDeployed),
    1
  )

  const securityStatus =
    securityScore < 50 ? 'En riesgo' : securityScore <= 80 ? 'Requiere revisión' : 'Correcto'

  const cloudResources = new Set(
    displayedRegions.flatMap((region) => region.deployedServices)
  ).size

  const architectureStatus = trafficLoad
    ? 'Degradada'
    : scopedProjects.some((project) => project.network.health === 'degradado')
      ? 'Degradada'
      : scopedProjects.some((project) => project.network.health === 'saturado')
        ? 'Degradada'
        : 'Operativa'

  const scopedEvents = selectedRegion
    ? events.filter(
        (event) =>
          event.message.includes(selectedRegion.name) ||
          event.message.includes(selectedRegion.id)
      )
    : events

  const fallbackAlerts: CloudLog[] = [
    {
      id: 'alert-default-1',
      timestamp: new Date(Date.now() - 4 * 60_000).toISOString(),
      severity: 'warning',
      message: 'Pico de tráfico detectado en us-east-1 con latencia elevada.'
    },
    {
      id: 'alert-default-2',
      timestamp: new Date(Date.now() - 12 * 60_000).toISOString(),
      severity: 'critical',
      message: 'RDS principal sin réplica activa en sa-east-1; requiere revisión.'
    },
    {
      id: 'alert-default-3',
      timestamp: new Date(Date.now() - 19 * 60_000).toISOString(),
      severity: 'info',
      message: 'Se detectó tráfico de alta demanda y balanceo desbalanceado.'
    }
  ]

  const alertFeed = scopedEvents.length > 0 ? scopedEvents : fallbackAlerts

  const activeProject = useMemo(() => {
    const order = [...projects].sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
    )
    return order.find((project) => project.status === 'aprobada') ?? order[0]
  }, [projects])

  const architectureSuggestion = activeProject
    ? suggestArchitectures(
        activeProject.appType,
        activeProject.estimatedUsers,
        activeProject.availabilityLevel
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
      detail: 'propuestas del portafolio',
      value: String(portfolio.projects),
      to: '/planning',
      icon: MODULE_META['/planning'].icon
    },
    {
      label: 'Costos',
      detail: 'del presupuesto',
      value: `${costUsagePercent}%`,
      to: '/costs',
      icon: MODULE_META['/costs'].icon
    },
    {
      label: 'Infraestructura',
      detail: 'regiones operativas',
      value: `${operationalRegions}/${displayedRegions.length}`,
      to: '/infrastructure',
      icon: MODULE_META['/infrastructure'].icon
    },
    {
      label: 'Seguridad',
      detail: 'score global',
      value: `${securityScore}%`,
      to: '/security',
      icon: MODULE_META['/security'].icon
    },
    {
      label: 'Red',
      detail: 'simulación de tráfico',
      value: networkSimulationActive ? 'Activa' : 'Inactiva',
      to: '/network',
      icon: MODULE_META['/network'].icon
    },
    {
      label: 'Servicios',
      detail: 'servicios activos',
      value: String(activeServices),
      to: '/services',
      icon: MODULE_META['/services'].icon
    },
    {
      label: 'Configuración',
      detail: 'moneda activa',
      value: preferences.currency,
      to: '/config',
      icon: MODULE_META['/config'].icon
    }
  ]

  const overview = {
    approved: portfolio.approved,
    inReview: portfolio.inReview,
    draft: portfolio.draft
  }

  const securityItems = [
    {
      title: 'Identidades bajo control',
      description: `${portfolio.securityScore}% de cumplimiento promedio en el portafolio.`,
      status: portfolio.securityScore >= 80 ? ('active' as const) : ('warning' as const),
      icon: ShieldCheck
    },
    {
      title: 'Hallazgos críticos',
      description: `${portfolio.criticalFindings} hallazgos críticos abiertos en ${portfolio.criticalFindings === 1 ? '1 proyecto' : `${portfolio.criticalFindings} proyectos`}.`,
      status: portfolio.criticalFindings === 0 ? ('active' as const) : ('inactive' as const),
      icon: AlertTriangle
    },
    {
      title: 'Alertas de seguridad',
      description: `${portfolio.openAlerts} alertas abiertas asociadas a los proyectos del portafolio.`,
      status: portfolio.openAlerts === 0 ? ('active' as const) : ('warning' as const),
      icon: Activity
    }
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow="Resumen ejecutivo"
        title="Dashboard"
        description="Resumen general de servicios, infraestructura y costos de la nube."
        badge={
          selectedRegion ? <Badge tone="info">{selectedRegion.name}</Badge> : undefined
        }
        actions={
          <>
            <RangeSelector value={range} onChange={setRange} />
            <Button
              variant="secondary"
              icon={compact ? LayoutGrid : List}
              onClick={() => updatePreferences('density', compact ? 'comodo' : 'compacto')}
              title="Alternar vista compacta / detallada"
            >
              {compact ? 'Vista detallada' : 'Vista compacta'}
            </Button>
          </>
        }
      />

      <RegionFilter value={regionId} regions={regionReferences} onChange={setRegionId} />

      <RegionMap regions={displayedRegions} servers={filteredServers} />

      {!compact && (
        <Section
          title="Distribución de recursos por región"
          description="Servidores y servicios activos por cada región, comparables a simple vista."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {displayedRegions.map((region) => (
              <article key={region.id} className="card-tile">
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
                  <div className="flex items-center justify-between text-2xs text-textSecondary dark:text-darkTextSecondary">
                    <span>Servidores desplegados</span>
                    <span className="tabular-nums">
                      {Math.round((region.serversDeployed / maxRegionServers) * 100)}%
                    </span>
                  </div>
                  <ProgressBar
                    percent={(region.serversDeployed / maxRegionServers) * 100}
                    className="mt-1"
                  />
                </div>
              </article>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
        <div className="xl:col-span-2">
          <CloudWatchMetrics servers={filteredServers} trafficLoad={trafficLoad} />
        </div>
        <WellArchitectedScorecard servers={filteredServers} />
      </div>

      <Section
        title="Portafolio de proyectos"
        description="Fuente única de verdad: el mismo estado, costo y seguridad que consumen Planificación, Costos, Infraestructura y Seguridad."
        actions={
          <Link to="/planning" className="btn btn-secondary btn-sm">
            Ver planificación
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {scopedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              regionName={regionNameOf(project.regionId)}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="success">{overview.approved} aprobadas</Badge>
          <Badge tone="warning">{overview.inReview} en revisión</Badge>
          <Badge tone="danger">{overview.draft} borradores</Badge>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
        <div className="space-y-6 xl:col-span-2">
          <Section
            title="Indicadores clave"
            actions={
              <span className="text-xs text-textSecondary dark:text-darkTextSecondary">
                Rango aplicado a los gráficos: {RANGE_LABELS[range]}
              </span>
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </Section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopCostServices items={scoped.costItems} />
            <MaintenanceCard region={selectedRegion?.name ?? 'todas las regiones'} />
          </div>

          <CostDistribution data={scoped.costDistribution} />
        </div>

        <aside className="section-card xl:sticky xl:top-20">
          <div className="section-head">
            <h2 className="section-title">Alertas y actividad</h2>
            <Button
              variant={trafficLoad ? 'accent' : 'secondary'}
              size="sm"
              icon={Gauge}
              onClick={() => setTrafficLoad((previous) => !previous)}
            >
              {trafficLoad ? 'Detener simulación' : 'Simular carga de tráfico'}
            </Button>
          </div>

          <ul className="mt-2 max-h-80 divide-y divide-border overflow-y-auto dark:divide-darkBorder">
            {alertFeed.map((event) => {
              const meta = severityColors[event.severity]
              const Icon = meta.icon
              return (
                <li key={event.id} className="flex animate-slide-in items-start gap-3 py-3">
                  <span className={`icon-tile h-9 w-9 ${meta.classes}`}>
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

      <Section title="Resumen de seguridad">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {securityItems.map(({ icon, ...item }) => (
            <SecurityCard key={item.title} icon={icon} {...item} />
          ))}
        </div>
      </Section>

      <Section
        title="Arquitectura de la solución"
        description="Sigue el proyecto activo y salta directamente a cada módulo de la plataforma."
        actions={
          <Link to="/planning" className="btn btn-secondary btn-sm">
            Ver proyectos
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className="section-card-compact">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">Proyecto activo</p>
                <h3 className="mt-1 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
                  {activeProject?.name ?? 'Sin proyecto disponible'}
                </h3>
              </div>
              {activeProject && (
                <Badge tone="success">
                  {activeProject.status === 'aprobada' ? 'Aprobada' : 'Más reciente'}
                </Badge>
              )}
            </div>

            {activeProject ? (
              <>
                <div className="divider mt-4 flex items-center justify-between gap-3 pt-3">
                  <span className="text-xs text-textSecondary dark:text-darkTextSecondary">
                    Arquitectura sugerida
                  </span>
                  <strong className="text-right text-sm text-textPrimary dark:text-darkTextPrimary">
                    {architectureSuggestion?.name ?? activeProject.appType}
                  </strong>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
                  {architectureSuggestion?.rationale ?? activeProject.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {(architectureSuggestion?.stack ?? activeProject.services).map((service) => (
                    <span key={service} className="badge badge-solid">
                      {service}
                    </span>
                  ))}
                </div>
                <div className="panel-muted mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-textSecondary dark:text-darkTextSecondary">
                    Estimación mensual
                  </span>
                  <strong className="text-sm text-accentFrom dark:text-darkAccentFrom">
                    {formatCurrency(architectureSuggestion?.estimatedCost ?? 0)}
                  </strong>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-textSecondary dark:text-darkTextSecondary">
                Crea un proyecto desde Planificación para ver aquí su arquitectura recomendada.
              </p>
            )}
          </article>

          <div className="min-w-0">
            <NetworkFlowDiagram compact />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="section-title">
            <Sparkles className="h-4 w-4 text-accentFrom" aria-hidden="true" />
            Módulos de la plataforma
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {moduleCards.map(({ label, detail, value, to, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className="card-tile flex min-w-0 items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="icon-tile h-9 w-9 bg-accentFrom/10 text-accentFrom dark:bg-darkAccentFrom/10 dark:text-darkAccentFrom">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                      {label}
                    </span>
                    <span className="block truncate text-2xs text-textSecondary dark:text-darkTextSecondary">
                      {detail}
                    </span>
                  </span>
                </div>
                <span className="shrink-0 text-right text-sm font-bold tabular-nums text-accentFrom dark:text-darkAccentFrom">
                  {value}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}
