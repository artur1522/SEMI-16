import type {
  CostCategory,
  CostEnvironment,
  CostItem,
  ProposalPriority,
  ProposalStatus
} from '../types/cloud'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CloudOps · Fuente única de verdad (Single Source of Truth)
 * ─────────────────────────────────────────────────────────────────────────────
 * TODA la plataforma (Dashboard, Planificación, Costos, Infraestructura,
 * Seguridad, Red, Servicios y Configuración) consume este módulo.
 *
 * Reglas:
 *  1. `CLOUD_PROJECTS` es la lista maestra de proyectos/propuestas cloud.
 *  2. Los costos se derivan SIEMPRE de `UNIT_COSTS` + `resources` del proyecto.
 *  3. Infraestructura, Red y Costos recomputan desde los mismos recursos, por lo
 *     que un cambio de estado/costo se refleja idéntico en todas las vistas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const HOURS_PER_MONTH = 730
export const MONTHLY_BUDGET_LIMIT = 4000
export const SECURITY_CONTROL_TOTAL = 8

/** Tarifas mensuales unitarias por servicio (USD). Única tabla de precios. */
export const UNIT_COSTS: Record<string, number> = {
  ec2: 120,
  s3: 0.023,
  rds: 185,
  iam: 0,
  vpc: 45,
  route53: 5,
  cloudfront: 95.5
}

/** Categoría de costo de cada servicio. Único mapa. */
export const SERVICE_CATEGORY: Record<string, CostCategory> = {
  ec2: 'Compute',
  s3: 'Storage',
  rds: 'Database',
  vpc: 'Networking',
  route53: 'Networking',
  cloudfront: 'Networking',
  iam: 'Security',
  waf: 'Security',
  sqs: 'Compute',
  lambda: 'Compute'
}

/** Etiqueta corta y estable para badges (EC2, S3, RDS...). */
export const SERVICE_LABELS: Record<string, string> = {
  ec2: 'EC2',
  s3: 'S3',
  rds: 'RDS',
  iam: 'IAM',
  vpc: 'VPC',
  route53: 'Route 53',
  cloudfront: 'CloudFront',
  waf: 'WAF',
  sqs: 'SQS',
  lambda: 'Lambda'
}

export const COST_CATEGORY_COLORS: Record<string, string> = {
  Compute: '#2563EB',
  Storage: '#06B6D4',
  Database: '#F59E0B',
  Networking: '#16A34A',
  Security: '#7C3AED'
}

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = {
  Compute: 'Cómputo',
  Storage: 'Almacenamiento',
  Database: 'Base de datos',
  Networking: 'Red',
  Security: 'Seguridad'
}

/* ── Paleta semántica única de estados ───────────────────────────────────── */

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'

/** Verde = Aprobada/Online · Amarillo = En revisión/Pendiente · Rojo = Crítico/Borrador */
export const STATUS_META: Record<
  ProposalStatus,
  { label: string; tone: Tone; dot: string }
> = {
  aprobada: { label: 'Aprobada', tone: 'success', dot: 'bg-success dark:bg-darkSuccess' },
  en_revision: { label: 'En revisión', tone: 'warning', dot: 'bg-warning dark:bg-darkWarning' },
  borrador: { label: 'Borrador', tone: 'danger', dot: 'bg-danger dark:bg-darkDanger' }
}

export const PRIORITY_META: Record<ProposalPriority, { label: string; tone: Tone }> = {
  alta: { label: 'Alta', tone: 'danger' },
  media: { label: 'Media', tone: 'warning' },
  baja: { label: 'Baja', tone: 'success' }
}

export type ProjectStage = 'planificacion' | 'implementacion' | 'operacion' | 'soporte'

export const STAGE_META: Record<ProjectStage, { label: string; tone: Tone }> = {
  planificacion: { label: 'Planificación', tone: 'info' },
  implementacion: { label: 'Implementación', tone: 'warning' },
  operacion: { label: 'Operación', tone: 'success' },
  soporte: { label: 'Soporte', tone: 'neutral' }
}

export type AvailabilityLevel = 'basica' | 'alta' | 'critica'

export const AVAILABILITY_META: Record<
  AvailabilityLevel,
  { label: string; sla: string; tone: Tone; weeks: string }
> = {
  basica: { label: 'Básica', sla: '99.9%', tone: 'success', weeks: '4–6 semanas' },
  alta: { label: 'Alta', sla: '99.99%', tone: 'warning', weeks: '6–8 semanas' },
  critica: { label: 'Crítica', sla: '99.999%', tone: 'danger', weeks: '10–14 semanas' }
}

export type SecurityPosture = 'fuerte' | 'media' | 'critica'

export const SECURITY_POSTURE_META: Record<SecurityPosture, { label: string; tone: Tone }> = {
  fuerte: { label: 'Fuerte', tone: 'success' },
  media: { label: 'En revisión', tone: 'warning' },
  critica: { label: 'Crítica', tone: 'danger' }
}

export type NetworkHealth = 'estable' | 'saturado' | 'degradado'

export const NETWORK_HEALTH_META: Record<NetworkHealth, { label: string; tone: Tone }> = {
  estable: { label: 'Estable', tone: 'success' },
  saturado: { label: 'Saturado', tone: 'warning' },
  degradado: { label: 'Degradado', tone: 'danger' }
}

/* ── Modelo de datos ─────────────────────────────────────────────────────── */

export interface ProjectResource {
  serviceId: string
  environment: CostEnvironment
  quantity: number
}

export interface ProjectNetwork {
  /** Consumo de red mensual de subida (GB). */
  ingressGb: number
  /** Consumo de red mensual de bajada (GB). */
  egressGb: number
  /** Ancho de banda pico observado (Gb/s). */
  peakBandwidthGbps: number
  /** CIDR de la VPC dedicada. */
  vpcCidr: string
  subnets: { name: string; cidr: string; type: 'publica' | 'privada' }[]
  domains: string[]
  cdnEnabled: boolean
  wafEnabled: boolean
  health: NetworkHealth
}

export interface ProjectSecurity {
  /** Puntuación 0–100 del proyecto. */
  score: number
  posture: SecurityPosture
  openAlerts: number
  criticalFindings: number
  mfaCoverage: number
  controls: { id: string; label: string; done: boolean }[]
}

export interface CloudProject {
  id: string
  code: string
  name: string
  description: string
  owner: string
  appType: string
  status: ProposalStatus
  stage: ProjectStage
  priority: ProposalPriority
  regionId: string
  estimatedUsers: number
  availabilityLevel: AvailabilityLevel
  /** Servicios cloud activos (para badges y catálogo). */
  services: string[]
  /** Plan de recursos: es la SEMILLA de infraestructura y costos. */
  resources: ProjectResource[]
  network: ProjectNetwork
  security: ProjectSecurity
  /** Presupuesto mensual aprobado (USD). */
  monthlyBudget: number
  /** Costo mensual en vivo (lo inyecta el store desde el inventario real). */
  liveMonthlyCost?: number
  /** Objetivo de migración / nota de alcance. */
  migrationGoal: string
  slaUptime: number
  createdAt: string
  updatedAt: string
}

/* ── Lista maestra de proyectos ──────────────────────────────────────────── */

const CONTROL_LABELS: Record<string, string> = {
  mfa: 'MFA obligatorio',
  keys: 'Rotación de llaves',
  cifrado: 'Cifrado en reposo',
  tls: 'TLS 1.2+ en tránsito',
  parches: 'Parches de seguridad',
  logs: 'CloudTrail activo',
  sg: 'Grupos de seguridad mínimos',
  backup: 'Backups habilitados'
}

const buildControls = (doneIds: string[]): ProjectSecurity['controls'] =>
  Object.entries(CONTROL_LABELS).map(([id, label]) => ({
    id,
    label,
    done: doneIds.includes(id)
  }))

export const CLOUD_PROJECTS: CloudProject[] = [
  {
    id: 'prj-core-bancario',
    code: 'CB-001',
    name: 'Plataforma Core Bancaria',
    description:
      'Núcleo transaccional bancario con aislamiento de red, auditoría de accesos y base de datos relacional de alta disponibilidad.',
    owner: 'Ana Martínez',
    appType: 'Enterprise',
    status: 'en_revision',
    stage: 'implementacion',
    priority: 'alta',
    regionId: 'eu-west-1',
    estimatedUsers: 8000,
    availabilityLevel: 'critica',
    services: ['ec2', 'rds', 'iam', 'vpc', 'route53'],
    resources: [
      { serviceId: 'ec2', environment: 'production', quantity: 5 },
      { serviceId: 'ec2', environment: 'staging', quantity: 1 },
      { serviceId: 'rds', environment: 'production', quantity: 1 },
      { serviceId: 's3', environment: 'staging', quantity: 1 },
      { serviceId: 'iam', environment: 'production', quantity: 1 },
      { serviceId: 'vpc', environment: 'production', quantity: 1 },
      { serviceId: 'route53', environment: 'dev', quantity: 2 }
    ],
    network: {
      ingressGb: 4200,
      egressGb: 6100,
      peakBandwidthGbps: 1.8,
      vpcCidr: '10.10.0.0/16',
      subnets: [
        { name: 'core-publica', cidr: '10.10.0.0/24', type: 'publica' },
        { name: 'core-privada', cidr: '10.10.1.0/24', type: 'privada' }
      ],
      domains: ['core.banco.pe', 'api.banco.pe'],
      cdnEnabled: false,
      wafEnabled: true,
      health: 'estable'
    },
    security: {
      score: 88,
      posture: 'fuerte',
      openAlerts: 1,
      criticalFindings: 0,
      mfaCoverage: 100,
      controls: buildControls(['mfa', 'cifrado', 'tls', 'logs', 'sg', 'backup'])
    },
    monthlyBudget: 1200,
    migrationGoal:
      'Cumplir requisitos regulatorios con alta disponibilidad y trazabilidad completa.',
    slaUptime: 99.999,
    createdAt: '2026-09-10T16:20:00.000Z',
    updatedAt: '2026-09-28T10:05:00.000Z'
  },
  {
    id: 'prj-ecommerce',
    code: 'EC-002',
    name: 'E-Commerce Multirregión',
    description:
      'Tienda en línea con catálogo, pasarela de pagos y panel de administración replicado en varias regiones.',
    owner: 'Carlos Ruiz',
    appType: 'Web / API',
    status: 'aprobada',
    stage: 'operacion',
    priority: 'alta',
    regionId: 'sa-east-1',
    estimatedUsers: 50000,
    availabilityLevel: 'alta',
    services: ['ec2', 'rds', 's3', 'cloudfront', 'route53'],
    resources: [
      { serviceId: 'ec2', environment: 'production', quantity: 4 },
      { serviceId: 'ec2', environment: 'staging', quantity: 1 },
      { serviceId: 'rds', environment: 'production', quantity: 1 },
      { serviceId: 's3', environment: 'staging', quantity: 1 },
      { serviceId: 'cloudfront', environment: 'production', quantity: 1 },
      { serviceId: 'route53', environment: 'production', quantity: 1 }
    ],
    network: {
      ingressGb: 9800,
      egressGb: 24500,
      peakBandwidthGbps: 6.4,
      vpcCidr: '10.20.0.0/16',
      subnets: [
        { name: 'shop-publica', cidr: '10.20.0.0/24', type: 'publica' },
        { name: 'shop-privada', cidr: '10.20.1.0/24', type: 'privada' }
      ],
      domains: ['tienda.pe', 'cdn.tienda.pe'],
      cdnEnabled: true,
      wafEnabled: true,
      health: 'estable'
    },
    security: {
      score: 92,
      posture: 'fuerte',
      openAlerts: 0,
      criticalFindings: 0,
      mfaCoverage: 96,
      controls: buildControls(['mfa', 'keys', 'cifrado', 'tls', 'logs', 'sg', 'backup'])
    },
    monthlyBudget: 900,
    migrationGoal: 'Atender picos de tráfico regionales manteniendo latencia baja en Sudamérica.',
    slaUptime: 99.99,
    createdAt: '2026-08-14T14:30:00.000Z',
    updatedAt: '2026-09-27T18:40:00.000Z'
  },
  {
    id: 'prj-telemetria-iot',
    code: 'TI-003',
    name: 'Sistema de Telemetría IoT',
    description:
      'Ingesta y procesamiento de lecturas de sensores industriales con almacenamiento histórico y alertas.',
    owner: 'Laura Gómez',
    appType: 'Microservicios',
    status: 'aprobada',
    stage: 'operacion',
    priority: 'alta',
    regionId: 'us-east-1',
    estimatedUsers: 100000,
    availabilityLevel: 'critica',
    services: ['ec2', 's3', 'iam', 'vpc'],
    resources: [
      { serviceId: 'ec2', environment: 'production', quantity: 6 },
      { serviceId: 'ec2', environment: 'staging', quantity: 2 },
      { serviceId: 's3', environment: 'staging', quantity: 2 },
      { serviceId: 'rds', environment: 'production', quantity: 2 },
      { serviceId: 'iam', environment: 'production', quantity: 1 },
      { serviceId: 'vpc', environment: 'production', quantity: 1 },
      { serviceId: 'cloudfront', environment: 'production', quantity: 2 }
    ],
    network: {
      ingressGb: 31000,
      egressGb: 8400,
      peakBandwidthGbps: 4.1,
      vpcCidr: '10.30.0.0/16',
      subnets: [
        { name: 'iot-publica', cidr: '10.30.0.0/24', type: 'publica' },
        { name: 'iot-privada', cidr: '10.30.1.0/24', type: 'privada' }
      ],
      domains: ['telemetria.io', 'ingest.telemetria.io'],
      cdnEnabled: true,
      wafEnabled: true,
      health: 'saturado'
    },
    security: {
      score: 74,
      posture: 'media',
      openAlerts: 3,
      criticalFindings: 1,
      mfaCoverage: 72,
      controls: buildControls(['mfa', 'cifrado', 'logs', 'sg'])
    },
    monthlyBudget: 1400,
    migrationGoal:
      'Escalar horizontalmente la ingesta de datos con tolerancia a fallos crítica.',
    slaUptime: 99.999,
    createdAt: '2026-08-25T18:45:00.000Z',
    updatedAt: '2026-09-29T08:12:00.000Z'
  },
  {
    id: 'prj-delivery',
    code: 'DM-004',
    name: 'App Móvil Delivery',
    description:
      'Aplicación de reparto a domicilio con seguimiento de pedidos en tiempo real y distribución de contenido estático.',
    owner: 'Sofía López',
    appType: 'Móvil',
    status: 'borrador',
    stage: 'planificacion',
    priority: 'baja',
    regionId: 'sa-east-1',
    estimatedUsers: 25000,
    availabilityLevel: 'alta',
    services: ['s3', 'cloudfront', 'route53', 'iam'],
    resources: [
      { serviceId: 'ec2', environment: 'staging', quantity: 1 },
      { serviceId: 's3', environment: 'staging', quantity: 1 },
      { serviceId: 'cloudfront', environment: 'production', quantity: 1 },
      { serviceId: 'route53', environment: 'dev', quantity: 1 },
      { serviceId: 'iam', environment: 'production', quantity: 1 }
    ],
    network: {
      ingressGb: 1600,
      egressGb: 7300,
      peakBandwidthGbps: 1.1,
      vpcCidr: '10.40.0.0/16',
      subnets: [
        { name: 'app-publica', cidr: '10.40.0.0/24', type: 'publica' },
        { name: 'app-privada', cidr: '10.40.1.0/24', type: 'privada' }
      ],
      domains: ['delivery.app'],
      cdnEnabled: true,
      wafEnabled: false,
      health: 'estable'
    },
    security: {
      score: 61,
      posture: 'critica',
      openAlerts: 4,
      criticalFindings: 2,
      mfaCoverage: 45,
      controls: buildControls(['cifrado', 'logs'])
    },
    monthlyBudget: 350,
    migrationGoal: 'Distribuir assets con baja latencia y asegurar el acceso de los usuarios móviles.',
    slaUptime: 99.99,
    createdAt: '2026-09-01T11:00:00.000Z',
    updatedAt: '2026-09-26T15:30:00.000Z'
  },
  {
    id: 'prj-portal-academico',
    code: 'PA-005',
    name: 'Portal Académico SENATI',
    description:
      'Portal de gestión académica con matrículas, notas y aula virtual para alumnos y docentes.',
    owner: 'Pedro Sánchez',
    appType: 'Web',
    status: 'en_revision',
    stage: 'implementacion',
    priority: 'media',
    regionId: 'us-east-1',
    estimatedUsers: 12000,
    availabilityLevel: 'alta',
    services: ['ec2', 'rds', 'vpc'],
    resources: [
      { serviceId: 'ec2', environment: 'production', quantity: 3 },
      { serviceId: 'ec2', environment: 'staging', quantity: 1 },
      { serviceId: 'rds', environment: 'production', quantity: 1 },
      { serviceId: 's3', environment: 'staging', quantity: 1 },
      { serviceId: 'vpc', environment: 'production', quantity: 1 },
      { serviceId: 'route53', environment: 'dev', quantity: 1 }
    ],
    network: {
      ingressGb: 2400,
      egressGb: 5200,
      peakBandwidthGbps: 1.4,
      vpcCidr: '10.50.0.0/16',
      subnets: [
        { name: 'edu-publica', cidr: '10.50.0.0/24', type: 'publica' },
        { name: 'edu-privada', cidr: '10.50.1.0/24', type: 'privada' }
      ],
      domains: ['aula.senati.pe', 'portal.senati.pe'],
      cdnEnabled: false,
      wafEnabled: true,
      health: 'degradado'
    },
    security: {
      score: 70,
      posture: 'media',
      openAlerts: 2,
      criticalFindings: 1,
      mfaCoverage: 68,
      controls: buildControls(['mfa', 'cifrado', 'sg', 'tls'])
    },
    monthlyBudget: 650,
    migrationGoal: 'Centralizar la información académica y reducir el mantenimiento del servidor local.',
    slaUptime: 99.99,
    createdAt: '2026-08-19T09:15:00.000Z',
    updatedAt: '2026-09-25T12:00:00.000Z'
  },
  {
    id: 'prj-analytics',
    code: 'AN-006',
    name: 'Data Analytics & Reporting',
    description:
      'Plataforma de analítica con almacén de datos, reportes ejecutivos y exportaciones programadas.',
    owner: 'Ana Martínez',
    appType: 'Datos / BI',
    status: 'aprobada',
    stage: 'soporte',
    priority: 'media',
    regionId: 'us-west-2',
    estimatedUsers: 3200,
    availabilityLevel: 'basica',
    services: ['ec2', 's3', 'rds', 'vpc'],
    resources: [
      { serviceId: 'ec2', environment: 'production', quantity: 2 },
      { serviceId: 'ec2', environment: 'dev', quantity: 2 },
      { serviceId: 'rds', environment: 'production', quantity: 1 },
      { serviceId: 's3', environment: 'production', quantity: 1 },
      { serviceId: 'vpc', environment: 'production', quantity: 1 }
    ],
    network: {
      ingressGb: 3600,
      egressGb: 1900,
      peakBandwidthGbps: 0.8,
      vpcCidr: '10.60.0.0/16',
      subnets: [
        { name: 'bi-publica', cidr: '10.60.0.0/24', type: 'publica' },
        { name: 'bi-privada', cidr: '10.60.1.0/24', type: 'privada' }
      ],
      domains: ['bi.interno.pe'],
      cdnEnabled: false,
      wafEnabled: false,
      health: 'estable'
    },
    security: {
      score: 83,
      posture: 'fuerte',
      openAlerts: 1,
      criticalFindings: 0,
      mfaCoverage: 88,
      controls: buildControls(['mfa', 'keys', 'cifrado', 'logs', 'backup'])
    },
    monthlyBudget: 500,
    migrationGoal: 'Unificar el reporting ejecutivo con datos trazables y de bajo costo.',
    slaUptime: 99.9,
    createdAt: '2026-07-30T10:10:00.000Z',
    updatedAt: '2026-09-20T09:45:00.000Z'
  }
]

/* ── Derivadores (mismos cálculos para todas las vistas) ─────────────────── */

const round2 = (value: number) => Math.round(value * 100) / 100

/** Costo mensual de un proyecto derivado de sus recursos y `UNIT_COSTS`. */
export function projectMonthlyCost(project: CloudProject): number {
  return round2(
    project.resources.reduce(
      (sum, resource) => sum + (UNIT_COSTS[resource.serviceId] ?? 0) * resource.quantity,
      0
    )
  )
}

/** Desglose por servicio de un proyecto con la MISMA forma que `CostItem`. */
export function projectCostItems(project: CloudProject): CostItem[] {
  const grouped = new Map<string, { qty: number; envs: CostEnvironment[] }>()
  for (const resource of project.resources) {
    const existing = grouped.get(resource.serviceId)
    if (existing) {
      existing.qty += resource.quantity
      if (!existing.envs.includes(resource.environment)) existing.envs.push(resource.environment)
    } else {
      grouped.set(resource.serviceId, {
        qty: resource.quantity,
        envs: [resource.environment]
      })
    }
  }

  const envPriority: CostEnvironment[] = ['production', 'staging', 'dev']
  const items: CostItem[] = []
  for (const [serviceId, { qty, envs }] of grouped) {
    const unitCost = UNIT_COSTS[serviceId] ?? 0
    if (unitCost === 0) continue
    const monthlyCost = round2(qty * unitCost)
    items.push({
      id: `${project.id}-${serviceId}`,
      service: SERVICE_LABELS[serviceId] ?? serviceId.toUpperCase(),
      quantity: qty,
      estimatedHours: HOURS_PER_MONTH,
      unitCost,
      monthlyCost,
      annualCost: round2(monthlyCost * 12),
      category: SERVICE_CATEGORY[serviceId] ?? 'Compute',
      environment: envPriority.find((env) => envs.includes(env)) ?? envs[0]
    })
  }
  return items
}

export interface PortfolioTotals {
  projects: number
  approved: number
  inReview: number
  draft: number
  operating: number
  monthlyCost: number
  annualCost: number
  monthlyBudget: number
  budgetUsagePercent: number
  users: number
  securityScore: number
  openAlerts: number
  criticalFindings: number
  ingressGb: number
  egressGb: number
  peakBandwidthGbps: number
  resources: number
  servicesInUse: string[]
  operationalProjects: number
}

/** KPIs globales del portafolio: la misma cifra en todas las vistas. */
export function portfolioTotals(projects: CloudProject[] = CLOUD_PROJECTS): PortfolioTotals {
  const monthlyCost = round2(
    projects.reduce((sum, project) => sum + projectMonthlyCost(project), 0)
  )
  const monthlyBudget = projects.reduce((sum, project) => sum + project.monthlyBudget, 0)
  const resources = projects.reduce(
    (sum, project) => sum + project.resources.reduce((n, r) => n + r.quantity, 0),
    0
  )
  const servicesInUse = Array.from(new Set(projects.flatMap((project) => project.services)))

  return {
    projects: projects.length,
    approved: projects.filter((project) => project.status === 'aprobada').length,
    inReview: projects.filter((project) => project.status === 'en_revision').length,
    draft: projects.filter((project) => project.status === 'borrador').length,
    operating: projects.filter((project) => project.stage === 'operacion').length,
    monthlyCost,
    annualCost: round2(monthlyCost * 12),
    monthlyBudget,
    budgetUsagePercent: monthlyBudget > 0 ? round2((monthlyCost / monthlyBudget) * 100) : 0,
    users: projects.reduce((sum, project) => sum + project.estimatedUsers, 0),
    securityScore:
      projects.length > 0
        ? Math.round(
            projects.reduce((sum, project) => sum + project.security.score, 0) / projects.length
          )
        : 100,
    openAlerts: projects.reduce((sum, project) => sum + project.security.openAlerts, 0),
    criticalFindings: projects.reduce(
      (sum, project) => sum + project.security.criticalFindings,
      0
    ),
    ingressGb: projects.reduce((sum, project) => sum + project.network.ingressGb, 0),
    egressGb: projects.reduce((sum, project) => sum + project.network.egressGb, 0),
    peakBandwidthGbps: round2(
      projects.reduce((sum, project) => sum + project.network.peakBandwidthGbps, 0)
    ),
    resources,
    servicesInUse,
    operationalProjects: projects.filter(
      (project) => project.stage === 'operacion' || project.stage === 'soporte'
    ).length
  }
}

/** Costo mensual agregado por región (misma fórmula que el store). */
export function costByRegion(projects: CloudProject[] = CLOUD_PROJECTS): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const project of projects) {
    totals[project.regionId] = round2(
      (totals[project.regionId] ?? 0) + projectMonthlyCost(project)
    )
  }
  return totals
}

/** Proyectos agrupados por región. */
export function projectsByRegion(
  regionId: string,
  projects: CloudProject[] = CLOUD_PROJECTS
): CloudProject[] {
  return projects.filter((project) => project.regionId === regionId)
}

/** Veces que cada servicio aparece en el portafolio (popularidad del catálogo). */
export function serviceUsage(
  projects: CloudProject[] = CLOUD_PROJECTS
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const project of projects) {
    for (const serviceId of project.services) {
      counts.set(serviceId, (counts.get(serviceId) ?? 0) + 1)
    }
  }
  return counts
}

/** Nube de etiquetas uniforme para servicios. */
export function serviceBadges(serviceIds: string[]): { id: string; label: string }[] {
  return serviceIds.map((id) => ({ id, label: SERVICE_LABELS[id] ?? id.toUpperCase() }))
}

export function projectById(
  id: string,
  projects: CloudProject[] = CLOUD_PROJECTS
): CloudProject | undefined {
  return projects.find((project) => project.id === id)
}

/** Estado de salud global de red derivado de todos los proyectos. */
export function networkOverview(projects: CloudProject[] = CLOUD_PROJECTS) {
  const totals = portfolioTotals(projects)
  const cdnCount = projects.filter((project) => project.network.cdnEnabled).length
  const wafCount = projects.filter((project) => project.network.wafEnabled).length
  const domains = projects.flatMap((project) => project.network.domains)
  const vpcs = projects.map((project) => ({
    id: project.id,
    name: project.name,
    code: project.code,
    cidr: project.network.vpcCidr,
    subnets: project.network.subnets,
    health: project.network.health,
    regionId: project.regionId
  }))

  return {
    totals,
    cdnCount,
    wafCount,
    domains,
    vpcs,
    degraded: projects.filter((project) => project.network.health !== 'estable').length
  }
}

/** Resumen de seguridad agregado para la vista Seguridad. */
export function securityOverview(projects: CloudProject[] = CLOUD_PROJECTS) {
  const totals = portfolioTotals(projects)
  const ranked = [...projects].sort((a, b) => a.security.score - b.security.score)
  const controlCompletion = (controlId: string) => {
    const withControl = projects.filter((project) =>
      project.security.controls.some((control) => control.id === controlId)
    )
    if (withControl.length === 0) return 0
    const done = withControl.filter((project) =>
      project.security.controls.find((control) => control.id === controlId)?.done
    ).length
    return Math.round((done / withControl.length) * 100)
  }

  return {
    totals,
    weakest: ranked[0],
    strongest: ranked[ranked.length - 1],
    byProject: ranked,
    controlCompletion
  }
}

/** Inventario de recursos planificado por proyecto (semilla de infraestructura). */
export function plannedResourceCount(projects: CloudProject[] = CLOUD_PROJECTS): number {
  return projects.reduce(
    (sum, project) => sum + project.resources.reduce((n, r) => n + r.quantity, 0),
    0
  )
}

export default CLOUD_PROJECTS
