import { awsServices } from './awsServices'
import { regionReferences } from './regions'
import type { CloudServer, CostEnvironment } from '../types/cloud'

const environmentLabels: Record<CostEnvironment, string> = {
  dev: 'Desarrollo',
  staging: 'Staging',
  production: 'Producción'
}

export interface ServerNameDetails {
  serviceName: string
  serviceFullName: string
  regionName: string
  environmentLabel: string
}

export function getServerNameDetails(server: CloudServer): ServerNameDetails {
  const service = awsServices.find((item) => item.id === server.serviceId)
  const region = regionReferences.find((item) => item.id === server.regionId)

  return {
    serviceName: service?.name ?? server.serviceId,
    serviceFullName: service?.fullName ?? 'Servicio de infraestructura',
    regionName: region?.name ?? server.regionId,
    environmentLabel: environmentLabels[server.environment]
  }
}

export function getServerMeaning(server: CloudServer): string {
  const details = getServerNameDetails(server)
  return `${details.serviceName} (${details.serviceFullName}) en ${details.regionName} · ${details.environmentLabel}`
}
