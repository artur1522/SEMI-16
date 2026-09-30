import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Database,
  Eye,
  EyeOff,
  Globe,
  Layers,
  Network as NetworkIcon,
  RotateCcw,
  Server,
  Shield,
  Tags,
  XCircle,
  type LucideIcon
} from 'lucide-react'
import { Badge, Button, PageHeader, Section } from '../components/ui'
import { useCloudStore } from '../store/cloudStore'

interface FlowNodeProps {
  icon: LucideIcon
  name: string
  description: string
  tone?: 'default' | 'error'
}

function FlowNode({ icon: Icon, name, description, tone = 'default' }: FlowNodeProps) {
  const isError = tone === 'error'

  return (
    <div
      className={`flex flex-1 flex-col items-center rounded-2xl border p-4 text-center shadow-sm ${
        isError
          ? 'border-danger/60 bg-danger/5 dark:border-darkDanger/60 dark:bg-darkDanger/10'
          : 'border-border bg-white dark:border-darkBorder dark:bg-darkCard'
      }`}
    >
      <div
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${
          isError
            ? 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger'
            : 'bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary'
        }`}
      >
        <Icon className={`h-6 w-6 ${isError ? 'opacity-40' : ''}`} />
        {isError && (
          <span className="animate-node-alert absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-sm dark:bg-darkDanger">
            <AlertTriangle className="h-3 w-3" />
          </span>
        )}
      </div>
      <h3
        className={`mt-3 text-sm font-semibold ${
          isError
            ? 'text-danger dark:text-darkDanger'
            : 'text-textPrimary dark:text-darkTextPrimary'
        }`}
      >
        {name}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-textSecondary dark:text-darkTextSecondary">
        {description}
      </p>
      {isError && (
        <span className="mt-2 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger dark:bg-darkDanger/10 dark:text-darkDanger">
          Nodo caído
        </span>
      )}
    </div>
  )
}

type FlowArrowVariant = 'normal' | 'broken' | 'fallback'

function FlowArrow({ variant = 'normal' }: { variant?: FlowArrowVariant }) {
  const isError = variant !== 'normal'

  return (
    <div className="flex flex-col items-center justify-center gap-1 py-1 lg:flex-row lg:gap-2 lg:px-1 lg:py-0">
      <div className="flex items-center gap-2">
        <span
          className={`flow-dash h-4 w-0.5 rotate-90 lg:h-0.5 lg:w-10 ${
            isError
              ? 'text-danger dark:text-darkDanger'
              : 'text-textSecondary dark:text-darkTextSecondary'
          }`}
          aria-hidden="true"
        />
        {variant === 'broken' ? (
          <XCircle
            className="h-5 w-5 text-danger dark:text-darkDanger"
            aria-hidden="true"
          />
        ) : (
          <ArrowRight
            className={`h-5 w-5 rotate-90 lg:rotate-0 ${
              isError
                ? 'text-danger dark:text-darkDanger'
                : 'animate-flow-arrow text-textSecondary dark:text-darkTextSecondary'
            }`}
            aria-hidden="true"
          />
        )}
      </div>
      {variant === 'broken' && (
        <span className="text-xs font-semibold text-danger dark:text-darkDanger">
          Enlace interrumpido
        </span>
      )}
      {variant === 'fallback' && (
        <span className="text-xs font-semibold text-danger dark:text-darkDanger">
          Ruta de fallback activada
        </span>
      )}
    </div>
  )
}

function SubnetResource({
  icon: Icon,
  name,
  description,
  tone
}: {
  icon: LucideIcon
  name: string
  description: string
  tone: 'success' | 'warning'
}) {
  const toneClasses =
    tone === 'success'
      ? 'border-success/40 bg-success/5 text-success dark:border-darkSuccess/40 dark:bg-darkSuccess/10 dark:text-darkSuccess'
      : 'border-warning/40 bg-warning/5 text-warning dark:border-darkWarning/40 dark:bg-darkWarning/10 dark:text-darkWarning'

  return (
    <div className={`flex items-center gap-2 rounded-lg border p-2 ${toneClasses}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">{name}</p>
        <p className="truncate text-xs text-textSecondary dark:text-darkTextSecondary">{description}</p>
      </div>
    </div>
  )
}

interface SecurityGroupRule {
  port: string
  protocol: string
  origin: string
  resource: string
  access: 'open' | 'restricted'
}

const securityGroupRules: SecurityGroupRule[] = [
  {
    port: '80 / 443',
    protocol: 'TCP',
    origin: '0.0.0.0/0',
    resource: 'CloudFront',
    access: 'open'
  },
  {
    port: '443',
    protocol: 'TCP',
    origin: '0.0.0.0/0',
    resource: 'Application Load Balancer',
    access: 'open'
  },
  {
    port: '22',
    protocol: 'TCP',
    origin: '203.0.113.10/32',
    resource: 'EC2 (bastion)',
    access: 'restricted'
  },
  {
    port: '3306',
    protocol: 'TCP',
    origin: '10.0.0.0/16 (VPC)',
    resource: 'RDS',
    access: 'restricted'
  },
  {
    port: '6379',
    protocol: 'TCP',
    origin: '10.0.1.0/24 (subred privada)',
    resource: 'ElastiCache',
    access: 'restricted'
  }
]

interface TrafficLog {
  id: string
  timestamp: string
  sourceIp: string
  destination: string
  port: string
  protocol: string
  action: 'permitida' | 'denegada'
}

const trafficLogs: TrafficLog[] = [
  { id: 'tl-1', timestamp: '09:41:22', sourceIp: '203.0.113.7', destination: 'ALB (público)', port: '443', protocol: 'TCP', action: 'permitida' },
  { id: 'tl-2', timestamp: '09:40:58', sourceIp: '198.51.100.23', destination: 'EC2 (bastion)', port: '22', protocol: 'TCP', action: 'denegada' },
  { id: 'tl-3', timestamp: '09:40:12', sourceIp: '10.0.0.24', destination: 'RDS', port: '3306', protocol: 'TCP', action: 'permitida' },
  { id: 'tl-4', timestamp: '09:38:47', sourceIp: '192.0.2.100', destination: 'RDS', port: '3306', protocol: 'TCP', action: 'denegada' },
  { id: 'tl-5', timestamp: '09:36:03', sourceIp: '10.0.4.15', destination: 'ElastiCache', port: '6379', protocol: 'TCP', action: 'permitida' },
  { id: 'tl-6', timestamp: '09:31:40', sourceIp: '203.0.113.88', destination: 'CloudFront', port: '80', protocol: 'TCP', action: 'denegada' },
  { id: 'tl-7', timestamp: '09:29:11', sourceIp: '10.0.0.31', destination: 'EC2 (bastion)', port: '22', protocol: 'TCP', action: 'permitida' }
]

interface FlowSegment {
  id: string
  from: string
  to: string
  bandwidth: number
  unit: 'Gb/s' | 'Mb/s'
}

const flowSegments: FlowSegment[] = [
  { id: 'seg-1', from: 'Internet', to: 'CloudFront', bandwidth: 8.4, unit: 'Gb/s' },
  { id: 'seg-2', from: 'CloudFront', to: 'ALB', bandwidth: 1.2, unit: 'Gb/s' },
  { id: 'seg-3', from: 'ALB', to: 'EC2 (público)', bandwidth: 0.9, unit: 'Gb/s' },
  { id: 'seg-4', from: 'EC2', to: 'RDS', bandwidth: 340, unit: 'Mb/s' }
]

export default function Network() {
  const {
    networkSimulationActive: cloudFrontDown,
    setNetworkSimulationActive: setCloudFrontDown
  } = useCloudStore()
  const [detailedView, setDetailedView] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [showTrafficLogs, setShowTrafficLogs] = useState(false)

  return (
    <div className="page">
      <PageHeader
        eyebrow="Topología VPC"
        title="Arquitectura de Red"
        description="Flujo del tráfico desde Internet hasta los recursos dentro de la VPC."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="segmented" role="tablist" aria-label="Vista del diagrama">
              <button
                type="button"
                role="tab"
                aria-selected={!detailedView}
                onClick={() => setDetailedView(false)}
                className={`segmented-item ${!detailedView ? 'segmented-item-active' : ''}`}
              >
                Vista simple
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={detailedView}
                onClick={() => setDetailedView(true)}
                className={`segmented-item ${detailedView ? 'segmented-item-active' : ''}`}
              >
                Vista detallada
              </button>
            </div>
            <Button variant="secondary" size="sm" icon={showLabels ? Eye : EyeOff} onClick={() => setShowLabels((previous) => !previous)}>
              {showLabels ? 'Ocultar etiquetas' : 'Mostrar etiquetas'}
            </Button>
            {cloudFrontDown ? (
              <Button variant="primary" size="sm" icon={RotateCcw} onClick={() => setCloudFrontDown(false)}>
                Restaurar CloudFront
              </Button>
            ) : (
              <Button variant="danger" size="sm" icon={AlertTriangle} onClick={() => setCloudFrontDown(true)}>
                Simular caída de CloudFront
              </Button>
            )}
          </div>
        }
      />

      {detailedView && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary dark:border-darkPrimary/40 dark:bg-darkPrimary/10 dark:text-darkPrimary">
          <Layers className="h-4 w-4 shrink-0" />
          Vista detallada: se muestran componentes adicionales como Internet Gateway, NAT Gateway y subredes explícitas.
        </div>
      )}

      {cloudFrontDown && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm text-danger dark:border-darkDanger/40 dark:bg-darkDanger/10 dark:text-darkDanger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          CloudFront no disponible: el tráfico se enruta directo a la VPC por la ruta de
          contingencia.
        </div>
      )}

      <Section title="Flujo de tráfico" icon={NetworkIcon}>
        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:gap-2">
          <FlowNode
            icon={Globe}
            name="Internet"
            description={showLabels ? 'Usuarios y tráfico externo que acceden a la aplicación.' : ''}
          />

          <FlowArrow />

          <FlowNode
            icon={Server}
            name="Route 53"
            description={showLabels ? 'DNS que resuelve el dominio y enruta las solicitudes.' : ''}
          />

          <FlowArrow variant={cloudFrontDown ? 'broken' : 'normal'} />

          <FlowNode
            icon={NetworkIcon}
            name="CloudFront"
            description={showLabels ? 'CDN que cachea contenido y reduce la latencia global.' : ''}
            tone={cloudFrontDown ? 'error' : 'default'}
          />

          <FlowArrow variant={cloudFrontDown ? 'fallback' : 'normal'} />

          {detailedView && (
            <>
              <FlowNode icon={Globe} name="Internet Gateway" description={showLabels ? 'Puerta de entrada pública hacia la VPC.' : ''} />
              <FlowArrow />
            </>
          )}

          <div className="flex flex-1 flex-col rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 dark:border-darkPrimary/40 dark:bg-darkPrimary/10">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary dark:text-darkPrimary" />
              <h3 className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">VPC</h3>
            </div>
            <p className={`mt-1 text-xs leading-relaxed text-textSecondary dark:text-darkTextSecondary ${!showLabels && 'hidden'}`}>
              Red virtual aislada con subredes públicas y privadas.
            </p>

            {detailedView && (
              <>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-primary/40 bg-white p-3 dark:border-darkPrimary/40 dark:bg-darkCard">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary dark:text-darkPrimary">
                      <NetworkIcon className="h-3.5 w-3.5" /> NAT Gateway
                    </p>
                    <p className={`mt-1 text-xs text-textSecondary dark:text-darkTextSecondary ${!showLabels && 'hidden'}`}>
                      Salida a Internet desde subredes privadas.
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/40 bg-white p-3 dark:border-darkPrimary/40 dark:bg-darkCard">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary dark:text-darkPrimary">
                      <Shield className="h-3.5 w-3.5" /> Security Groups
                    </p>
                    <p className={`mt-1 text-xs text-textSecondary dark:text-darkTextSecondary ${!showLabels && 'hidden'}`}>
                      Filtrado de tráfico entrante por recurso.
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                  CIDR: 10.0.0.0/16
                </p>
              </>
            )}

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-success/40 bg-white p-3 dark:border-darkSuccess/40 dark:bg-darkCard">
                <p className="text-xs font-semibold uppercase tracking-wide text-success dark:text-darkSuccess">
                  Subred pública
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <SubnetResource
                    icon={Server}
                    name="ALB"
                    description={showLabels ? 'Balanceador de carga' : ''}
                    tone="success"
                  />
                  <SubnetResource
                    icon={Server}
                    name="EC2"
                    description={showLabels ? 'Capacidad de cómputo' : ''}
                    tone="success"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-warning/40 bg-white p-3 dark:border-darkWarning/40 dark:bg-darkCard">
                <p className="text-xs font-semibold uppercase tracking-wide text-warning dark:text-darkWarning">
                  Subred privada
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <SubnetResource
                    icon={Database}
                    name="RDS"
                    description={showLabels ? 'Base de datos gestionada' : ''}
                    tone="warning"
                  />
                  <SubnetResource
                    icon={Database}
                    name="ElastiCache"
                    description={showLabels ? 'Capa de caché' : ''}
                    tone="warning"
                  />
                </div>
                {detailedView && (
                  <p className={`mt-2 text-[10px] text-textSecondary dark:text-darkTextSecondary ${!showLabels && 'hidden'}`}>
                    CIDR: 10.0.1.0/24
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap gap-4 text-xs text-textSecondary dark:text-darkTextSecondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-success dark:bg-darkSuccess" /> Subred pública
          (acceso a Internet)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning dark:bg-darkWarning" /> Subred privada
          (sin exposición directa)
        </span>
      </div>

      <Section
        title="Ancho de banda por tramo"
        icon={NetworkIcon}
        description="Consumo simulado de ancho de banda en cada segmento del flujo."
        badge={<Badge tone="warning">Simulación</Badge>}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {flowSegments.map((segment) => {
            const isGb = segment.unit === 'Gb/s'
            const pct = isGb ? (segment.bandwidth / 10) * 100 : (segment.bandwidth / 500) * 100
            return (
              <div key={segment.id} className="card-tile">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-textPrimary dark:text-darkTextPrimary">
                    <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
                      Tramo {segment.id.split('-')[1]}
                    </span>
                    {segment.from} <ArrowRight className="h-3.5 w-3.5 text-textSecondary dark:text-darkTextSecondary" /> {segment.to}
                  </div>
                  <span className="shrink-0 text-sm font-bold text-primary dark:text-darkPrimary">
                    {segment.bandwidth} {segment.unit}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background dark:bg-darkBackground">
                  <div className="h-full rounded-full bg-primary dark:bg-darkPrimary" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      <Section
        title="VPC Flow Logs"
        icon={Shield}
        description="Registros de tráfico simulados registrados por VPC Flow Logs."
        badge={<Badge tone="warning">Simulación</Badge>}
        actions={
          <Button variant="accent" size="sm" icon={Tags} onClick={() => setShowTrafficLogs((previous) => !previous)}>
            {showTrafficLogs ? 'Ocultar logs de tráfico' : 'Ver logs de tráfico'}
          </Button>
        }
      >
        {showTrafficLogs && (
          <div className="table-wrap">
            <table className="data-table min-w-[700px]">
              <thead>
                <tr className="border-b border-border dark:border-darkBorder">
                  <th className="py-3 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">Fecha / hora</th>
                  <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">IP origen</th>
                  <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">Destino</th>
                  <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">Puerto</th>
                  <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">Protocolo</th>
                  <th className="py-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-darkBorder">
                {trafficLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 pl-6 pr-4 font-mono text-textSecondary dark:text-darkTextSecondary">{log.timestamp}</td>
                    <td className="py-3 pr-4 font-mono text-textPrimary dark:text-darkTextPrimary">{log.sourceIp}</td>
                    <td className="py-3 pr-4 text-textSecondary dark:text-darkTextSecondary">{log.destination}</td>
                    <td className="py-3 pr-4 font-mono text-textSecondary dark:text-darkTextSecondary">{log.port}</td>
                    <td className="py-3 pr-4 text-textSecondary dark:text-darkTextSecondary">{log.protocol}</td>
                    <td className="py-3 pr-6 text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          log.action === 'permitida'
                            ? 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess'
                            : 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger'
                        }`}
                      >
                        {log.action === 'permitida' ? 'Permitida' : 'Denegada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Grupos de Seguridad"
        icon={Shield}
        description="Reglas de ingreso más relevantes por recurso."
      >
        <div className="table-wrap">
          <table className="data-table min-w-[640px]">
            <thead>
              <tr className="border-b border-border dark:border-darkBorder">
                <th className="py-3 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                  Puerto
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                  Protocolo
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                  Origen
                </th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                  Recurso
                </th>
                <th className="py-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                  Acceso
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-darkBorder">
              {securityGroupRules.map((rule) => (
                <tr key={`${rule.port}-${rule.resource}`}>
                  <td className="py-3 pl-6 pr-4 font-mono font-medium text-textPrimary dark:text-darkTextPrimary">
                    {rule.port}
                  </td>
                  <td className="py-3 pr-4 text-textSecondary dark:text-darkTextSecondary">
                    {rule.protocol}
                  </td>
                  <td className="py-3 pr-4 font-mono text-textSecondary dark:text-darkTextSecondary">
                    {rule.origin}
                  </td>
                  <td className="py-3 pr-4 font-medium text-textPrimary dark:text-darkTextPrimary">
                    {rule.resource}
                  </td>
                  <td className="py-3 pr-6 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        rule.access === 'open'
                          ? 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess'
                          : 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning'
                      }`}
                    >
                      {rule.access === 'open' ? 'Abierto' : 'Restringido'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}