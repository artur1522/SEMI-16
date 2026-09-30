import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode
} from 'react'
import {
  Check,
  ChevronDown,
  Columns,
  Copy,
  Flag,
  Lightbulb,
  Plus,
  Rocket,
  Timer,
  Trash2
} from 'lucide-react'
import type { CloudProposal, ProposalPriority, ProposalStatus } from '../types/cloud'
import { awsServices } from '../data/awsServices'
import { regionReferences } from '../data/regions'
import { suggestArchitectures, type ArchitectureSuggestion } from '../data/architecture'
import { useCloudStore } from '../store/cloudStore'
import {
  AVAILABILITY_META,
  PRIORITY_META,
  STATUS_META,
  type AvailabilityLevel
} from '../data/cloudOpsData'
import { Badge, Button, ChipTabs, Field, PageHeader, Section, SelectInput, TextArea, TextInput } from '../components/ui'

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const statusOptions: { value: ProposalStatus; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobada', label: 'Aprobada' }
]

const priorityOptions: { value: ProposalPriority; label: string }[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' }
]

const timelineOptions: { value: string; label: string }[] = [
  { value: 'basica', label: '4–6 semanas (~5 semanas)' },
  { value: 'alta', label: '6–8 semanas (~7 semanas)' },
  { value: 'critica', label: '10–14 semanas (~12 semanas)' }
]

interface Template {
  id: string
  name: string
  icon: ReactNode
  values: {
    solutionName: string
    appType: string
    description: string
    region: string
    estimatedUsers: string
    availabilityLevel: string
    selectedServices: string[]
    migrationGoal: string
    priority: ProposalPriority
  }
}

const TEMPLATES: Template[] = [
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: <Flag className="h-4 w-4" />,
    values: {
      solutionName: 'Tienda en línea',
      appType: 'Web / API',
      description: 'Catálogo de productos, carrito de compras y pasarela de pagos con CDN.',
      region: 'sa-east-1',
      estimatedUsers: '50000',
      availabilityLevel: 'alta',
      selectedServices: ['ec2', 'rds', 's3', 'cloudfront', 'route53'],
      migrationGoal: 'Atender picos de tráfico regionales manteniendo baja latencia.',
      priority: 'alta'
    }
  },
  {
    id: 'saas',
    name: 'SaaS B2B',
    icon: <Rocket className="h-4 w-4" />,
    values: {
      solutionName: 'Plataforma SaaS',
      appType: 'Web',
      description: 'Aplicación multiusuario con autenticación, integraciones y facturación.',
      region: 'us-east-1',
      estimatedUsers: '20000',
      availabilityLevel: 'alta',
      selectedServices: ['ec2', 'rds', 'vpc', 'iam'],
      migrationGoal: 'Escalar el servicio por suscripción con disponibilidad alta.',
      priority: 'media'
    }
  },
  {
    id: 'mobile',
    name: 'App móvil',
    icon: <Rocket className="h-4 w-4" />,
    values: {
      solutionName: 'App móvil',
      appType: 'Móvil',
      description: 'Backend para aplicación móvil con distribución de contenido y APIs.',
      region: 'sa-east-1',
      estimatedUsers: '100000',
      availabilityLevel: 'basica',
      selectedServices: ['s3', 'cloudfront', 'route53', 'iam'],
      migrationGoal: 'Publicar contenido estático y APIs con baja latencia.',
      priority: 'media'
    }
  }
]

type StatusFilter = 'todas' | ProposalStatus

interface FormState {
  solutionName: string
  appType: string
  description: string
  region: string
  estimatedUsers: string
  availabilityLevel: string
  selectedServices: string[]
  migrationGoal: string
  status: ProposalStatus
  priority: ProposalPriority
}

const emptyForm: FormState = {
  solutionName: '',
  appType: '',
  description: '',
  region: '',
  estimatedUsers: '',
  availabilityLevel: '',
  selectedServices: [],
  migrationGoal: '',
  status: 'borrador',
  priority: 'media'
}

type FormErrors = Partial<Record<keyof FormState, string>>

function regionName(id: string) {
  return regionReferences.find((region) => region.id === id)?.name ?? id
}

function serviceName(id: string) {
  return awsServices.find((service) => service.id === id)?.name ?? id.toUpperCase()
}

function availabilitySla(value: string) {
  return AVAILABILITY_META[value as AvailabilityLevel]?.sla ?? '—'
}

function estimationRange(availabilityLevel: string) {
  return timelineOptions.find((option) => option.value === availabilityLevel)?.label ?? '—'
}

function estimationWeeks(availabilityLevel: string) {
  const match = estimationRange(availabilityLevel)
  const parsed = match.match(/(\d+)-(\d+)/)
  if (!parsed) return '—'
  const [min, max] = parsed.slice(1).map(Number)
  return min === max ? `${max} semanas` : `${min}–${max} semanas`
}

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'fecha no disponible'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function StatusPill({ status }: { status: ProposalStatus }) {
  const meta = STATUS_META[status]
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  )
}

function PriorityPill({ priority }: { priority: ProposalPriority }) {
  const meta = PRIORITY_META[priority]
  return (
    <Badge tone={meta.tone}>
      <Flag className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </Badge>
  )
}

export default function Planning() {
  const { proposals, addProposal, removeProposal, projects, portfolio } = useCloudStore()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)

  const suggestions = useMemo(
    () => suggestArchitectures(form.appType, Number(form.estimatedUsers), form.availabilityLevel),
    [form]
  )
  const suggestionsFallback = useMemo(
    () =>
      suggestArchitectures(
        form.appType || 'sitio web',
        form.estimatedUsers ? Number(form.estimatedUsers) : 1000,
        form.availabilityLevel || 'alta'
      ),
    [form]
  )
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement | null>(null)

  const openSuggestions = () => {
    setSuggestionsOpen(true)
    setTimeout(
      () => suggestionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      50
    )
  }

  const applySuggestion = (sugg: ArchitectureSuggestion) => {
    setForm((prev) => ({
      ...prev,
      selectedServices: sugg.serviceIds.length > 0 ? sugg.serviceIds : prev.selectedServices
    }))
  }

  const filteredProposals = useMemo(
    () =>
      proposals
        .filter((p) => statusFilter === 'todas' || p.status === statusFilter)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [proposals, statusFilter]
  )

  const filterCounts = useMemo(
    () => ({
      todas: proposals.length,
      borrador: proposals.filter((p) => p.status === 'borrador').length,
      en_revision: proposals.filter((p) => p.status === 'en_revision').length,
      aprobada: proposals.filter((p) => p.status === 'aprobada').length
    }),
    [proposals]
  )

  const selectedProposals = useMemo(
    () => proposals.filter((proposal) => selectedIds.includes(proposal.id)),
    [proposals, selectedIds]
  )

  const detailProposal = proposals.find((p) => p.id === detailId) ?? null
  const detailSuggestion = detailProposal
    ? suggestArchitectures(
        detailProposal.appType,
        detailProposal.estimatedUsers,
        detailProposal.availabilityLevel
      )[0] ?? null
    : null

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'status' ? (value as ProposalStatus) : value
    }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleServiceToggle(id: string) {
    setForm((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(id)
        ? prev.selectedServices.filter((s) => s !== id)
        : [...prev.selectedServices, id]
    }))
  }

  function validate(cur: FormState) {
    const next: FormErrors = {}
    if (!cur.solutionName.trim()) next.solutionName = 'Ingresa el nombre.'
    if (!cur.appType.trim()) next.appType = 'Ingresa el tipo.'
    if (!cur.description.trim()) next.description = 'Describe la solución.'
    if (!cur.region) next.region = 'Selecciona región.'
    if (!cur.estimatedUsers || Number(cur.estimatedUsers) <= 0)
      next.estimatedUsers = 'Ingresa usuarios.'
    if (cur.selectedServices.length === 0)
      next.selectedServices = 'Selecciona al menos un servicio.'
    if (!cur.migrationGoal.trim()) next.migrationGoal = 'Describe objetivo.'
    return next
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validate(form)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    const proposal: CloudProposal = {
      id: `prop-${Date.now()}`,
      solutionName: form.solutionName.trim(),
      appType: form.appType.trim(),
      description: form.description.trim(),
      region: form.region,
      estimatedUsers: Number(form.estimatedUsers),
      availabilityLevel: form.availabilityLevel,
      selectedServices: form.selectedServices,
      migrationGoal: form.migrationGoal.trim(),
      status: form.status,
      priority: form.priority,
      createdAt: new Date().toISOString()
    }
    addProposal(proposal)
    setForm(emptyForm)
    setErrors({})
  }

  function applyTemplate(template: Template) {
    setForm({ ...emptyForm, ...template.values })
    setErrors({})
  }

  function duplicateProposal(proposal: CloudProposal) {
    setForm((current) => ({
      ...current,
      solutionName: `${proposal.solutionName} (copia)`,
      appType: proposal.appType,
      description: proposal.description,
      region: proposal.region,
      estimatedUsers: String(proposal.estimatedUsers),
      availabilityLevel: proposal.availabilityLevel,
      selectedServices: [...proposal.selectedServices],
      migrationGoal: proposal.migrationGoal,
      priority: proposal.priority
    }))
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleRemove(id: string) {
    removeProposal(id)
    setSelectedIds((prev) => prev.filter((s) => s !== id))
    setDetailId((prev) => (prev === id ? null : prev))
  }

  function handleToggleCompareMode() {
    setCompareMode((p) => !p)
    setSelectedIds([])
  }

  function handleToggleCompare(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length >= 2 ? prev : [...prev, id]
    )
  }

  function exportProposal(proposal: CloudProposal) {
    const blob = new Blob([JSON.stringify(proposal, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `propuesta-${proposal.solutionName.replace(/[^a-z0-9]+/gi, '-')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const comparisonRows: { label: string; value: (p: CloudProposal) => ReactNode }[] = [
    {
      label: 'Estado',
      value: (p) => <StatusPill status={p.status} />
    },
    {
      label: 'Prioridad',
      value: (p) => <PriorityPill priority={p.priority} />
    },
    { label: 'Tipo', value: (p) => p.appType },
    { label: 'Región', value: (p) => regionName(p.region) },
    { label: 'Usuarios', value: (p) => p.estimatedUsers.toLocaleString('es-PE') },
    { label: 'Implementación', value: (p) => estimationWeeks(p.availabilityLevel) },
    { label: 'Disponibilidad', value: (p) => availabilitySla(p.availabilityLevel) },
    { label: 'Creada', value: (p) => formatDate(p.createdAt) },
    {
      label: 'Servicios',
      value: (p) => (
        <div className="flex flex-wrap gap-1.5">
          {p.selectedServices.map((s) => (
            <span key={s} className="badge badge-solid">
              {serviceName(s)}
            </span>
          ))}
        </div>
      )
    },
    { label: 'Descripción', value: (p) => p.description }
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow="Gobierno de portafolio"
        title="Planificación Cloud"
        description="Define propuestas de arquitectura cloud y regístralas para su evaluación."
        badge={<Badge tone="neutral">{portfolio.projects} proyectos maestros</Badge>}
        actions={
          <Button
            variant={compareMode ? 'accent' : 'secondary'}
            icon={Columns}
            aria-pressed={compareMode}
            onClick={handleToggleCompareMode}
          >
            Comparar
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <aside className="space-y-6 lg:col-span-4">
          <Section title="Plantillas rápidas" icon={Rocket}>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="flex flex-col items-center gap-1 rounded-control border border-border bg-background px-2 py-2 text-center text-2xs font-medium text-textPrimary transition-all hover:border-accentFrom/40 hover:text-accentFrom dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40"
                >
                  <span className="icon-tile h-8 w-8 bg-gradient-to-br from-accentFrom to-accentTo text-white">
                    {template.icon}
                  </span>
                  {template.name}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Nueva propuesta" icon={Plus}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nombre" error={errors.solutionName}>
                  <TextInput
                    name="solutionName"
                    value={form.solutionName}
                    onChange={handleChange}
                    invalid={Boolean(errors.solutionName)}
                    placeholder="Ej. Plataforma de e-commerce"
                  />
                </Field>
                <Field label="Tipo" error={errors.appType}>
                  <TextInput
                    name="appType"
                    value={form.appType}
                    onChange={handleChange}
                    invalid={Boolean(errors.appType)}
                    placeholder="Ej. Web / API / Móvil"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Región" error={errors.region}>
                  <SelectInput
                    name="region"
                    value={form.region}
                    onChange={handleChange}
                    invalid={Boolean(errors.region)}
                  >
                    <option value="">Selecciona una región</option>
                    {regionReferences.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Usuarios" error={errors.estimatedUsers}>
                  <TextInput
                    name="estimatedUsers"
                    type="number"
                    min={1}
                    value={form.estimatedUsers}
                    onChange={handleChange}
                    invalid={Boolean(errors.estimatedUsers)}
                    placeholder="Ej. 5000"
                  />
                </Field>
              </div>

              <Field label="Descripción" error={errors.description}>
                <TextArea
                  name="description"
                  rows={2}
                  value={form.description}
                  onChange={handleChange}
                  invalid={Boolean(errors.description)}
                  placeholder="Describe la solución y su propósito."
                />
              </Field>

              <Field label="Objetivo" error={errors.migrationGoal}>
                <TextArea
                  name="migrationGoal"
                  rows={2}
                  value={form.migrationGoal}
                  onChange={handleChange}
                  invalid={Boolean(errors.migrationGoal)}
                  placeholder="Ej. Reducir costos y mejorar la disponibilidad global."
                />
              </Field>

              <div>
                <span className="field-label">Servicios Cloud</span>
                <div className="grid grid-cols-2 gap-2">
                  {awsServices.map((s) => {
                    const selected = form.selectedServices.includes(s.id)
                    return (
                      <div
                        key={s.id}
                        className={`rounded-control border px-2 py-1.5 transition-colors ${
                          selected
                            ? 'border-accentFrom/40 bg-accentFrom/5 dark:border-darkAccentFrom/40 dark:bg-darkAccentFrom/10'
                            : 'border-border bg-surface dark:border-darkBorder dark:bg-darkBackground'
                        }`}
                      >
                        <label className="flex cursor-pointer items-start gap-2 text-xs text-textPrimary dark:text-darkTextPrimary">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleServiceToggle(s.id)}
                            className="mt-0.5 h-4 w-4 accent-accentFrom dark:accent-darkAccentFrom"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{s.name}</span>
                            {selected && (
                              <span className="mt-0.5 block text-2xs leading-relaxed text-textSecondary dark:text-darkTextSecondary">
                                {s.mainFunction}
                              </span>
                            )}
                          </span>
                        </label>
                      </div>
                    )
                  })}
                </div>
                {errors.selectedServices && (
                  <span className="field-error">{errors.selectedServices}</span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Estado inicial">
                  <SelectInput name="status" value={form.status} onChange={handleChange}>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Prioridad">
                  <SelectInput name="priority" value={form.priority} onChange={handleChange}>
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Disponibilidad">
                  <SelectInput
                    name="availabilityLevel"
                    value={form.availabilityLevel}
                    onChange={handleChange}
                  >
                    <option value="">Sin definir</option>
                    {(Object.keys(AVAILABILITY_META) as AvailabilityLevel[]).map((level) => (
                      <option key={level} value={level}>
                        {AVAILABILITY_META[level].label} · {AVAILABILITY_META[level].sla}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>

              {form.availabilityLevel && (
                <div className="hint-bar">
                  <Timer className="mt-0.5 h-4 w-4 shrink-0 text-accentFrom dark:text-darkAccentFrom" />
                  <span>
                    Tiempo estimado de implementación:{' '}
                    <strong className="font-semibold">
                      {estimationRange(form.availabilityLevel)}
                    </strong>
                  </span>
                </div>
              )}

              <Button type="submit" variant="accent" icon={Plus} className="w-full">
                Registrar propuesta
              </Button>
            </form>
          </Section>

          <button
            type="button"
            onClick={openSuggestions}
            className="hint-bar w-full text-left"
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accentFrom dark:text-darkAccentFrom" />
            <span className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-textPrimary dark:text-darkTextPrimary">
                  Ver sugerencias de arquitectura
                </span>
                <ChevronDown className="h-4 w-4" />
              </span>
              <span>
                {suggestions.length > 0
                  ? `${suggestions.length} opciones según tu configuración — desplázate para verlas`
                  : 'Genera 3 opciones automáticas — desplázate para verlas'}
              </span>
            </span>
          </button>
        </aside>

        <main className="space-y-6 lg:col-span-8">
          <Section
            title="Propuestas registradas"
            description={`Portafolio maestro: ${portfolio.approved} aprobadas · ${portfolio.inReview} en revisión · ${portfolio.draft} borradores.`}
            actions={
              <ChipTabs
                ariaLabel="Filtrar por estado"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'todas', label: 'Todas', count: filterCounts.todas },
                  {
                    value: 'borrador',
                    label: 'Borrador',
                    count: filterCounts.borrador
                  },
                  {
                    value: 'en_revision',
                    label: 'En revisión',
                    count: filterCounts.en_revision
                  },
                  { value: 'aprobada', label: 'Aprobada', count: filterCounts.aprobada }
                ]}
              />
            }
          >
            {projects.length > 0 && (
              <p className="hint-bar mb-4">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accentFrom dark:text-darkAccentFrom" />
                <span>
                  Los {portfolio.projects} proyectos maestros se comparten con Costos,
                  Infraestructura, Red y Seguridad: al cambiar su estado aquí, cambia en todas las
                  vistas.
                </span>
              </p>
            )}

            {filteredProposals.length > 0 && (
              <ol className="relative ml-1 border-l-2 border-border pl-6 dark:border-darkBorder">
                {filteredProposals.map((p) => (
                  <li key={`timeline-${p.id}`} className="relative pb-4 last:pb-0">
                    <span
                      className={`absolute -left-[30px] top-4 h-3 w-3 rounded-full border-2 border-background dark:border-darkBackground ${
                        p.status === 'aprobada'
                          ? 'bg-success dark:bg-darkSuccess'
                          : p.status === 'en_revision'
                            ? 'bg-warning dark:bg-darkWarning'
                            : 'bg-danger dark:bg-darkDanger'
                      }`}
                    />
                    <article className="card-tile">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h4 className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                              {p.solutionName}
                            </h4>
                            <StatusPill status={p.status} />
                            <PriorityPill priority={p.priority} />
                            <span className="text-2xs text-textSecondary dark:text-darkTextSecondary">
                              {formatDate(p.createdAt)}
                            </span>
                            {compareMode && (
                              <label className="ml-auto inline-flex items-center gap-2 text-2xs text-textSecondary dark:text-darkTextSecondary">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(p.id)}
                                  disabled={
                                    !selectedIds.includes(p.id) && selectedIds.length >= 2
                                  }
                                  onChange={() => handleToggleCompare(p.id)}
                                  className="h-4 w-4 accent-accentFrom dark:accent-darkAccentFrom"
                                />
                                Comparar
                              </label>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
                            {p.appType} · {regionName(p.region)} ·{' '}
                            {p.estimatedUsers.toLocaleString('es-PE')} usuarios
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-textSecondary dark:text-darkTextSecondary">
                            <span className="inline-flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              Implementación:{' '}
                              <span className="font-semibold">
                                {estimationWeeks(p.availabilityLevel)}
                              </span>
                            </span>
                            <span>
                              · Disponibilidad:{' '}
                              <span className="font-semibold">
                                {availabilitySla(p.availabilityLevel)}
                              </span>
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {p.selectedServices.map((s) => (
                              <span key={s} className="badge badge-solid">
                                {serviceName(s)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="ml-4 flex shrink-0 flex-col items-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDetailId(p.id)}
                          >
                            Ver detalles
                          </Button>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Copy}
                              onClick={() => duplicateProposal(p)}
                            >
                              Duplicar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => exportProposal(p)}>
                              Exportar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={Trash2}
                              onClick={() => handleRemove(p.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ol>
            )}

            {filteredProposals.length === 0 && (
              <div className="empty-state">
                No hay propuestas con este estado. Cambia el filtro o registra una nueva.
              </div>
            )}

            {compareMode && selectedProposals.length === 2 && (
              <div className="table-wrap mt-4">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Campo</th>
                      {selectedProposals.map((proposal) => (
                        <th key={proposal.id} scope="col">
                          {proposal.solutionName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.label}>
                        <td className="font-medium text-textSecondary dark:text-darkTextSecondary">
                          {row.label}
                        </td>
                        {selectedProposals.map((proposal) => (
                          <td key={`${proposal.id}-${row.label}`} className="align-top">
                            {row.value(proposal)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {detailProposal && (
              <section className="section-card-compact mt-4">
                <div className="section-head">
                  <div className="min-w-0">
                    <h3 className="section-title">{detailProposal.solutionName}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs">{detailProposal.appType}</span>
                      <StatusPill status={detailProposal.status} />
                      <PriorityPill priority={detailProposal.priority} />
                      <span className="text-2xs text-textSecondary dark:text-darkTextSecondary">
                        Creada: {formatDate(detailProposal.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setDetailId(null)}>
                    Cerrar
                  </Button>
                </div>

                <div className="section-body grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                  <div>
                    Región:{' '}
                    <strong className="font-semibold">
                      {regionName(detailProposal.region)}
                    </strong>
                  </div>
                  <div>
                    Usuarios:{' '}
                    <strong className="font-semibold">
                      {detailProposal.estimatedUsers.toLocaleString('es-ES')}
                    </strong>
                  </div>
                  <div>
                    Disponibilidad:{' '}
                    <strong className="font-semibold">
                      {availabilitySla(detailProposal.availabilityLevel)}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {detailProposal.selectedServices.map((s) => (
                    <span key={s} className="badge badge-solid">
                      {serviceName(s)}
                    </span>
                  ))}
                </div>

                {detailSuggestion && (
                  <div className="hint-bar mt-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accentFrom" />
                    <span>
                      Arquitectura recomendada:{' '}
                      <strong>{detailSuggestion.stack.join(' + ')}</strong> —{' '}
                      {currency.format(detailSuggestion.estimatedCost)} / mes
                    </span>
                  </div>
                )}
              </section>
            )}
          </Section>
        </main>
      </div>

      {suggestionsOpen && (
        <section ref={suggestionsRef} className="hint-bar scroll-mt-24 flex-col">
          <div className="section-head w-full">
            <div className="min-w-0">
              <h3 className="section-title">
                <Lightbulb className="h-4 w-4 text-accentFrom dark:text-darkAccentFrom" />
                Arquitecturas sugeridas
                <Badge tone="warning">Simulación</Badge>
              </h3>
              <p className="section-subtitle">
                Configuración actual: {form.appType || 'sin tipo'} · {form.estimatedUsers || 0}{' '}
                usuarios · disponibilidad {availabilitySla(form.availabilityLevel)}. Aplica una a tu
                formulario o regístrala.
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSuggestionsOpen(false)}>
              Cerrar
            </Button>
          </div>

          <div className="mt-4 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {(suggestions.length > 0 ? suggestions : suggestionsFallback).map((sugg) => (
              <div key={sugg.name} className="card-tile flex flex-col">
                <h4 className="text-sm font-semibold">{sugg.name}</h4>
                <p className="text-2xs text-textSecondary dark:text-darkTextSecondary">
                  {sugg.tagline}
                </p>
                <p className="mt-2 font-semibold">{sugg.stack.join(' + ')}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sugg.stack.map((s) => (
                    <span key={s} className="badge badge-solid">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-textSecondary dark:text-darkTextSecondary">
                  {sugg.rationale}
                </p>
                <p className="mt-2 font-bold">{currency.format(sugg.estimatedCost)} / mes</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <Button
                    size="sm"
                    variant="accent"
                    icon={Check}
                    onClick={() => applySuggestion(sugg)}
                  >
                    Usar en el formulario
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        solutionName:
                          prev.solutionName || `${sugg.name} · ${form.appType || 'Arquitectura'}`
                      }))
                    }
                  >
                    Preparar nombre
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
