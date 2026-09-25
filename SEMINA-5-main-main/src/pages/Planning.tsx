import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Check, ChevronDown, Columns, Copy, Download, Flag, Lightbulb, Plus, Rocket, Timer, Trash2 } from 'lucide-react'
import type {
  CloudProposal,
  ProposalPriority,
  ProposalStatus
} from '../types/cloud'
import { awsServices } from '../data/awsServices'
import { regionReferences } from '../data/regions'
import { suggestArchitectures, type ArchitectureSuggestion } from '../data/architecture'
import { useCloudStore } from '../store/cloudStore'

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const availabilityOptions = [
  { value: 'basica', label: 'Básica', sla: '99.9%' },
  { value: 'alta', label: 'Alta', sla: '99.99%' },
  { value: 'critica', label: 'Crítica', sla: '99.999%' }
]

const availabilityStyles: Record<string, string> = {
  basica: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess',
  alta: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
  critica: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger'
}

const statusOptions: { value: ProposalStatus; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobada', label: 'Aprobada' }
]

const statusStyles: Record<ProposalStatus, string> = {
  borrador:
    'bg-textSecondary/10 text-textSecondary dark:bg-darkTextSecondary/10 dark:text-darkTextSecondary',
  en_revision: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
  aprobada: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess'
}

const priorityOptions: { value: ProposalPriority; label: string }[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' }
]

const priorityStyles: Record<ProposalPriority, string> = {
  alta: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger',
  media: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
  baja: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess'
}

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

const inputClass = 'w-full rounded-md border border-border bg-white px-3 py-1.5 text-xs text-textPrimary placeholder:text-textSecondary focus:border-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/20 dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary dark:placeholder:text-darkTextSecondary dark:focus:border-darkAccentFrom dark:focus:ring-darkAccentFrom/20'
const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary'

function fieldClass(hasError: boolean) {
  return `${inputClass} ${hasError ? 'border-danger dark:border-darkDanger' : 'border-border dark:border-darkBorder'}`
}

function regionName(id: string) {
  return regionReferences.find((region) => region.id === id)?.name ?? id
}

function serviceName(id: string) {
  return awsServices.find((service) => service.id === id)?.name ?? id.toUpperCase()
}

function availabilitySla(value: string) {
  return availabilityOptions.find((option) => option.value === value)?.sla ?? '—'
}

function statusLabel(value: ProposalStatus) {
  return statusOptions.find((option) => option.value === value)?.label ?? value
}

function priorityLabel(value: ProposalPriority) {
  return priorityOptions.find((option) => option.value === value)?.label ?? value
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

export default function Planning() {
  const { proposals, addProposal, removeProposal } = useCloudStore()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas')
  const [compareMode, setCompareMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)

  const suggestions = useMemo(() => suggestArchitectures(form.appType, Number(form.estimatedUsers), form.availabilityLevel), [form])
  const suggestionsFallback = useMemo(
    () => suggestArchitectures(form.appType || 'sitio web', form.estimatedUsers ? Number(form.estimatedUsers) : 1000, form.availabilityLevel || 'alta'),
    [form]
  )
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement | null>(null)

  const openSuggestions = () => {
    setSuggestionsOpen(true)
    setTimeout(() => suggestionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
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
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [proposals, statusFilter]
  )

  const filterCounts = useMemo(() => ({
    todas: proposals.length,
    borrador: proposals.filter((p) => p.status === 'borrador').length,
    en_revision: proposals.filter((p) => p.status === 'en_revision').length,
    aprobada: proposals.filter((p) => p.status === 'aprobada').length
  }), [proposals])

  const filterTabs: { value: StatusFilter; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    ...statusOptions.map((o) => ({ value: o.value as StatusFilter, label: o.label }))
  ]

  const selectedProposals = useMemo(
    () => proposals.filter((proposal) => selectedIds.includes(proposal.id)),
    [proposals, selectedIds]
  )

  const detailProposal = proposals.find((p) => p.id === detailId) ?? null
  const detailSuggestion = detailProposal ? suggestArchitectures(detailProposal.appType, detailProposal.estimatedUsers, detailProposal.availabilityLevel)[0] ?? null : null

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'status' ? (value as ProposalStatus) : value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleServiceToggle(id: string) {
    setForm((prev) => ({ ...prev, selectedServices: prev.selectedServices.includes(id) ? prev.selectedServices.filter((s) => s !== id) : [...prev.selectedServices, id] }))
  }

  function validate(cur: FormState) {
    const next: FormErrors = {}
    if (!cur.solutionName.trim()) next.solutionName = 'Ingresa el nombre.'
    if (!cur.appType.trim()) next.appType = 'Ingresa el tipo.'
    if (!cur.description.trim()) next.description = 'Describe la solución.'
    if (!cur.region) next.region = 'Selecciona región.'
    if (!cur.estimatedUsers || Number(cur.estimatedUsers) <= 0) next.estimatedUsers = 'Ingresa usuarios.'
    if (cur.selectedServices.length === 0) next.selectedServices = 'Selecciona al menos un servicio.'
    if (!cur.migrationGoal.trim()) next.migrationGoal = 'Describe objetivo.'
    return next
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validate(form)
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return }
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

  function handleToggleCompareMode() { setCompareMode((p) => !p); setSelectedIds([]) }
  function handleToggleCompare(id: string) { setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : prev.length >= 2 ? prev : [...prev, id]) }

  const comparisonRows: { label: string; value: (p: CloudProposal) => ReactNode }[] = [
    { label: 'Estado', value: (p) => <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[p.status]}`}>{statusLabel(p.status)}</span> },
    { label: 'Prioridad', value: (p) => <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[p.priority]}`}><Flag className="h-3 w-3" />{priorityLabel(p.priority)}</span> },
    { label: 'Tipo', value: (p) => p.appType },
    { label: 'Región', value: (p) => regionName(p.region) },
    { label: 'Usuarios', value: (p) => p.estimatedUsers.toLocaleString('es-PE') },
    { label: 'Implementación', value: (p) => estimationWeeks(p.availabilityLevel) },
    { label: 'Disponibilidad', value: (p) => availabilitySla(p.availabilityLevel) },
    { label: 'Creada', value: (p) => formatDate(p.createdAt) },
    { label: 'Servicios', value: (p) => <div className="flex flex-wrap gap-1.5">{p.selectedServices.map((s) => <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">{serviceName(s)}</span>)}</div> },
    { label: 'Descripción', value: (p) => p.description }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-textPrimary dark:text-darkTextPrimary">Planificación Cloud</h1>
        <p className="mt-2 text-textSecondary dark:text-darkTextSecondary">Define propuestas de arquitectura cloud y regístralas para su evaluación.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
              <Rocket className="h-4 w-4 text-primary dark:text-darkPrimary" />
              Plantillas rápidas
            </p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                   className="flex flex-col items-center gap-1 rounded-lg border border-border bg-background px-2 py-2 text-center text-[11px] font-medium text-textPrimary transition-all hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 focus:outline-none focus:ring-2 focus:ring-accentFrom/40 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:focus:ring-darkAccentFrom/40"
                >
                   <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 bg-gradient-to-br from-accentFrom/90 to-accentTo/90 text-white shadow-sm dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90">
                     {template.icon}
                   </span>
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nombre</label>
                <input name="solutionName" value={form.solutionName} onChange={handleChange} className={fieldClass(Boolean(errors.solutionName))} placeholder="Ej. Plataforma de e-commerce" />
              </div>
              <div>
                <label className={labelClass}>Tipo</label>
                <input name="appType" value={form.appType} onChange={handleChange} className={fieldClass(Boolean(errors.appType))} placeholder="Ej. Web / API / Móvil" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Región</label>
                <select name="region" value={form.region} onChange={handleChange} className={fieldClass(Boolean(errors.region))}>
                  <option value="">Selecciona una región</option>
                  {regionReferences.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Usuarios</label>
                <input name="estimatedUsers" type="number" min={1} value={form.estimatedUsers} onChange={handleChange} className={fieldClass(Boolean(errors.estimatedUsers))} placeholder="Ej. 5000" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Descripción</label>
              <textarea name="description" rows={2} value={form.description} onChange={handleChange} className={fieldClass(Boolean(errors.description))} placeholder="Describe la solución y su propósito." />
            </div>

            <div>
              <label className={labelClass}>Objetivo</label>
              <textarea name="migrationGoal" rows={2} value={form.migrationGoal} onChange={handleChange} className={fieldClass(Boolean(errors.migrationGoal))} placeholder="Ej. Reducir costos y mejorar la disponibilidad global." />
            </div>

            <div>
              <label className={labelClass}>Servicios Cloud</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {awsServices.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-white px-2 py-1 text-xs text-textPrimary dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary">
                    <input type="checkbox" checked={form.selectedServices.includes(s.id)} onChange={() => handleServiceToggle(s.id)} className="h-4 w-4 accent-accentFrom dark:accent-darkAccentFrom" />
                    <span className="truncate">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select name="availabilityLevel" value={form.availabilityLevel} onChange={handleChange} className={fieldClass(Boolean(errors.availabilityLevel))}>
                <option value="">Disponibilidad</option>
                {availabilityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select name="priority" value={form.priority} onChange={handleChange} className={fieldClass(false)}>
                {priorityOptions.map((o) => <option key={o.value} value={o.value}>Prioridad: {o.label}</option>)}
              </select>
              <select name="status" value={form.status} onChange={handleChange} className={fieldClass(false)}>
                {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {form.availabilityLevel && (
              <div className="flex items-center gap-2 rounded-md border border-accentFrom/20 bg-gradient-to-r from-accentFrom/5 to-accentTo/5 px-3 py-2 text-xs text-textPrimary dark:border-darkAccentFrom/30 dark:from-darkAccentFrom/10 dark:to-darkAccentTo/10 dark:text-darkTextPrimary">
                <Timer className="h-4 w-4 shrink-0 text-accentFrom dark:text-darkAccentFrom" />
                <span>
                  Tiempo estimado de implementación:{' '}
                  <strong className="font-semibold">{estimationRange(form.availabilityLevel)}</strong>
                </span>
              </div>
            )}

            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_14px_rgba(124,58,237,0.18)] transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accentFrom/40 dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_14px_rgba(139,92,246,0.24)] dark:focus:ring-darkAccentFrom/40">
              <Plus className="h-4 w-4" /> Registrar propuesta
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              onClick={openSuggestions}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-accentFrom/30 bg-gradient-to-r from-accentFrom/5 to-accentTo/5 p-4 text-center text-sm text-textPrimary shadow-sm transition-all hover:border-accentFrom/50 hover:from-accentFrom/10 hover:to-accentTo/10 dark:border-darkAccentFrom/40 dark:from-darkAccentFrom/10 dark:to-darkAccentTo/10 dark:hover:border-darkAccentFrom/50 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:text-darkTextPrimary"
            >
              <Lightbulb className="h-4 w-4 text-accentFrom dark:text-darkAccentFrom" />
              <span className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-2"><span className="font-semibold">Ver sugerencias de arquitectura</span><ChevronDown className="h-4 w-4" /></span>
                <span className="text-xs text-textSecondary dark:text-darkTextSecondary">
                  {suggestions.length > 0 ? `${suggestions.length} opciones según tu configuración — desplázate para verlas` : 'Genera 3 opciones automáticas — desplázate para verlas'}
                </span>
              </span>
            </button>
          </div>
        </aside>
        <main className="lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Propuestas registradas ({proposals.length})</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                 {filterTabs.map((tab) => (
                   <button
                     key={tab.value}
                     type="button"
                     onClick={() => setStatusFilter(tab.value)}
                     className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/40 ${
                       statusFilter === tab.value
                         ? 'border-transparent bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 text-white shadow-[0_0_12px_rgba(124,58,237,0.18)] dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_12px_rgba(139,92,246,0.24)] dark:focus:ring-darkAccentFrom/40'
                         : 'border-border bg-white text-textPrimary hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:focus:ring-darkAccentFrom/40'
                     }`}
                   >
                     {tab.label} ({filterCounts[tab.value]})
                   </button>
                 ))}
              </div>
               <button
                 type="button"
                 onClick={handleToggleCompareMode}
                 aria-pressed={compareMode}
                 className={`ml-2 inline-flex items-center gap-2 rounded-md border px-3 py-1 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/40 ${
                   compareMode
                     ? 'border-transparent bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 text-white shadow-[0_0_12px_rgba(124,58,237,0.18)] dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_12px_rgba(139,92,246,0.24)] dark:focus:ring-darkAccentFrom/40'
                     : 'border-border bg-white text-textPrimary hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:focus:ring-darkAccentFrom/40'
                 }`}
               >
                 <Columns className="h-4 w-4" /> Comparar
               </button>
            </div>
          </div>

          {filteredProposals.length > 0 && (
            <ol className="relative mt-6 ml-1 border-l-2 border-border pl-6 dark:border-darkBorder">
              {filteredProposals.map((p) => (
                <li key={`timeline-${p.id}`} className="relative pb-4 last:pb-0">
                  <span
                    className={`absolute -left-[30px] top-4 h-3 w-3 rounded-full border-2 border-background dark:border-darkBackground ${
                      p.status === 'aprobada'
                        ? 'bg-success'
                        : p.status === 'en_revision'
                          ? 'bg-warning'
                          : 'bg-textSecondary'
                    }`}
                  />
                  <article className="rounded-2xl border border-border bg-white p-4 shadow-sm dark:border-darkBorder dark:bg-darkCard">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h4 className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                            {p.solutionName}
                          </h4>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyles[p.status]}`}>
                            {statusLabel(p.status)}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[p.priority]}`}>
                            <Flag className="h-3 w-3" /> {priorityLabel(p.priority)}
                          </span>
                          <span className="text-[11px] text-textSecondary dark:text-darkTextSecondary">
                            {formatDate(p.createdAt)}
                          </span>
                          {compareMode && (
                            <label className="ml-auto inline-flex items-center gap-2 text-[11px] text-textSecondary dark:text-darkTextSecondary">
                              <input type="checkbox" checked={selectedIds.includes(p.id)} disabled={!selectedIds.includes(p.id) && selectedIds.length >= 2} onChange={() => handleToggleCompare(p.id)} className="h-4 w-4 accent-accentFrom dark:accent-darkAccentFrom" />
                              Compare
                            </label>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
                          {p.appType} · {regionName(p.region)} · {p.estimatedUsers.toLocaleString('es-PE')} usuarios
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-xs text-textSecondary dark:text-darkTextSecondary">
                          <span className="inline-flex items-center gap-1">
                            <Timer className="h-3 w-3" /> Implementación: <span className="font-semibold">{estimationWeeks(p.availabilityLevel)}</span>
                          </span>
                          <span>· Disponibilidad: <span className="font-semibold">{availabilitySla(p.availabilityLevel)}</span></span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">{p.selectedServices.map((s) => <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">{serviceName(s)}</span>)}</div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <button type="button" onClick={() => setDetailId(p.id)} className="rounded text-xs text-textPrimary underline transition-colors hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextPrimary dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/30">Ver detalles</button>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => duplicateProposal(p)} className="inline-flex items-center gap-1 rounded text-xs text-textPrimary transition-colors hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextPrimary dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/30"><Copy className="h-3 w-3" /> Duplicar</button>
                          <button type="button" onClick={() => { const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `propuesta-${p.solutionName.replace(/[^a-z0-9]+/gi, '-')}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); }} className="rounded text-xs text-textPrimary transition-colors hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextPrimary dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/30">Exportar</button>
                          <button onClick={() => handleRemove(p.id)} className="text-xs text-danger dark:text-darkDanger">Eliminar</button>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          )}

          {compareMode && selectedProposals.length === 2 && (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white p-3 shadow-sm dark:border-darkBorder dark:bg-darkCard">
              <table className="min-w-full text-left text-xs text-textPrimary dark:text-darkTextPrimary">
                <thead>
                  <tr>
                    <th className="px-2 py-2 font-semibold">Campo</th>
                    {selectedProposals.map((proposal) => (
                      <th key={proposal.id} className="px-2 py-2 font-semibold">{proposal.solutionName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-t border-border dark:border-darkBorder">
                      <td className="px-2 py-2 font-medium text-textSecondary dark:text-darkTextSecondary">{row.label}</td>
                      {selectedProposals.map((proposal) => (
                        <td key={`${proposal.id}-${row.label}`} className="px-2 py-2 align-top">{row.value(proposal)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detailProposal && (
            <section className="mt-4 rounded-2xl border border-border bg-white p-4 shadow-sm dark:border-darkBorder dark:bg-darkCard">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{detailProposal.solutionName}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs">{detailProposal.appType}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyles[detailProposal.status]}`}>{statusLabel(detailProposal.status)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${priorityStyles[detailProposal.priority]}`}>
                      <Flag className="h-3 w-3" /> {priorityLabel(detailProposal.priority)}
                    </span>
                    <span className="text-[11px] text-textSecondary dark:text-darkTextSecondary">
                      Creada: {formatDate(detailProposal.createdAt)}
                    </span>
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => setDetailId(null)} className="rounded text-xs text-textPrimary transition-colors hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextPrimary dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/30">Cerrar</button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>Región: <strong className="font-semibold">{regionName(detailProposal.region)}</strong></div>
                <div>Usuarios: <strong className="font-semibold">{detailProposal.estimatedUsers.toLocaleString('es-ES')}</strong></div>
                <div>Disponibilidad: <strong className="font-semibold">{availabilitySla(detailProposal.availabilityLevel)}</strong></div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">{detailProposal.selectedServices.map((s) => <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">{serviceName(s)}</span>)}</div>

              {detailSuggestion && <div className="mt-3 rounded-md border border-border bg-background p-3 text-sm text-textPrimary dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary">Arquitectura recomendada: <strong>{detailSuggestion.stack.join(' + ')}</strong> — {currency.format(detailSuggestion.estimatedCost)} / mes</div>}
            </section>
          )}
        </main>
      </div>

      {suggestionsOpen && (
        <section ref={suggestionsRef} className="mt-6 scroll-mt-24 rounded-2xl border border-accentFrom/30 bg-gradient-to-r from-accentFrom/5 to-accentTo/5 p-4 dark:border-darkAccentFrom/40 dark:from-darkAccentFrom/10 dark:to-darkAccentTo/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accentFrom dark:text-darkAccentFrom" /> Arquitecturas sugeridas <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">Simulación</span></h3>
              <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">Configuración actual: {form.appType || 'sin tipo'} · {form.estimatedUsers || 0} usuarios · disponibilidad {availabilitySla(form.availabilityLevel)}. Aplica una a tu formulario o regístrala.</p>
            </div>
            <button type="button" onClick={() => setSuggestionsOpen(false)} className="rounded text-xs text-textPrimary transition-colors hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextPrimary dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/30">Cerrar</button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {(suggestions.length > 0 ? suggestions : suggestionsFallback).map((sugg) => (
              <div key={sugg.name} className="flex flex-col rounded-2xl border border-border bg-white p-4 shadow-sm dark:border-darkBorder dark:bg-darkCard">
                <h4 className="font-semibold text-sm">{sugg.name}</h4>
                <p className="text-[11px] text-textSecondary dark:text-darkTextSecondary">{sugg.tagline}</p>
                <p className="mt-2 font-semibold">{sugg.stack.join(' + ')}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{sugg.stack.map((s) => <span key={s} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">{s}</span>)}</div>
                <p className="mt-2 text-xs text-textSecondary dark:text-darkTextSecondary">{sugg.rationale}</p>
                <p className="mt-2 font-bold">{currency.format(sugg.estimatedCost)} / mes</p>
                <div className="mt-auto pt-3 flex flex-wrap gap-2">
                  <button onClick={() => applySuggestion(sugg)} className="inline-flex items-center gap-1 rounded-md bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 px-3 py-1 text-xs font-semibold text-white shadow-[0_0_12px_rgba(124,58,237,0.18)] transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accentFrom/40 dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_12px_rgba(139,92,246,0.24)] dark:focus:ring-darkAccentFrom/40"><Check className="h-3 w-3" /> Usar en el formulario</button>
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, solutionName: prev.solutionName || `${sugg.name} · ${form.appType || 'Arquitectura'}` }))} className="rounded text-xs text-textPrimary transition-colors hover:text-accentFrom focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextPrimary dark:hover:text-darkAccentFrom dark:focus:ring-darkAccentFrom/30">Preparar nombre</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
