import { Award, Gauge, HeartPulse, Lightbulb, PiggyBank, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CloudServer } from '../types/cloud'
import { awsServices } from '../data/awsServices'

interface PillarDefinition {
  id: string
  label: string
  description: string
  icon: LucideIcon
  serviceIds: string[]
}

const pillars: PillarDefinition[] = [
  {
    id: 'operational',
    label: 'Excelencia operacional',
    description: 'Despliegue y operación de cargas de trabajo.',
    icon: Lightbulb,
    serviceIds: ['ec2', 'cloudfront', 'route53']
  },
  {
    id: 'security',
    label: 'Seguridad',
    description: 'Identidad, acceso y aislamiento de red.',
    icon: ShieldCheck,
    serviceIds: ['iam', 'vpc']
  },
  {
    id: 'reliability',
    label: 'Fiabilidad',
    description: 'Persistencia, recuperación y disponibilidad.',
    icon: HeartPulse,
    serviceIds: ['ec2', 'rds', 's3', 'route53', 'cloudfront']
  },
  {
    id: 'performance',
    label: 'Eficiencia del rendimiento',
    description: 'Selección y uso eficiente de recursos.',
    icon: Gauge,
    serviceIds: ['ec2', 's3', 'cloudfront', 'vpc', 'rds']
  },
  {
    id: 'cost',
    label: 'Optimización de costos',
    description: 'Uso de servicios y recursos con demanda real.',
    icon: PiggyBank,
    serviceIds: ['ec2', 's3', 'rds', 'vpc', 'route53']
  }
]

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 55) return 'bg-amber-500'
  return 'bg-rose-500'
}

export default function WellArchitectedScorecard({ servers }: { servers: CloudServer[] }) {
  const activeIds = new Set(
    servers.filter((server) => server.status === 'active').map((server) => server.serviceId)
  )
  const knownActiveIds = new Set(awsServices.filter((service) => activeIds.has(service.id)).map((service) => service.id))
  const scores = pillars.map((pillar) => {
    const supporting = pillar.serviceIds.filter((id) => knownActiveIds.has(id))
    const score = Math.round((supporting.length / pillar.serviceIds.length) * 100)
    return { ...pillar, supporting, score }
  })
  const overallScore = Math.round(scores.reduce((sum, pillar) => sum + pillar.score, 0) / scores.length)
  const configuredServices = [...knownActiveIds]
    .map((id) => awsServices.find((service) => service.id === id)?.name ?? id)

  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-textPrimary dark:text-darkTextPrimary">
            <Award className="h-4 w-4 text-amber-500" />
            Well-Architected
          </h2>
          <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">Cobertura heurística por servicios activos</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-textPrimary dark:text-darkTextPrimary">{overallScore}</p>
          <p className="text-[10px] font-semibold uppercase text-textSecondary dark:text-darkTextSecondary">de 100</p>
        </div>
      </header>

      <div className="mt-4 space-y-3">
        {scores.map((pillar) => {
          const Icon = pillar.icon
          return (
            <div key={pillar.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-textPrimary dark:text-darkTextPrimary">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-textSecondary dark:text-darkTextSecondary" />
                  <span className="truncate">{pillar.label}</span>
                </p>
                <span className="shrink-0 text-xs font-bold tabular-nums text-textPrimary dark:text-darkTextPrimary">{pillar.score}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background dark:bg-darkBackground">
                <div className={`h-full rounded-full transition-[width] duration-500 ${scoreColor(pillar.score)}`} style={{ width: `${pillar.score}%` }} />
              </div>
              <p className="mt-1 truncate text-[10px] text-textSecondary dark:text-darkTextSecondary" title={pillar.description}>
                {pillar.supporting.length > 0
                  ? `Activos: ${pillar.supporting.map((id) => awsServices.find((service) => service.id === id)?.name ?? id).join(', ')}`
                  : 'Sin servicios activos de soporte'}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 border-t border-border pt-3 dark:border-darkBorder">
        <p className="text-[10px] leading-4 text-textSecondary dark:text-darkTextSecondary">
          {knownActiveIds.size} servicios activos configurados: {configuredServices.length > 0 ? configuredServices.join(', ') : 'ninguno'}.
          {' '}Puntuación orientativa semisimulada, no equivale a una evaluación oficial de AWS.
        </p>
      </div>
    </section>
  )
}