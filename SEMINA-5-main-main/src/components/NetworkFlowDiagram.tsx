import {
  AlertTriangle,
  ArrowRight,
  Box,
  Database,
  Globe,
  Network as NetworkIcon,
  Server,
  Shield,
  XCircle,
  type LucideIcon
} from 'lucide-react'

export interface NetworkFlowDiagramProps {
  compact?: boolean
  cloudFrontDown?: boolean
  detailedView?: boolean
  showLabels?: boolean
}

interface FlowNodeProps {
  icon: LucideIcon
  name: string
  description: string
  tone?: 'default' | 'error'
  compact?: boolean
}

function FlowNode({ icon: Icon, name, description, tone = 'default', compact = false }: FlowNodeProps) {
  const isError = tone === 'error'

  return (
    <div
      className={`flex w-full min-w-0 flex-1 flex-col items-center text-center shadow-sm lg:w-auto ${
        compact
          ? 'rounded-xl border p-2.5 sm:p-3'
          : 'rounded-2xl border p-4'
      } ${
        isError
          ? 'border-danger/60 bg-danger/5 dark:border-darkDanger/60 dark:bg-darkDanger/10'
          : 'border-border bg-white dark:border-darkBorder dark:bg-darkCard'
      }`}
    >
      <div
        className={`relative flex items-center justify-center rounded-xl ${
          compact ? 'h-9 w-9' : 'h-11 w-11'
        } ${
          isError
            ? 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger'
            : 'bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary'
        }`}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
        {isError && (
          <span className="animate-node-alert absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white shadow-sm dark:bg-darkDanger">
            <AlertTriangle className="h-3 w-3" />
          </span>
        )}
      </div>
      <h3
        className={`mt-2 font-semibold ${
          compact ? 'text-xs' : 'mt-3 text-sm'
        } ${
          isError
            ? 'text-danger dark:text-darkDanger'
            : 'text-textPrimary dark:text-darkTextPrimary'
        }`}
      >
        {name}
      </h3>
      {description && (
        <p
          className={`mt-1 leading-relaxed text-textSecondary dark:text-darkTextSecondary ${
            compact ? 'text-[10px]' : 'text-xs'
          }`}
        >
          {description}
        </p>
      )}
      {isError && (
        <span className="mt-2 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger dark:bg-darkDanger/10 dark:text-darkDanger">
          Nodo caído
        </span>
      )}
    </div>
  )
}

type FlowArrowVariant = 'normal' | 'broken' | 'fallback'

function FlowArrow({ variant = 'normal', compact = false }: { variant?: FlowArrowVariant; compact?: boolean }) {
  const isError = variant !== 'normal'

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        compact ? 'gap-0.5 py-0.5 lg:flex-row lg:gap-1 lg:px-0.5 lg:py-0' : 'gap-1 py-1 lg:flex-row lg:gap-2 lg:px-1 lg:py-0'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flow-dash w-0.5 rotate-90 ${
            compact ? 'h-3 lg:h-0.5 lg:w-6' : 'h-4 lg:h-0.5 lg:w-10'
          } ${
            isError
              ? 'text-danger dark:text-darkDanger'
              : 'text-textSecondary dark:text-darkTextSecondary'
          }`}
          aria-hidden="true"
        />
        {variant === 'broken' ? (
          <XCircle
            className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-danger dark:text-darkDanger`}
            aria-hidden="true"
          />
        ) : (
          <ArrowRight
            className={`rotate-90 lg:rotate-0 ${
              compact ? 'h-4 w-4' : 'h-5 w-5'
            } ${
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
  tone,
  compact = false
}: {
  icon: LucideIcon
  name: string
  description: string
  tone: 'success' | 'warning'
  compact?: boolean
}) {
  const toneClasses =
    tone === 'success'
      ? 'border-success/40 bg-success/5 text-success dark:border-darkSuccess/40 dark:bg-darkSuccess/10 dark:text-darkSuccess'
      : 'border-warning/40 bg-warning/5 text-warning dark:border-darkWarning/40 dark:bg-darkWarning/10 dark:text-darkWarning'

  return (
    <div className={`flex items-center gap-2 rounded-lg border ${compact ? 'p-1.5' : 'p-2'} ${toneClasses}`}>
      <Icon className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} />
      <div className="min-w-0">
        <p className={`font-semibold text-textPrimary dark:text-darkTextPrimary ${compact ? 'text-[11px]' : 'text-sm'}`}>
          {name}
        </p>
        {description && (
          <p className={`truncate text-textSecondary dark:text-darkTextSecondary ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export default function NetworkFlowDiagram({
  compact = false,
  cloudFrontDown = false,
  detailedView = false,
  showLabels = true
}: NetworkFlowDiagramProps) {
  const isDetailed = !compact && detailedView
  const isCloudFrontDown = !compact && cloudFrontDown
  const description = (full: string, short: string) => (showLabels ? (compact ? short : full) : '')

  return (
    <div
      className={`rounded-2xl border border-border bg-white shadow-sm dark:border-darkBorder dark:bg-darkCard ${
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6'
      }`}
    >
      <div
        className={`flex flex-col items-stretch ${
          compact ? 'gap-1.5 sm:gap-2 lg:flex-row lg:items-center lg:gap-1' : 'gap-3 lg:flex-row lg:items-center lg:gap-2'
        }`}
      >
        <FlowNode
          icon={Globe}
          name="Internet"
          description={description('Usuarios y tráfico externo que acceden a la aplicación.', 'Usuarios')}
          compact={compact}
        />

        <FlowArrow compact={compact} />

        <FlowNode
          icon={Server}
          name="Route 53"
          description={description('DNS que resuelve el dominio y enruta las solicitudes.', 'DNS global')}
          compact={compact}
        />

        <FlowArrow variant={isCloudFrontDown ? 'broken' : 'normal'} compact={compact} />

        <FlowNode
          icon={NetworkIcon}
          name="CloudFront"
          description={description('CDN que cachea contenido y reduce la latencia global.', 'CDN global')}
          tone={isCloudFrontDown ? 'error' : 'default'}
          compact={compact}
        />

        <FlowArrow variant={isCloudFrontDown ? 'fallback' : 'normal'} compact={compact} />

        {isDetailed && (
          <>
            <FlowNode
              icon={Globe}
              name="Internet Gateway"
              description={showLabels ? 'Puerta de entrada pública hacia la VPC.' : ''}
              compact={compact}
            />
            <FlowArrow compact={compact} />
          </>
        )}

        <div
          className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 dark:border-darkPrimary/40 dark:bg-darkPrimary/10 ${
            compact ? 'p-2.5' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-2">
            <Box className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
            <h3 className={`font-semibold text-textPrimary dark:text-darkTextPrimary ${compact ? 'text-xs' : 'text-sm'}`}>
              VPC
            </h3>
          </div>
          {showLabels && (
            <p className={`mt-1 leading-relaxed text-textSecondary dark:text-darkTextSecondary ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {compact ? 'Red privada aislada' : 'Red virtual aislada con subredes públicas y privadas.'}
            </p>
          )}

          {isDetailed && (
            <>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-primary/40 bg-white p-3 dark:border-darkPrimary/40 dark:bg-darkCard">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary dark:text-darkPrimary">
                    <NetworkIcon className="h-3.5 w-3.5" /> NAT Gateway
                  </p>
                  {showLabels && (
                    <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
                      Salida a Internet desde subredes privadas.
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-primary/40 bg-white p-3 dark:border-darkPrimary/40 dark:bg-darkCard">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary dark:text-darkPrimary">
                    <Shield className="h-3.5 w-3.5" /> Security Groups
                  </p>
                  {showLabels && (
                    <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
                      Filtrado de tráfico entrante por recurso.
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                CIDR: 10.0.0.0/16
              </p>
            </>
          )}

          <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-success/40 bg-white p-3 dark:border-darkSuccess/40 dark:bg-darkCard">
              <p className={`font-semibold uppercase tracking-wide text-success dark:text-darkSuccess ${compact ? 'text-[10px]' : 'text-xs'}`}>
                Subred pública
              </p>
              <div className="mt-2 flex min-w-0 flex-col gap-2">
                <SubnetResource
                  icon={Server}
                  name="ALB"
                  description={description('Balanceador de carga', 'Balanceador')}
                  tone="success"
                  compact={compact}
                />
                <SubnetResource
                  icon={Server}
                  name="EC2"
                  description={description('Capacidad de cómputo', 'Cómputo')}
                  tone="success"
                  compact={compact}
                />
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-warning/40 bg-white p-3 dark:border-darkWarning/40 dark:bg-darkCard">
              <p className={`font-semibold uppercase tracking-wide text-warning dark:text-darkWarning ${compact ? 'text-[10px]' : 'text-xs'}`}>
                Subred privada
              </p>
              <div className="mt-2 flex min-w-0 flex-col gap-2">
                <SubnetResource
                  icon={Database}
                  name="RDS"
                  description={description('Base de datos gestionada', 'Datos')}
                  tone="warning"
                  compact={compact}
                />
                <SubnetResource
                  icon={Database}
                  name="ElastiCache"
                  description={description('Capa de caché', 'Caché')}
                  tone="warning"
                  compact={compact}
                />
              </div>
              {isDetailed && showLabels && (
                <p className="mt-2 text-[10px] text-textSecondary dark:text-darkTextSecondary">
                  CIDR: 10.0.1.0/24
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
