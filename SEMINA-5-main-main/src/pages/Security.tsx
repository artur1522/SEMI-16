import { Fragment, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Eye,
  Fingerprint,
  Globe,
  History,
  Key,
  ListChecks,
  Lock,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
  UserCog,
  Wrench,
  XCircle,
  type LucideIcon
} from 'lucide-react'
import SecurityScore from '../components/SecurityScore'
import { Badge, Button, ChipTabs, PageHeader, Section } from '../components/ui'
import { usePreferences } from '../hooks/usePreferences'
import { useCloudStore } from '../store/cloudStore'

interface CustomerControl {
  id: string
  title: string
  description: string
  status: 'warning' | 'active' | 'inactive'
  actionLabel: string
  actionIcon: LucideIcon
}

const awsManaged: { title: string; description: string }[] = [
  {
    title: 'Infraestructura física',
    description: 'Data centers, energía, refrigeración y control de acceso físico.'
  },
  {
    title: 'Red global',
    description: 'Backbone, edge locations y mitigación de ataques DDoS.'
  },
  {
    title: 'Hardware',
    description: 'Servidores, almacenamiento y redes con mantenimiento continuo.'
  }
]

const customerManaged: CustomerControl[] = [
  {
    id: 'iam',
    title: 'Configuración de IAM',
    description: 'Usuarios, roles y permisos dentro de la cuenta.',
    status: 'warning',
    actionLabel: 'Revisar políticas',
    actionIcon: Search
  },
  {
    id: 'cifrado',
    title: 'Cifrado de datos',
    description: 'Cifrado en reposo y en tránsito activo.',
    status: 'active',
    actionLabel: 'Auditar cifrado',
    actionIcon: ShieldCheck
  },
  {
    id: 'accesos',
    title: 'Gestión de accesos',
    description: 'Principio de menor privilegio y rotación de credenciales.',
    status: 'warning',
    actionLabel: 'Configurar MFA',
    actionIcon: Fingerprint
  },
  {
    id: 'parches',
    title: 'Actualizaciones del sistema',
    description: '3 instancias EC2 con parches de seguridad pendientes.',
    status: 'inactive',
    actionLabel: 'Aplicar parche',
    actionIcon: Wrench
  }
]

interface ComplianceRow {
  id: string
  control: string
  category: string
  severity: 'Alta' | 'Media' | 'Baja'
  statusLabel: string
  statusTone: 'success' | 'warning' | 'danger'
  action: string
}

const complianceRows: ComplianceRow[] = [
  { id: 'c1', control: 'MFA obligatorio en cuentas root', category: 'IAM', severity: 'Alta', statusLabel: 'Cumplido', statusTone: 'success', action: 'Ver detalles' },
  { id: 'c2', control: 'Parches de seguridad en EC2', category: 'Cómputo', severity: 'Alta', statusLabel: '3 críticos', statusTone: 'danger', action: 'Resolver' },
  { id: 'c3', control: 'Rotación de Access Keys > 90 días', category: 'IAM', severity: 'Media', statusLabel: 'Advertencia', statusTone: 'warning', action: 'Auditar' },
  { id: 'c4', control: 'Cifrado en reposo (EBS/S3/RDS)', category: 'Cifrado', severity: 'Media', statusLabel: 'Cumplido', statusTone: 'success', action: 'Ver detalles' },
  { id: 'c5', control: 'Políticas con privilegios excesivos', category: 'IAM', severity: 'Alta', statusLabel: 'Advertencia', statusTone: 'warning', action: 'Auditar' },
  { id: 'c6', control: 'Grupos de seguridad sin acceso público', category: 'Red', severity: 'Alta', statusLabel: 'Cumplido', statusTone: 'success', action: 'Ver detalles' },
  { id: 'c7', control: 'Retención de logs CloudTrail (90 días)', category: 'Registro', severity: 'Baja', statusLabel: 'Cumplido', statusTone: 'success', action: 'Ver detalles' },
  { id: 'c8', control: 'Rotación de certificados TLS', category: 'Cifrado', severity: 'Baja', statusLabel: 'Advertencia', statusTone: 'warning', action: 'Auditar' }
]

interface HardeningItem {
  id: string
  title: string
  description: string
  category: string
}

const hardeningItems: HardeningItem[] = [
  { id: 'mfa', title: 'MFA activado', description: 'Autenticación multifactor en todos los usuarios con acceso a la consola.', category: 'IAM' },
  { id: 'keys', title: 'Rotación de llaves', description: 'Access keys renovadas en los últimos 90 días.', category: 'IAM' },
  { id: 'cifrado', title: 'Cifrado en reposo', description: 'EBS, S3 y RDS con cifrado activo.', category: 'Cifrado' },
  { id: 'tls', title: 'TLS 1.2+ en tránsito', description: 'CloudFront y ALB requieren TLS 1.2 o superior.', category: 'Red' },
  { id: 'parches', title: 'Parches de seguridad', description: 'Instancias EC2 actualizadas a la última revisión.', category: 'Cómputo' },
  { id: 'logs', title: 'CloudTrail activo', description: 'Auditoría de API habilitada con retención de 90 días.', category: 'Registro' },
  { id: 'sg', title: 'Grupos de seguridad mínimos', description: 'Sin acceso público 0.0.0.0/0 en servicios productivos.', category: 'Red' },
  { id: 'backup', title: 'Backups habilitados', description: 'Copias automáticas con retención definida en RDS y EC2.', category: 'Disponibilidad' }
]

interface SecurityEvent {
  id: string
  timestamp: string
  title: string
  detail: string
  severity: 'critical' | 'warning' | 'info'
  actor: string
}

const initialSecurityEvents: SecurityEvent[] = [
  { id: 'se-1', timestamp: 'hoy, 08:42', title: 'Intento de acceso no autorizado', detail: '3 intentos fallidos de inicio de sesión desde una IP pública hacia la consola.', severity: 'critical', actor: 'CloudTrail' },
  { id: 'se-2', timestamp: 'ayer, 18:05', title: 'Access key de DevOps sin rotar', detail: 'La llave de Ana Martínez supera los 90 días. Se requiere rotación.', severity: 'warning', actor: 'IAM' },
  { id: 'se-3', timestamp: 'ayer, 11:20', title: 'Parche instalado en EC2', detail: 'Actualización de seguridad aplicada a 2 instancias en producción.', severity: 'info', actor: 'Systems Manager' },
  { id: 'se-4', timestamp: 'hace 2 días', title: 'Cambio de política en grupo Administradores', detail: 'Política IAM actualizada, se añadió restricción s3:PutBucketAcl.', severity: 'info', actor: 'IAM' },
  { id: 'se-5', timestamp: 'hace 3 días', title: 'Intentos de fuerza bruta mitigados', detail: 'AWS Shield bloqueó un patrón de tráfico anómalo hacia el ALB.', severity: 'warning', actor: 'Shield' },
  { id: 'se-6', timestamp: 'hace 5 días', title: 'Certificado TLS renovado', detail: 'Rotación automática de ACM completada sin interrupción.', severity: 'info', actor: 'ACM' }
]

interface RotationCredential {
  id: string
  name: string
  detail: string
  lastRotated: Date
  maxAgeDays: number
  rotationPeriodLabel: string
}

const initialRotationCredentials: RotationCredential[] = [
  { id: 'rc-1', name: 'Access Key · DevOps', detail: 'AKIA4JNQW2K3LMX8P7VZ', lastRotated: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000), maxAgeDays: 90, rotationPeriodLabel: '90 días' },
  { id: 'rc-2', name: 'Access Key · Billing', detail: 'AKIAOI8FWT5XP9KZ3QN', lastRotated: new Date(Date.now() - 62 * 24 * 60 * 60 * 1000), maxAgeDays: 90, rotationPeriodLabel: '90 días' },
  { id: 'rc-3', name: 'Certificado TLS · acme-prod', detail: 'arn:aws:acm:us-east-1 · validez 365 días', lastRotated: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000), maxAgeDays: 365, rotationPeriodLabel: '1 año' },
  { id: 'rc-4', name: 'Contraseña RDS · app', detail: 'instancia posgresql-prod-1', lastRotated: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), maxAgeDays: 180, rotationPeriodLabel: '6 meses' }
]

interface PasswordPolicy {
  id: string
  label: string
  value: string
  requirement: string
  compliant: boolean
  note: string
}

const initialPasswordPolicies: PasswordPolicy[] = [
  { id: 'pp-1', label: 'MFP: longitud mínima', value: '14 caracteres', requirement: '≥ 12 caracteres', compliant: true, note: 'Cumple el requisito mínimo de longitud.' },
  { id: 'pp-2', label: 'Complejidad', value: 'Mayúsculas + números + símbolos', requirement: '3 de 4 clases', compliant: true, note: 'Cumple la política de complejidad.' },
  { id: 'pp-3', label: 'Expiración de contraseña', value: '60 días', requirement: '≤ 90 días', compliant: true, note: 'Rotación forzada cada 60 días.' },
  { id: 'pp-4', label: 'Reutilización', value: 'No reutiliza las últimas 5', requirement: 'No reutilizar 5 anteriores', compliant: true, note: 'La política impide reutilizar contraseñas recientes.' },
  { id: 'pp-5', label: 'Bloqueo por intentos', value: '6 intentos en 15 minutos', requirement: '≤ 10 intentos', compliant: true, note: 'Cuenta se bloquea tras intentos consecutivos fallidos.' },
  { id: 'pp-6', label: 'Password Manager', value: 'No se exige', requirement: 'Recomendado', compliant: false, note: 'Se recomienda habilitar un vault para el equipo.' }
]

const severityDotStyles: Record<SecurityEvent['severity'], string> = {
  critical: 'bg-danger dark:bg-darkDanger',
  warning: 'bg-warning dark:bg-darkWarning',
  info: 'bg-primary dark:bg-darkPrimary'
}

const severityTagStyles: Record<SecurityEvent['severity'], string> = {
  critical: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger',
  warning: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
  info: 'bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary'
}

const severityLabels: Record<SecurityEvent['severity'], string> = {
  critical: 'Crítico',
  warning: 'Advertencia',
  info: 'Informativo'
}

function daysUntil(target: Date): number {
  const now = Date.now()
  const diff = target.getTime() - now
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

type ResourceId = 's3' | 'rds' | 'ec2'

interface AuditResource {
  id: ResourceId
  label: string
  permission: string
}

const auditResources: AuditResource[] = [
  { id: 's3', label: 'S3 Bucket', permission: 's3:PutObject' },
  { id: 'rds', label: 'RDS Database', permission: 'rds:ModifyDBInstance' },
  { id: 'ec2', label: 'EC2 Instance', permission: 'ec2:StartInstances' }
]

interface IamUser {
  id: string
  name: string
  initials: string
  role: string
  permissions: string[]
  deny?: string[]
}

const iamUsers: IamUser[] = [
  { id: 'u-1', name: 'Ana Martínez', initials: 'AM', role: 'DevOps Engineer', permissions: ['ec2:*', 's3:*', 'rds:*', 'lambda:*'] },
  { id: 'u-2', name: 'Carlos Ruiz', initials: 'CR', role: 'Backend Developer', permissions: ['ec2:StartInstances', 'ec2:Describe*', 's3:GetObject'] },
  { id: 'u-3', name: 'Laura Gómez', initials: 'LG', role: 'Data Analyst', permissions: ['s3:GetObject', 's3:ListBucket', 'rds:Describe*'] },
  { id: 'u-4', name: 'Pedro Sánchez', initials: 'PS', role: 'Database Admin', permissions: ['rds:*', 'ec2:Describe*'], deny: ['rds:ModifyDBInstance'] },
  { id: 'u-5', name: 'Sofía López', initials: 'SL', role: 'Frontend Developer', permissions: ['s3:GetObject'] }
]

const avatarColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
]

function matchesPermission(userPerm: string, target: string): boolean {
  const [userService, userAction] = userPerm.split(':')
  const [targetService, targetAction] = target.split(':')
  if (userService === '*') return true
  if (userService !== targetService) return false
  if (userAction === '*') return true
  if (userAction.endsWith('*') && targetAction.startsWith(userAction.slice(0, -1))) return true
  return false
}

function hasPermission(permissions: string[], target: string): boolean {
  return permissions.some((p) => matchesPermission(p, target))
}

interface AccessResult {
  allowed: boolean
  explicitDeny: boolean
}

function evaluateAccess(user: IamUser, permission: string): AccessResult {
  if (user.deny?.some((d) => matchesPermission(d, permission))) {
    return { allowed: false, explicitDeny: true }
  }
  return { allowed: hasPermission(user.permissions, permission), explicitDeny: false }
}

function buildSimulationJson(user: IamUser, resource: AuditResource, result: AccessResult): string {
  const evaluated = [
    ...user.permissions.map((p) => ({
      permiso: p,
      tipo: 'Allow' as const,
      coincide: matchesPermission(p, resource.permission)
    })),
    ...(user.deny ?? []).map((p) => ({
      permiso: p,
      tipo: 'Deny' as const,
      coincide: matchesPermission(p, resource.permission)
    }))
  ]

  const payload = {
    evaluador: 'IAM Policy Simulator',
    usuario: { id: user.id, nombre: user.name, rol: user.role },
    recurso: { servicio: resource.label, accionRequerida: resource.permission },
    resultado: {
      efecto: result.allowed ? 'Allow' : 'Deny',
      razon: result.explicitDeny
        ? 'Deny explícito tiene precedencia sobre cualquier Allow'
        : result.allowed
          ? 'Acceso permitido por política adjunta'
          : 'No se encontró política Allow que coincida'
    },
    politicasEvaluadas: evaluated
  }
  return JSON.stringify(payload, null, 2)
}

const resourceStyles: Record<'warning' | 'active' | 'inactive', string> = {
  warning: 'bg-warning/10 text-warning border-warning/30 dark:bg-darkWarning/10 dark:text-darkWarning dark:border-darkWarning/30',
  active: 'bg-success/10 text-success border-success/30 dark:bg-darkSuccess/10 dark:text-darkSuccess dark:border-darkSuccess/30',
  inactive: 'bg-danger/10 text-danger border-danger/30 dark:bg-darkDanger/10 dark:text-darkDanger dark:border-darkDanger/30'
}

const severityStyles: Record<string, string> = {
  Alta: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger',
  Media: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
  Baja: 'bg-slate-100 text-slate-600 dark:bg-darkBackground dark:text-darkTextSecondary'
}

const statusToneStyles: Record<string, string> = {
  success: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess',
  warning: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
  danger: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger'
}

export default function Security() {
  const { preferences } = usePreferences()
  const { securityControls, securityScore, setSecurityControl } = useCloudStore()
  const timeUnit = preferences.timeUnit
  const [resourceId, setResourceId] = useState<ResourceId>('s3')
  const [results, setResults] = useState<Record<string, AccessResult>>({})
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [securityHistory, setSecurityHistory] = useState<SecurityEvent[]>(initialSecurityEvents)

  const [credentials, setCredentials] = useState<RotationCredential[]>(initialRotationCredentials)
  const [policyChecks, setPolicyChecks] = useState<Record<string, boolean>>({
    pp1: true,
    pp2: true,
    pp3: true,
    pp4: true,
    pp5: true,
    pp6: false
  })

  const hardeningDoneCount = Object.values(securityControls).filter(Boolean).length
  const hardeningScore = securityScore

  function toggleHardening(id: string) {
    const item = hardeningItems.find((entry) => entry.id === id)
    const nextValue = !securityControls[id]
    setSecurityControl(id, nextValue)

    if (!item) return

    setSecurityHistory((previous) => [
      {
        id: `history-${Date.now()}`,
        timestamp: 'ahora',
        title: nextValue ? `${item.title} habilitado` : `${item.title} deshabilitado`,
        detail: nextValue
          ? 'El control de seguridad fue marcado como cumplido y el score recalculó.'
          : 'El control fue desmarcado y requiere revisión para mantener el nivel recomendado.',
        severity: (nextValue ? 'info' : 'warning') as SecurityEvent['severity'],
        actor: 'Hardening'
      },
      ...previous
    ].slice(0, 6))
  }

  function rotateCredential(id: string) {
    setCredentials((prev) =>
      prev.map((credential) =>
        credential.id === id ? { ...credential, lastRotated: new Date() } : credential
      )
    )
  }

  function handleRotateAll() {
    setCredentials((prev) => prev.map((credential) => ({ ...credential, lastRotated: new Date() })))
  }

  function togglePolicyCheck(id: string) {
    setPolicyChecks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const activeResource = auditResources.find((r) => r.id === resourceId) ?? auditResources[0]

  function handleResourceChange(id: ResourceId) {
    setResourceId(id)
    setResults({})
    setExpandedUserId(null)
  }

  function handleSimulate(userId: string) {
    const user = iamUsers.find((u) => u.id === userId)
    if (!user) return
    const result = evaluateAccess(user, activeResource.permission)
    setResults((prev) => ({ ...prev, [userId]: result }))
    setExpandedUserId((prev) => (prev === userId ? null : userId))
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Postura de seguridad"
        title="Security Hub"
        description="Panel central de controles, responsabilidad compartida y auditoría de accesos."
        badge={<Badge tone={securityScore >= 80 ? 'success' : securityScore >= 50 ? 'warning' : 'danger'} dot>
          Score {securityScore}%
        </Badge>}
      />

      <SecurityScore score={hardeningScore} threats={3} mfaCoverage={72} patches={3} />

      <Section
        title="Checklist de Hardening"
        icon={ListChecks}
        description="Marca los controles implementados: el Security Score se recalcula automáticamente."
        actions={
          <div className="flex items-center gap-3">
            <span className="text-sm text-textSecondary dark:text-darkTextSecondary">
              {hardeningDoneCount}/{hardeningItems.length} completados
            </span>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100 dark:bg-darkBackground">
              <div className="h-full rounded-full bg-primary transition-all dark:bg-darkPrimary" style={{ width: `${hardeningScore}%` }} />
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hardeningItems.map((item) => {
            const checked = Boolean(securityControls[item.id])
            return (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  checked
                    ? 'border-success/40 bg-success/5 dark:border-darkSuccess/40 dark:bg-darkSuccess/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-darkBorder dark:bg-darkCard dark:hover:bg-darkBorder/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleHardening(item.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accentFrom dark:accent-darkAccentFrom"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-textPrimary dark:text-darkTextPrimary">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-textSecondary dark:text-darkTextSecondary">
                    {item.description}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-primary dark:text-darkPrimary">
                    {item.category}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </Section>

      <Section
        title="Historial de Eventos de Seguridad"
        icon={History}
        description="Timeline específico de auditoría de seguridad, separado del feed del dashboard."
        badge={<Badge tone="warning">Auditoría</Badge>}
      >
        <ol className="relative ml-2 border-l-2 border-slate-200 pl-6 dark:border-darkBorder">
          {securityHistory.map((event) => (
            <li key={event.id} className="relative pb-6 last:pb-0">
              <span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-darkCard ${severityDotStyles[event.severity]}`} />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${severityTagStyles[event.severity]}`}>
                  {severityLabels[event.severity]}
                </span>
                <span className="text-xs font-semibold text-textPrimary dark:text-darkTextPrimary">{event.title}</span>
                <span className="text-xs text-textSecondary dark:text-darkTextSecondary">{event.timestamp}</span>
              </div>
              <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">{event.detail}</p>
              <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-textSecondary dark:bg-darkBackground dark:text-darkTextSecondary">
                {event.actor}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        title="Rotación de Credenciales"
        icon={RefreshCw}
        description="Días restantes antes de la expiración de cada credencial. Rota individualmente o en lote."
        badge={<Badge tone="warning">Simulado</Badge>}
        actions={
          <Button variant="accent" size="sm" icon={RefreshCw} onClick={handleRotateAll}>
            Rotar todas
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {credentials.map((credential) => {
            const nextRotation = new Date(credential.lastRotated.getTime() + credential.maxAgeDays * 24 * 60 * 60 * 1000)
            const remaining = daysUntil(nextRotation)
            const expired = remaining <= 0
            const warning = !expired && remaining <= 14
            const pct = Math.min(100, Math.max(0, Math.round(((credential.maxAgeDays - remaining) / credential.maxAgeDays) * 100)))
            return (
              <div key={credential.id} className="card-tile flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                    <Key className="h-3.5 w-3.5 text-primary dark:text-darkPrimary" />
                    {credential.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-textSecondary dark:text-darkTextSecondary">
                    {credential.detail}
                  </p>
                  <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
                    Rotación cada {credential.rotationPeriodLabel}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-darkCard">
                    <div
                      className={`h-full rounded-full ${expired ? 'bg-danger dark:bg-darkDanger' : warning ? 'bg-warning dark:bg-darkWarning' : 'bg-success dark:bg-darkSuccess'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${expired ? 'text-danger dark:text-darkDanger' : warning ? 'text-warning dark:text-darkWarning' : 'text-success dark:text-darkSuccess'}`}>
                    <Timer className="h-3.5 w-3.5" />
                    {expired ? 'Expira hoy' : timeUnit === 'hours' ? `${remaining * 24} horas restantes` : `${remaining} días restantes`}
                  </span>
                  <Button variant="accent" size="sm" icon={RefreshCw} onClick={() => rotateCredential(credential.id)}>
                    Rotar ahora
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      <Section
        title="Políticas de Contraseña"
        icon={Lock}
        description="Estado de cumplimiento de la política de contraseñas de la cuenta. Marca los checks verificados."
        badge={<Badge tone="warning">Simulado</Badge>}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {initialPasswordPolicies.map((policy, index) => {
            const checked = policyChecks[`pp${index}`]
            return (
              <label
                key={policy.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  policy.compliant || checked
                    ? 'border-success/40 bg-success/5 dark:border-darkSuccess/40 dark:bg-darkSuccess/10'
                    : 'border-warning/40 bg-warning/5 dark:border-darkWarning/40 dark:bg-darkWarning/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePolicyCheck(`pp${index}`)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accentFrom dark:accent-darkAccentFrom"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-textPrimary dark:text-darkTextPrimary">{policy.label}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${policy.compliant || checked ? 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess' : 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning'}`}>
                      {policy.compliant || checked ? <CheckCircle2 className="h-3 w-3" /> : null}
                      {policy.compliant || checked ? 'Cumple' : 'Pendiente'}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-textSecondary dark:text-darkTextSecondary">
                    Configurado: <span className="font-medium text-textPrimary dark:text-darkTextPrimary">{policy.value}</span> · Requisito: {policy.requirement}
                  </span>
                  <span className="mt-1 block text-xs text-textSecondary dark:text-darkTextSecondary">{policy.note}</span>
                </span>
              </label>
            )
          })}
        </div>
      </Section>

      <Section
        title="Responsabilidad Compartida"
        icon={Cloud}
        description="Modelo de responsabilidad de seguridad en la nube según el alcance de cada parte."
        bodyClassName="pt-0"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card-tile">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                <Cloud className="h-4 w-4 text-primary dark:text-darkPrimary" />
                AWS Managed
              </h3>
              <Badge tone="info">Gestionado por AWS</Badge>
            </div>
            <ul className="mt-4 space-y-3">
              {awsManaged.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3.5 dark:border-darkBorder dark:bg-darkBackground"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 dark:bg-darkSuccess/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success dark:text-darkSuccess" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-textPrimary dark:text-darkTextPrimary">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-textSecondary dark:text-darkTextSecondary">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-textSecondary dark:text-darkTextSecondary">
              <Globe className="h-3 w-3" />
              AWS opera y asegura la infraestructura subyacente y los controles físicos y de red.
            </p>
          </div>

          <div className="card-tile">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                <UserCog className="h-4 w-4 text-primary dark:text-darkPrimary" />
                Customer Managed
              </h3>
              <Badge tone="warning">Tu responsabilidad</Badge>
            </div>
            <ul className="mt-4 space-y-3">
              {customerManaged.map((item) => {
                const Icon = item.actionIcon
                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-100 p-3.5 dark:border-darkBorder"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-textPrimary dark:text-darkTextPrimary">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-textSecondary dark:text-darkTextSecondary">
                          {item.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${resourceStyles[item.status]}`}
                      >
                        {item.status === 'active' && 'Cumplido'}
                        {item.status === 'warning' && 'Revisión'}
                        {item.status === 'inactive' && 'Crítico'}
                      </span>
                    </div>
                    <Button variant="accent" size="sm" icon={Icon} className="mt-3">
                      {item.actionLabel}
                      <ArrowRight className="h-3 w-3 opacity-50" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        title="Cumplimiento de Buenas Prácticas"
        icon={ShieldCheck}
        description="Estado actual de las políticas de seguridad y controles de cumplimiento activos."
      >
        <div className="table-wrap">
          <table className="data-table w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-darkBorder dark:bg-darkBackground">
                  <th className="py-3 pl-6 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Control de seguridad
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Categoría
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Severidad
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Estado
                  </th>
                  <th className="py-3 pr-6 text-right text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkBorder">
                {complianceRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-darkBackground/50">
                    <td className="py-3.5 pl-6 pr-4">
                      <span className="font-medium text-textPrimary dark:text-darkTextPrimary">
                        {row.control}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="font-mono text-xs text-textSecondary dark:text-darkTextSecondary">
                        {row.category}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${severityStyles[row.severity]}`}
                      >
                        {row.severity}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusToneStyles[row.statusTone]}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${row.statusTone === 'success' ? 'bg-success dark:bg-darkSuccess' : row.statusTone === 'warning' ? 'bg-warning dark:bg-darkWarning' : 'bg-danger dark:bg-darkDanger'}`} />
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <button type="button" className="btn btn-accent btn-sm">
                        {row.statusTone === 'success' ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : row.statusTone === 'danger' ? (
                          <Wrench className="h-3.5 w-3.5" />
                        ) : (
                          <Search className="h-3.5 w-3.5" />
                        )}
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </Section>

      <Section
        title="Auditoría de roles IAM"
        icon={Key}
        description="Evalúa políticas de acceso simulando permisos sobre recursos concretos de AWS."
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            Recurso a probar
          </span>
          <ChipTabs
            ariaLabel="Recurso a probar"
            options={auditResources.map((resource) => ({
              value: resource.id,
              label: `${resource.permission} (${resource.label})`
            }))}
            value={resourceId}
            onChange={handleResourceChange}
          />
        </div>

        <div className="table-wrap mt-4">
          <table className="data-table w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-darkBorder dark:bg-darkBackground">
                  <th className="py-3 pl-6 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Usuario
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Permisos
                  </th>
                  <th className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Último test
                  </th>
                  <th className="py-3 pr-6 text-right text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    Simulación
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-darkBorder">
                {iamUsers.map((user, idx) => {
                  const result = results[user.id]
                  const isExpanded = expandedUserId === user.id
                  const json = result ? buildSimulationJson(user, activeResource, result) : null

                  return (
                    <Fragment key={user.id}>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-darkBackground/50">
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${avatarColors[idx % avatarColors.length]}`}
                            >
                              {user.initials}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-textPrimary dark:text-darkTextPrimary">
                                {user.name}
                              </p>
                              <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
                                {user.role}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.map((perm) => (
                              <code
                                key={perm}
                                className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 dark:bg-darkBackground dark:text-darkTextSecondary"
                              >
                                {perm}
                              </code>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          {result ? (
                            result.allowed ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success dark:bg-darkSuccess/10 dark:text-darkSuccess">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Permitido
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger dark:bg-darkDanger/10 dark:text-darkDanger">
                                <XCircle className="h-3.5 w-3.5" />
                                Denegado por Deny Explícito
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-textSecondary/50 dark:text-darkTextSecondary/50">
                              No evaluado
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-6 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <Button
                              variant="accent"
                              size="sm"
                              icon={isExpanded ? ChevronDown : Play}
                              onClick={() => handleSimulate(user.id)}
                            >
                              {isExpanded ? 'Cerrar' : 'Simular acceso'}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && json && (
                        <tr>
                          <td colSpan={4} className="p-0">
                            <div className="mx-4 my-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-darkBorder">
                              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2 dark:border-darkBorder dark:bg-darkBackground">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                                  <span className="ml-2 font-mono text-xs text-textSecondary dark:text-darkTextSecondary">
                                    iam-policy-simulator.json
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] text-textSecondary/60 dark:text-darkTextSecondary/60">
                                  Evaluado sobre {activeResource.permission} → {activeResource.label}
                                </span>
                              </div>
                              <pre className="max-h-72 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-400">
                                {json}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

        <p className="mt-3 text-xs text-textSecondary dark:text-darkTextSecondary">
          Simulación de acceso: <span className="font-mono">{activeResource.permission}</span> sobre{' '}
          <span className="font-mono">{activeResource.label}</span>. La evaluación respeta la jerarquía
          de permisos con comodines (<span className="font-mono">{'*'}</span>) y el precedente del
          Deny explícito sobre Allow.
        </p>
      </Section>
    </div>
  )
}
