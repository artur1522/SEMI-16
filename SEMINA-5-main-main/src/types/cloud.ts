export type ServiceStatus = 'active' | 'warning' | 'inactive'
export type RegionStatus = 'operational' | 'degraded' | 'down'
export type ProposalStatus = 'borrador' | 'en_revision' | 'aprobada'
export type CostCategory = 'Compute' | 'Storage' | 'Database' | 'Networking' | 'Security'
export type CostEnvironment = 'dev' | 'staging' | 'production'

export interface Service {
  id: string
  name: string
  fullName: string
  category: string
  description: string
  mainFunction: string
  status: ServiceStatus
  quotas: string
  alternatives: string[]
  docsUrl: string
  related?: string[]
}

export interface AvailabilityZone {
  name: string
  status: ServiceStatus
}

export interface RegionReference {
  id: string
  name: string
  location: string
  latencyMs: number
  availabilityZones: AvailabilityZone[]
}

export interface Region extends RegionReference {
  deployedServices: string[]
  serversDeployed: number
  status: RegionStatus
}

export type ProposalPriority = 'alta' | 'media' | 'baja'

export interface CloudProposal {
  id: string
  solutionName: string
  appType: string
  description: string
  region: string
  estimatedUsers: number
  availabilityLevel: string
  selectedServices: string[]
  migrationGoal: string
  status: ProposalStatus
  priority: ProposalPriority
  createdAt: string
}

export interface CostItem {
  id: string
  service: string
  quantity: number
  estimatedHours: number
  unitCost: number
  monthlyCost: number
  annualCost: number
  category: CostCategory
  environment: CostEnvironment
}

export interface CloudServer {
  id: string
  name: string
  serviceId: string
  regionId: string
  /** Proyecto propietario del recurso (vincula con `cloudOpsData`). */
  projectId?: string
  environment: CostEnvironment
  status: ServiceStatus
  addedAt: number
}

export interface CloudLog {
  id: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  message: string
}

export interface HistoryPoint {
  servers: number
  services: number
  monthlyCost: number
  at: number
  uptime: number
  regionCounts: Record<string, number>
  regionCost: Record<string, number>
}
