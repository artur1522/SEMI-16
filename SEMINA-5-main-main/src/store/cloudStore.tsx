import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  CloudLog,
  CloudProposal,
  CloudServer,
  CostCategory,
  CostEnvironment,
  CostItem,
  HistoryPoint,
  Region,
  ServiceStatus
} from '../types/cloud'
import { regionReferences } from '../data/regions'
import { getServerMeaning } from '../data/serverNames'
import {
  CLOUD_PROJECTS,
  COST_CATEGORY_COLORS,
  HOURS_PER_MONTH,
  MONTHLY_BUDGET_LIMIT,
  SECURITY_CONTROL_TOTAL,
  SERVICE_CATEGORY,
  UNIT_COSTS,
  portfolioTotals,
  type CloudProject,
  type PortfolioTotals
} from '../data/cloudOpsData'

const CATEGORY_COLORS: Record<string, string> = COST_CATEGORY_COLORS

/** Presupuesto global del portafolio (suma de los presupuestos por proyecto). */
const MONTHLY_BUDGET = portfolioTotals(CLOUD_PROJECTS).monthlyBudget || MONTHLY_BUDGET_LIMIT

const PROPOSALS_STORAGE_KEY = 'cloudops-proposals-v2'

/** Estado inicial de los controles: mayoría del portafolio centralizado. */
const initialSecurityControls: Record<string, boolean> = (() => {
  const controlIds = Array.from(
    new Set(CLOUD_PROJECTS.flatMap((project) => project.security.controls.map((c) => c.id)))
  )
  return controlIds.reduce<Record<string, boolean>>((acc, id) => {
    const withControl = CLOUD_PROJECTS.filter((project) =>
      project.security.controls.some((control) => control.id === id)
    )
    const done = withControl.filter((project) =>
      project.security.controls.find((control) => control.id === id)?.done
    ).length
    acc[id] = withControl.length > 0 && done > withControl.length / 2
    return acc
  }, {})
})()

/** Propuestas sembradas desde la lista maestra de proyectos. */
const initialProposals: CloudProposal[] = CLOUD_PROJECTS.map((project) => ({
  id: project.id,
  solutionName: project.name,
  appType: project.appType,
  description: project.description,
  region: project.regionId,
  estimatedUsers: project.estimatedUsers,
  availabilityLevel: project.availabilityLevel,
  selectedServices: project.services,
  migrationGoal: project.migrationGoal,
  status: project.status,
  priority: project.priority,
  createdAt: project.createdAt
}))

function isProposalDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime())
}

function normalizeProposal(proposal: Partial<CloudProposal>): CloudProposal {
  return {
    id: proposal.id ?? `prop-${Date.now()}`,
    solutionName: proposal.solutionName ?? 'Sin nombre',
    appType: proposal.appType ?? '',
    description: proposal.description ?? '',
    region: proposal.region ?? '',
    estimatedUsers: proposal.estimatedUsers ?? 0,
    availabilityLevel: proposal.availabilityLevel ?? 'basica',
    selectedServices: proposal.selectedServices ?? [],
    migrationGoal: proposal.migrationGoal ?? '',
    status: proposal.status ?? 'borrador',
    priority: proposal.priority ?? 'media',
    createdAt: isProposalDate(proposal.createdAt) ? proposal.createdAt! : new Date().toISOString()
  }
}

function loadProposals(): CloudProposal[] {
  if (typeof window === 'undefined') return initialProposals
  try {
    const saved = window.localStorage.getItem(PROPOSALS_STORAGE_KEY)
    if (!saved) return initialProposals
    const parsed = JSON.parse(saved) as Array<Partial<CloudProposal>>
    const normalized =
      Array.isArray(parsed) && parsed.length > 0 ? parsed.map(normalizeProposal) : initialProposals
    if (JSON.stringify(normalized) !== saved) {
      window.localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(normalized))
    }
    return normalized
  } catch {
    return initialProposals
  }
}

export interface AddServerInput {
  serviceId: string
  regionId: string
  environment: CostEnvironment
  status?: ServiceStatus
}

interface CloudStoreValue {
  servers: CloudServer[]
  regions: Region[]
  costItems: CostItem[]
  totalMonthly: number
  totalAnnual: number
  costDistribution: { name: string; value: number; color: string }[]
  events: CloudLog[]
  history: HistoryPoint[]
  serversHistory: number[]
  servicesHistory: number[]
  monthlyHistory: number[]
  proposals: CloudProposal[]
  /** Lista maestra de proyectos con estado y costos en vivo. */
  projects: CloudProject[]
  /** KPIs globales coherentes con todas las vistas. */
  portfolio: PortfolioTotals
  monthlyBudgetLimit: number
  securityScore: number
  securityControls: Record<string, boolean>
  networkSimulationActive: boolean
  addServer: (input: AddServerInput) => CloudServer
  removeServer: (id: string) => void
  addProposal: (proposal: CloudProposal) => void
  removeProposal: (id: string) => void
  updateProposalStatus: (id: string, status: CloudProposal['status']) => void
  setSecurityControl: (id: string, completed: boolean) => void
  setNetworkSimulationActive: (active: boolean) => void
}

const CloudContext = createContext<CloudStoreValue | null>(null)

const round2 = (value: number) => Math.round(value * 100) / 100

const envPriority: CostEnvironment[] = ['production', 'staging', 'dev']

function regionName(id: string) {
  return regionReferences.find((region) => region.id === id)?.name ?? id
}

function serverLabel(server: CloudServer): string {
  return `${server.name} (${getServerMeaning(server)})`
}

function buildRegions(servers: CloudServer[]): Region[] {
  return regionReferences.map((reference) => {
    const inRegion = servers.filter((server) => server.regionId === reference.id)
    const deployed = Array.from(new Set(inRegion.map((server) => server.serviceId)))
    const hasMaintenance = reference.availabilityZones.some((zone) => zone.status === 'inactive')
    const hasIssue =
      reference.availabilityZones.some((zone) => zone.status === 'warning') ||
      inRegion.some((server) => server.status !== 'active')
    return {
      ...reference,
      deployedServices: deployed,
      serversDeployed: inRegion.length,
      status: hasMaintenance ? 'down' : hasIssue ? 'degraded' : 'operational'
    }
  })
}

function buildCostItems(servers: CloudServer[]): CostItem[] {
  const perService = new Map<
    string,
    { serviceId: string; qty: number; envs: CostEnvironment[] }
  >()
  for (const server of servers) {
    const existing = perService.get(server.serviceId)
    if (existing) {
      existing.qty += 1
      if (!existing.envs.includes(server.environment)) existing.envs.push(server.environment)
    } else {
      perService.set(server.serviceId, {
        serviceId: server.serviceId,
        qty: 1,
        envs: [server.environment]
      })
    }
  }

  const items: CostItem[] = []
  for (const { serviceId, qty, envs } of perService.values()) {
    const unitCost = UNIT_COSTS[serviceId] ?? 0
    if (unitCost === 0) continue
    const monthlyCost = round2(qty * unitCost)
    const serviceLabel =
      serviceId === 'ec2'
        ? 'EC2'
        : serviceId === 's3'
          ? 'S3'
          : serviceId === 'rds'
            ? 'RDS'
            : serviceId === 'cloudfront'
              ? 'CloudFront'
              : serviceId === 'route53'
                ? 'Route 53'
                : serviceId === 'vpc'
                  ? 'VPC (NAT Gateway)'
                  : serviceId.toUpperCase()
    const environment =
      envPriority.find((env) => envs.includes(env)) ?? envs[0]
    items.push({
      id: serviceId,
      service: serviceLabel,
      quantity: qty,
      estimatedHours: HOURS_PER_MONTH,
      unitCost,
      monthlyCost,
      annualCost: round2(monthlyCost * 12),
      category: SERVICE_CATEGORY[serviceId] ?? 'Compute',
      environment
    })
  }
  return items
}

function buildDistribution(costItems: CostItem[]) {
  const byCategory = new Map<CostCategory, number>()
  for (const item of costItems) {
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.monthlyCost)
  }
  return Array.from(byCategory.entries()).map(([category, value]) => ({
    name: category,
    value: round2(value),
    color: CATEGORY_COLORS[category] ?? '#64748B'
  }))
}

export function deriveMetrics(servers: CloudServer[]) {
  const regions = buildRegions(servers)
  const costItems = buildCostItems(servers)
  const totalMonthly = round2(costItems.reduce((sum, item) => sum + item.monthlyCost, 0))
  const costDistribution = buildDistribution(costItems)
  return {
    regions,
    costItems,
    totalMonthly,
    totalAnnual: round2(totalMonthly * 12),
    costDistribution
  }
}

function computeUptimePercent(servers: CloudServer[]): number {
  if (servers.length === 0) return 100
  const total = servers.length
  const weighted = servers.reduce(
    (sum, server) =>
      sum + (server.status === 'active' ? 1 : server.status === 'warning' ? 0.998 : 0.99),
    0
  )
  return Math.round(((weighted / total) * 100) * 100) / 100
}

function buildSnapshot(servers: CloudServer[]): HistoryPoint {
  const costItems = buildCostItems(servers)
  const regionCounts: Record<string, number> = {}
  const regionCost: Record<string, number> = {}
  for (const regionId of regionReferences.map((region) => region.id)) {
    const inRegion = servers.filter((server) => server.regionId === regionId)
    regionCounts[regionId] = inRegion.length
    regionCost[regionId] = round2(
      buildCostItems(inRegion).reduce((sum, item) => sum + item.monthlyCost, 0)
    )
  }
  return {
    servers: servers.length,
    services: new Set(servers.map((server) => server.serviceId)).size,
    monthlyCost: round2(costItems.reduce((sum, item) => sum + item.monthlyCost, 0)),
    at: Date.now(),
    uptime: computeUptimePercent(servers),
    regionCounts,
    regionCost
  }
}

function deriveAlertEvents(servers: CloudServer[]): CloudLog[] {
  const alerts: CloudLog[] = []
  const regionId = (server: CloudServer) => server.regionId

  for (const server of servers) {
    if (server.status === 'inactive') {
      alerts.push({
        id: `alert-${server.id}`,
        timestamp: new Date(server.addedAt).toISOString(),
        severity: 'critical',
        message: `${serverLabel(server)} está inactivo en ${regionName(server.regionId)}.`
      })
    } else if (server.status === 'warning') {
      alerts.push({
        id: `alert-${server.id}`,
        timestamp: new Date(server.addedAt).toISOString(),
        severity: 'warning',
        message: `${serverLabel(server)} presenta advertencias en ${regionName(server.regionId)}.`
      })
    }
  }

  const byRegion = new Map<string, CloudServer[]>()
  for (const server of servers) {
    const list = byRegion.get(regionId(server))
    if (list) list.push(server)
    else byRegion.set(regionId(server), [server])
  }

  for (const [id, regionServers] of byRegion) {
    const active = regionServers.filter((server) => server.status === 'active')
    const rds = active.filter((server) => server.serviceId === 'rds')
    const ec2Prod = active.filter(
      (server) => server.serviceId === 'ec2' && server.environment === 'production'
    )
    const hasCdn = active.some((server) => server.serviceId === 'cloudfront')
    const hasEgress = active.some(
      (server) => server.serviceId === 'ec2' || server.serviceId === 'route53'
    )

    if (active.length === 1) {
      alerts.push({
        id: `alert-single-${id}`,
        timestamp: new Date(active[0].addedAt).toISOString(),
        severity: 'warning',
        message: `${regionName(id)}: solo queda ${serverLabel(active[0])} activo, punto único de falla.`
      })
    }
    if (rds.length === 1) {
      alerts.push({
        id: `alert-rds-${id}`,
        timestamp: new Date(rds[0].addedAt).toISOString(),
        severity: 'warning',
        message: `RDS en ${regionName(id)} sin réplica Multi-AZ.`
      })
    }
    if (ec2Prod.length === 1) {
      alerts.push({
        id: `alert-ec2-${id}`,
        timestamp: new Date(ec2Prod[0].addedAt).toISOString(),
        severity: 'warning',
        message: `Producción en ${regionName(id)} corre en una sola instancia EC2: ${serverLabel(ec2Prod[0])}.`
      })
    }
    if (hasEgress && !hasCdn) {
      alerts.push({
        id: `alert-cdn-${id}`,
        timestamp: new Date(regionServers[0].addedAt).toISOString(),
        severity: 'info',
        message: `${regionName(id)} sirve tráfico sin CloudFront al frente.`
      })
    }
  }

  return alerts.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}

/**
 * El inventario se siembra desde `CLOUD_PROJECTS`: cada proyecto aporta sus
 * recursos a su región. Infraestructura, costos, red y dashboard derivan todos
 * de esta misma lista, garantizando coherencia total.
 */
function seedServers(): CloudServer[] {
  const servers: CloudServer[] = []
  let counter = 0

  for (const project of CLOUD_PROJECTS) {
    let flagged = false
    for (const resource of project.resources) {
      for (let i = 0; i < resource.quantity; i += 1) {
        let status: ServiceStatus = 'active'
        // Estados derivados de la postura central del proyecto.
        if (!flagged && resource.environment === 'production') {
          if (project.security.posture === 'critica' && project.security.criticalFindings > 1) {
            status = 'inactive'
            flagged = true
          } else if (project.network.health !== 'estable') {
            status = 'warning'
            flagged = true
          }
        }

        counter += 1
        servers.push({
          id: `srv-${counter}`,
          name: `${resource.serviceId}-${project.regionId}-${String(counter).padStart(3, '0')}`,
          serviceId: resource.serviceId,
          regionId: project.regionId,
          projectId: project.id,
          environment: resource.environment,
          status,
          addedAt: Date.now() - (120 - counter) * 60_000
        })
      }
    }
  }

  return servers
}

function seedLog(servers: CloudServer[]): CloudLog[] {
  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()
  const byRegion = new Map<string, number>()
  for (const server of servers) {
    byRegion.set(server.regionId, (byRegion.get(server.regionId) ?? 0) + 1)
  }
  const mostLoaded = Array.from(byRegion.entries()).sort((a, b) => b[1] - a[1])[0][0]
  const costItems = buildCostItems(servers)
  const total = costItems.reduce((sum, item) => sum + item.monthlyCost, 0)

  return [
    {
      id: 'log-seed-1',
      timestamp: minutesAgo(2),
      severity: 'info',
      message: `Inventario sincronizado: ${servers.length} servidores en ${regionReferences.length} regiones.`
    },
    {
      id: 'log-seed-2',
      timestamp: minutesAgo(5),
      severity: 'info',
      message: `Monitoreo activo en ${regionName(mostLoaded)} (${byRegion.get(mostLoaded)} recursos).`
    },
    {
      id: 'log-seed-3',
      timestamp: minutesAgo(8),
      severity: 'info',
      message: `Costo mensual derivado del inventario: $${Math.round(total).toLocaleString('es-ES')}.`
    },
    {
      id: 'log-seed-4',
      timestamp: minutesAgo(12),
      severity: 'info',
      message: 'Análisis de seguridad: políticas de IAM revisadas sin cambios.'
    }
  ]
}

function backfillHistory(servers: CloudServer[], now = Date.now()): HistoryPoint[] {
  const base = buildSnapshot(servers)
  const horizonDays = 30
  const hoursStep = 1
  const points: HistoryPoint[] = []
  const totalSteps = (horizonDays * 24) / hoursStep

  for (let step = totalSteps; step >= 0; step -= 1) {
    const hoursAgo = step * hoursStep
    const age = hoursAgo / 24
    const wave = (index: number, phase: number) =>
      Math.sin(index / 6 + phase) * (index / 30) * 0.5

    const serverDelta = Math.round(
      Math.sin(hoursAgo / 18) * 2 + Math.cos(hoursAgo / 55) * 1 + wave(step, 1.3)
    )
    const serversNow = Math.max(0, base.servers + serverDelta)

    const regionCounts: Record<string, number> = {}
    const regionCost: Record<string, number> = {}
    for (const regionId of regionReferences.map((r) => r.id)) {
      const current = base.regionCounts[regionId] ?? 0
      const delta =
        Math.round(Math.sin(hoursAgo / 24 + regionId.length) * 1.2) +
        (regionId === 'us-east-1' ? Math.round(wave(step, 2.1)) : 0)
      const count = Math.max(0, current + delta)
      regionCounts[regionId] = count
      regionCost[regionId] = round2(
        current > 0
          ? (base.regionCost[regionId] ?? 0) * (count / current) * (1 - age * 0.004)
          : 0
      )
    }

    const monthlyCost = round2(
      Object.values(regionCost).reduce((sum, value) => sum + value, 0)
    )

    const uptime = Math.min(
      100,
      Math.round((base.uptime - Math.sin(hoursAgo / 120) * 0.18 - age * 0.002) * 100) / 100
    )

    points.push({
      servers: serversNow,
      services: Math.max(1, base.services - Math.round(Math.abs(serverDelta) / 3)),
      monthlyCost,
      at: now - hoursAgo * 3_600_000,
      uptime,
      regionCounts,
      regionCost
    })
  }
  points[points.length - 1] = base
  return points
}

function createInitialState(): {
  servers: CloudServer[]
  history: HistoryPoint[]
  log: CloudLog[]
} {
  const servers = seedServers()
  return { servers, history: backfillHistory(servers), log: seedLog(servers) }
}

export function CloudProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(createInitialState)
  const [servers, setServers] = useState<CloudServer[]>(initial.servers)
  const [history, setHistory] = useState<HistoryPoint[]>(initial.history)
  const [log, setLog] = useState<CloudLog[]>(initial.log)
  const [proposals, setProposals] = useState<CloudProposal[]>(loadProposals)
  const [securityControls, setSecurityControls] = useState<Record<string, boolean>>(
    () => ({ ...initialSecurityControls })
  )
  const [networkSimulationActive, setNetworkSimulationActive] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals))
  }, [proposals])

  const pushSnapshot = useCallback((nextServers: CloudServer[]) => {
    setHistory((previous) => [...previous.slice(-1050), buildSnapshot(nextServers)])
  }, [])

  const addServer = useCallback(
    (input: AddServerInput): CloudServer => {
      const counter = servers.length + 1
      const server: CloudServer = {
        id: `srv-${Date.now()}`,
        name: `${input.serviceId}-${input.regionId}-${String(counter).padStart(3, '0')}`,
        serviceId: input.serviceId,
        regionId: input.regionId,
        environment: input.environment,
        status: input.status ?? 'active',
        addedAt: Date.now()
      }
      const next = [...servers, server]
      setServers(next)
      pushSnapshot(next)
      setLog((previous) =>
        [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            severity: 'info' as const,
            message: `${serverLabel(server)} agregado en ${regionName(input.regionId)}.`
          },
          ...previous
        ].slice(0, 50)
      )
      return server
    },
    [servers, pushSnapshot]
  )

  const removeServer = useCallback(
    (id: string) => {
      const server = servers.find((item) => item.id === id)
      if (!server) return
      const next = servers.filter((item) => item.id !== id)
      setServers(next)
      pushSnapshot(next)
      setLog((previous) =>
        [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            severity: 'info' as const,
            message: `${serverLabel(server)} eliminado de ${regionName(server.regionId)}.`
          },
          ...previous
        ].slice(0, 50)
      )
    },
    [servers, pushSnapshot]
  )

  const addProposal = useCallback((proposal: CloudProposal) => {
    setProposals((previous) => [proposal, ...previous])
  }, [])

  const removeProposal = useCallback((id: string) => {
    setProposals((previous) => previous.filter((proposal) => proposal.id !== id))
  }, [])

  const updateProposalStatus = useCallback((id: string, status: CloudProposal['status']) => {
    setProposals((previous) =>
      previous.map((proposal) => (proposal.id === id ? { ...proposal, status } : proposal))
    )
  }, [])

  const setSecurityControl = useCallback((id: string, completed: boolean) => {
    setSecurityControls((previous) => ({ ...previous, [id]: completed }))
  }, [])

  const value = useMemo<CloudStoreValue>(() => {
    const regions = buildRegions(servers)
    const costItems = buildCostItems(servers)
    const totalMonthly = round2(
      costItems.reduce((sum, item) => sum + item.monthlyCost, 0)
    )
    const costDistribution = buildDistribution(costItems)
    const alertEvents = deriveAlertEvents(servers)
    const events = [...alertEvents, ...log]
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, 50)

    const securityScore = Math.round(
      (Object.values(securityControls).filter(Boolean).length / SECURITY_CONTROL_TOTAL) * 100
    )

    // Proyectos = lista maestra + estado y costos en vivo (misma fuente para
    // Planificación, Costos, Infraestructura, Red, Seguridad y Dashboard).
    const statusById = new Map(proposals.map((proposal) => [proposal.id, proposal.status]))
    const projects: CloudProject[] = CLOUD_PROJECTS.map((project) => {
      const projectServers = servers.filter((server) => server.projectId === project.id)
      const grouped = new Map<string, number>()
      for (const server of projectServers) {
        const key = `${server.serviceId}|${server.environment}`
        grouped.set(key, (grouped.get(key) ?? 0) + 1)
      }
      const liveResources = Array.from(grouped.entries()).map(([key, quantity]) => {
        const [serviceId, environment] = key.split('|')
        return { serviceId, environment: environment as CostEnvironment, quantity }
      })

      return {
        ...project,
        status: statusById.get(project.id) ?? project.status,
        liveMonthlyCost: round2(
          liveResources.reduce(
            (sum, resource) => sum + (UNIT_COSTS[resource.serviceId] ?? 0) * resource.quantity,
            0
          )
        ),
        resources: liveResources
      }
    })

    const basePortfolio = portfolioTotals(projects)
    const portfolio: PortfolioTotals = {
      ...basePortfolio,
      monthlyCost: totalMonthly,
      annualCost: round2(totalMonthly * 12),
      resources: servers.length,
      budgetUsagePercent:
        basePortfolio.monthlyBudget > 0
          ? round2((totalMonthly / basePortfolio.monthlyBudget) * 100)
          : 0,
      securityScore
    }

    return {
      servers,
      regions,
      costItems,
      totalMonthly,
      totalAnnual: round2(totalMonthly * 12),
      costDistribution,
      events,
      history,
      serversHistory: history.map((point) => point.servers),
      servicesHistory: history.map((point) => point.services),
      monthlyHistory: history.map((point) => point.monthlyCost),
      proposals,
      projects,
      portfolio,
      monthlyBudgetLimit: MONTHLY_BUDGET,
      securityScore,
      securityControls,
      networkSimulationActive,
      addServer,
      removeServer,
      addProposal,
      removeProposal,
      updateProposalStatus,
      setSecurityControl,
      setNetworkSimulationActive
    }
  }, [
    servers,
    log,
    history,
    proposals,
    securityControls,
    networkSimulationActive,
    addServer,
    removeServer,
    addProposal,
    removeProposal,
    updateProposalStatus,
    setSecurityControl
  ])

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>
}

export function useCloudStore(): CloudStoreValue {
  const context = useContext(CloudContext)
  if (!context) {
    throw new Error('useCloudStore debe usarse dentro de <CloudProvider>')
  }
  return context
}