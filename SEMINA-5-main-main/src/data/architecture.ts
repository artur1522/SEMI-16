export interface ArchitectureSuggestion {
  name: string
  tagline: string
  stack: string[]
  serviceIds: string[]
  estimatedCost: number
  rationale: string
}

const SERVICE_MAP: Record<string, string> = {
  EC2: 'ec2',
  S3: 's3',
  RDS: 'rds',
  IAM: 'iam',
  VPC: 'vpc',
  'Route 53': 'route53',
  CloudFront: 'cloudfront'
}

const BASE_COSTS: Record<string, number> = {
  EC2: 220,
  S3: 40,
  RDS: 180,
  CloudFront: 90,
  'API Gateway': 70,
  Lambda: 60,
  DynamoDB: 80,
  VPC: 50,
  'Route 53': 25,
  IAM: 5
}

export function suggestArchitectures(
  appType: string,
  estimatedUsers: number,
  availabilityLevel: string
): ArchitectureSuggestion[] {
  if (!appType || !Number.isFinite(estimatedUsers) || estimatedUsers <= 0 || !availabilityLevel) return []
  const isMobile = appType.toLowerCase().includes('movil') || appType.toLowerCase().includes('mobile')
  const isApi = appType.toLowerCase().includes('api')
  const base = isApi ? ['API Gateway', 'Lambda', 'DynamoDB'] : isMobile ? ['CloudFront', 'S3', 'API Gateway'] : ['CloudFront', 'S3', 'EC2', 'RDS']
  const multiplier = availabilityLevel === 'critica' ? 1.8 : availabilityLevel === 'alta' ? 1.3 : 1
  const costFor = (stack: string[], mult: number) =>
    Math.round((stack.reduce((sum, service) => sum + (BASE_COSTS[service] ?? 100), 0) + estimatedUsers * 0.01) * mult)

  const variants: Omit<ArchitectureSuggestion, 'serviceIds'>[] = [
    {
      name: 'Recomendada',
      tagline: 'Equilibrio entre costo y rendimiento',
      stack: base,
      estimatedCost: costFor(base, multiplier),
      rationale: `Arquitectura sugerida para ${estimatedUsers.toLocaleString('es-ES')} usuarios con disponibilidad ${availabilityLevel}.`
    },
    {
      name: 'Optimizada en costo',
      tagline: 'Reduce gasto usando servicios administrados',
      stack: isApi ? ['Lambda', 'DynamoDB', 'S3'] : isMobile ? ['S3', 'CloudFront', 'Route 53'] : ['S3', 'EC2', 'Route 53'],
      estimatedCost: costFor(isApi ? ['Lambda', 'DynamoDB', 'S3'] : isMobile ? ['S3', 'CloudFront', 'Route 53'] : ['S3', 'EC2', 'Route 53'], multiplier * 0.78),
      rationale: 'Maximiza ahorro eliminando instancias sobrantes y priorizando servicios 100% administrados.'
    },
    {
      name: 'Alta resistencia',
      tagline: 'Redundancia y recuperación para cargas críticas',
      stack: [...new Set([...base, 'VPC', 'Route 53', 'IAM'])],
      estimatedCost: costFor([...new Set([...base, 'VPC', 'Route 53', 'IAM'])], multiplier * 1.35),
      rationale: 'Añade red aislada, DNS tolerante a fallos y control de accesos para escenarios de producción.'
    }
  ]

  return variants.map((variant) => ({
    ...variant,
    serviceIds: variant.stack.map((service) => SERVICE_MAP[service]).filter((id): id is string => Boolean(id))
  }))
}
