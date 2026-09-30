import { useMemo, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Calendar,
  DollarSign,
  Gauge,
  LineChart as LineChartIcon,
  Plus,
  TrendingUp,
  Wallet
} from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import StatCard from '../components/StatCard'
import CostCard from '../components/CostCard'
import ExportMenu from '../components/ExportMenu'
import ProjectCard from '../components/ProjectCard'
import { useTheme } from '../hooks/useTheme'
import { usePreferences } from '../hooks/usePreferences'
import { useCloudStore } from '../store/cloudStore'
import { regionReferences } from '../data/regions'
import {
  COST_CATEGORY_LABELS,
  HOURS_PER_MONTH,
  SERVICE_CATEGORY,
  SERVICE_LABELS,
  UNIT_COSTS
} from '../data/cloudOpsData'
import { Badge, Button, ChipTabs, Field, PageHeader, ProgressBar, Section, SelectInput, TextInput } from '../components/ui'
import type { CostCategory, CostEnvironment, CostItem } from '../types/cloud'

function buildCurrencyFormatters(currencyCode: string) {
  return {
    currency: new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2
    }),
    currency0: new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    })
  }
}

const round = (value: number) => Math.round(value * 100) / 100

const serviceCatalog: { name: string; unitCost: number; category: CostCategory }[] = (
  Object.keys(UNIT_COSTS) as string[]
)
  .filter((id) => UNIT_COSTS[id] > 0)
  .map((id) => ({
    name: SERVICE_LABELS[id] ?? id.toUpperCase(),
    unitCost: UNIT_COSTS[id],
    category: SERVICE_CATEGORY[id] ?? 'Compute'
  }))

function estimateCosts(quantity: number, hours: number, unitCost: number) {
  const monthlyCost = round(quantity * unitCost * (hours / HOURS_PER_MONTH))
  return {
    estimatedCost: monthlyCost,
    monthlyCost,
    annualCost: round(monthlyCost * 12)
  }
}

const LIGHT_CHART_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626']
const DARK_CHART_COLORS = ['#3B82F6', '#22C55E', '#FBBF24', '#F87171']

type Commitment = 'none' | '1y' | '3y'

const commitmentOptions: { value: Commitment; label: string; discount: number }[] = [
  { value: 'none', label: 'Sin compromiso', discount: 0 },
  { value: '1y', label: '1 año', discount: 20 },
  { value: '3y', label: '3 años', discount: 40 }
]

const commitmentIndex: Record<Commitment, number> = { none: 0, '1y': 1, '3y': 2 }

const environmentFilters: { value: 'all' | CostEnvironment; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'dev', label: 'Dev' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Producción' }
]

const categoryFilters: { value: 'all' | CostCategory; label: string }[] = [
  { value: 'all', label: 'Todas' },
  ...(['Compute', 'Storage', 'Database', 'Networking', 'Security'] as CostCategory[]).map(
    (category) => ({ value: category, label: COST_CATEGORY_LABELS[category] })
  )
]

export default function Costs() {
  const { theme } = useTheme()
  const { preferences } = usePreferences()
  const { currency, currency0 } = buildCurrencyFormatters(preferences.currency)
  const isDark = theme === 'dark'
  const textColor = isDark ? '#E5E7EB' : '#1E293B'
  const secondaryColor = isDark ? '#94A3B8' : '#64748B'
  const chartColors = isDark ? DARK_CHART_COLORS : LIGHT_CHART_COLORS
  const tooltipContentStyle = isDark
    ? { backgroundColor: '#111827', border: '1px solid #1E293B', borderRadius: '12px', color: '#E5E7EB' }
    : { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', color: '#1E293B' }

  const { costItems, monthlyHistory, monthlyBudgetLimit, projects, portfolio } = useCloudStore()
  const [extraItems, setExtraItems] = useState<CostItem[]>([])

  const items = useMemo(() => {
    const merged = [...costItems]
    for (const extra of extraItems) {
      const index = merged.findIndex((item) => item.service === extra.service)
      if (index === -1) merged.push(extra)
      else merged[index] = { ...merged[index], ...extra }
    }
    return merged
  }, [costItems, extraItems])

  const [commitment, setCommitment] = useState<Commitment>('none')
  const [envFilter, setEnvFilter] = useState<'all' | CostEnvironment>('all')
  const [catFilter, setCatFilter] = useState<'all' | CostCategory>('all')
  const [serviceName, setServiceName] = useState(serviceCatalog[0].name)
  const [quantity, setQuantity] = useState('1')
  const [hours, setHours] = useState(String(HOURS_PER_MONTH))
  const [environment, setEnvironment] = useState<CostEnvironment>('production')

  const selectedService =
    serviceCatalog.find((service) => service.name === serviceName) ?? serviceCatalog[0]
  const quantityValue = Number(quantity)
  const hoursValue = Number(hours)
  const preview =
    quantityValue > 0 && hoursValue > 0
      ? estimateCosts(quantityValue, hoursValue, selectedService.unitCost)
      : null

  const activeCommitment =
    commitmentOptions.find((option) => option.value === commitment) ?? commitmentOptions[0]
  const multiplier = 1 - activeCommitment.discount / 100

  const baseMonthly = items.reduce((sum, item) => sum + item.monthlyCost, 0)
  const baseAnnual = items.reduce((sum, item) => sum + item.annualCost, 0)

  const coverage = commitment === 'none' ? 0 : commitment === '1y' ? 0.6 : 0.85

  const discountedCosts = items.map((item) => ({
    ...item,
    reservedCost: round(item.monthlyCost * coverage * multiplier),
    onDemandCost: round(item.monthlyCost * (1 - coverage)),
    monthlyCost: round(item.monthlyCost * coverage * multiplier + item.monthlyCost * (1 - coverage)),
    annualCost: round(item.annualCost * coverage * multiplier + item.annualCost * (1 - coverage))
  }))

  const totalMonthly = discountedCosts.reduce((sum, item) => sum + item.monthlyCost, 0)
  const totalAnnual = discountedCosts.reduce((sum, item) => sum + item.annualCost, 0)
  const monthlySavings = round(baseMonthly - totalMonthly)
  const annualSavings = round(baseAnnual - totalAnnual)

  const reservedMonthly = round(discountedCosts.reduce((sum, item) => sum + (item.reservedCost ?? 0), 0))
  const onDemandMonthly = round(discountedCosts.reduce((sum, item) => sum + (item.onDemandCost ?? 0), 0))

  const previousMonthlyCost = monthlyHistory.length > 1 ? monthlyHistory[monthlyHistory.length - 2] ?? totalMonthly : totalMonthly
  const varianceDirection = totalMonthly >= previousMonthlyCost ? 'up' : 'down'
  const variancePercent = previousMonthlyCost > 0 ? round(((totalMonthly - previousMonthlyCost) / previousMonthlyCost) * 100) : 0

  const projectionMonths = useMemo(() => {
    const months: { name: string; actual?: boolean; cost: number }[] = []
    const now = new Date()
    const growthRate = 0.02
    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const cost = round(baseMonthly * Math.pow(1 + growthRate, i + 1))
      months.push({
        name: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        cost
      })
    }
    months.push({ name: now.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }), cost: round(baseMonthly), actual: true })
    for (let i = 1; i <= 11; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const cost = round(baseMonthly * Math.pow(1 + growthRate, i + 1))
      months.push({
        name: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        cost
      })
    }
    return months
  }, [baseMonthly])

  const optimizationSuggestions = useMemo(() => {
    const suggestions: { id: string; service: string; tip: string; potentialSavings: number; tag: string }[] = []
    for (const item of items) {
      const utilization = item.estimatedHours / HOURS_PER_MONTH
      if (item.environment !== 'production' && utilization < 0.6) {
        suggestions.push({
          id: `low-${item.id}`,
          service: item.service,
          tag: item.environment,
          tip: `${item.service} en ${item.environment} tiene baja actividad (${Math.round(utilization * 100)}% de uso). Puede reducirse o detenerse fuera de horario.`,
          potentialSavings: round(item.monthlyCost * 0.4)
        })
      }
      if (item.category === 'Storage' && item.monthlyCost > baseMonthly * 0.15) {
        suggestions.push({
          id: `storage-${item.id}`,
          service: item.service,
          tag: item.environment,
          tip: `${item.service} representa una porción alta del costo. Revisar lifecycle policies para mover objetos fríos a Glacier.`,
          potentialSavings: round(item.monthlyCost * 0.25)
        })
      }
    }
    suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings)
    return suggestions.slice(0, 4)
  }, [items])

  const chartData = discountedCosts.map((item) => ({
    name: item.service,
    value: item.monthlyCost
  }))

  const budgetPercent = Math.min(100, (totalMonthly / monthlyBudgetLimit) * 100)
  const budgetStatus = budgetPercent < 70 ? 'ok' : budgetPercent <= 90 ? 'warn' : 'danger'
  const budgetTextClasses = {
    ok: 'text-success dark:text-darkSuccess',
    warn: 'text-warning dark:text-darkWarning',
    danger: 'text-danger dark:text-darkDanger'
  }[budgetStatus]

  const filteredCosts = discountedCosts.filter(
    (item) =>
      (envFilter === 'all' || item.environment === envFilter) &&
      (catFilter === 'all' || item.category === catFilter)
  )
  const filteredMonthly = round(filteredCosts.reduce((sum, item) => sum + item.monthlyCost, 0))
  const filteredAnnual = round(filteredCosts.reduce((sum, item) => sum + item.annualCost, 0))

  function handleEstimate(event: FormEvent) {
    event.preventDefault()
    if (!preview) return

    const nextItem: CostItem = {
      id: selectedService.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      service: selectedService.name,
      quantity: quantityValue,
      estimatedHours: hoursValue,
      unitCost: selectedService.unitCost,
      monthlyCost: preview.monthlyCost,
      annualCost: preview.annualCost,
      category: selectedService.category,
      environment
    }

    setExtraItems((previous) => {
      const index = previous.findIndex((item) => item.service === nextItem.service)
      if (index === -1) return [nextItem, ...previous]
      return previous.map((item, i) => (i === index ? { ...item, ...nextItem, id: item.id } : item))
    })
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Gestión financiera"
        title="Costos"
        description="Costos reales derivados del inventario de servidores y del portafolio de proyectos, editables con estimaciones simuladas."
        badge={<Badge tone="neutral">{portfolio.resources} recursos</Badge>}
        actions={<ExportMenu
          fileName="costos-filtrados"
          title="Reporte de costos"
          headers={[
            'Servicio',
            'Categoría',
            'Entorno',
            'Cantidad',
            'Costo mensual',
            'Costo anual',
            'On-demand',
            'Reservado'
          ]}
          rows={filteredCosts.map((item) => [
            item.service,
            item.category,
            item.environment,
            item.quantity,
            item.monthlyCost.toFixed(2),
            item.annualCost.toFixed(2),
            (item.onDemandCost ?? 0).toFixed(2),
            (item.reservedCost ?? 0).toFixed(2)
          ])}
          summary={[
            { label: 'Servicios incluidos', value: filteredCosts.length },
            { label: 'Subtotal mensual', value: currency.format(filteredMonthly) },
            { label: 'Subtotal anual', value: currency.format(filteredAnnual) },
            {
              label: 'Entorno',
              value:
                environmentFilters.find((filter) => filter.value === envFilter)?.label ?? 'Todos'
            },
            {
              label: 'Categoría',
              value: categoryFilters.find((filter) => filter.value === catFilter)?.label ?? 'Todas'
            },
            { label: 'Compromiso', value: activeCommitment.label }
          ]}
        />}
      />

      <Section
        title="Costo por proyecto"
        description="Mismo desglose que Planificación, Infraestructura y Seguridad: un cambio de recursos se refleja aquí."
        icon={Wallet}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              regionName={
                regionReferences.find((region) => region.id === project.regionId)?.name ??
                project.regionId
              }
            />
          ))}
        </div>
      </Section>

      <Section
        title="Estimación simulada"
        icon={Calculator}
        badge={<Badge tone="warning">Simulación</Badge>}
        description="Selecciona un servicio, cantidad y horas para sobreescribir el costo derivado del inventario."
      >
        <form
          onSubmit={handleEstimate}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <Field label="Servicio">
            <SelectInput
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
            >
              {serviceCatalog.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Cantidad">
            <TextInput
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </Field>
          <Field label="Horas estimadas">
            <TextInput
              type="number"
              min={1}
              max={HOURS_PER_MONTH}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
            />
          </Field>
          <Field label="Entorno">
            <SelectInput
              value={environment}
              onChange={(event) => setEnvironment(event.target.value as CostEnvironment)}
            >
              <option value="dev">Dev</option>
              <option value="staging">Staging</option>
              <option value="production">Producción</option>
            </SelectInput>
          </Field>
          <Button
            type="submit"
            variant="accent"
            icon={Plus}
            disabled={!preview}
            className="self-end"
          >
            Aplicar estimación
          </Button>
        </form>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="panel-muted">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
              Costo estimado
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-textPrimary dark:text-darkTextPrimary">
              {preview ? currency.format(preview.estimatedCost) : '—'}
            </p>
          </div>
          <div className="panel-muted">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Costo mensual</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-textPrimary dark:text-darkTextPrimary">
              {preview ? currency.format(preview.monthlyCost) : '—'}
            </p>
          </div>
          <div className="panel-muted">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Costo anual</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-textPrimary dark:text-darkTextPrimary">
              {preview ? currency.format(preview.annualCost) : '—'}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-textSecondary dark:text-darkTextSecondary">
          Fórmula simulada: cantidad × tarifa mensual × (horas / {HOURS_PER_MONTH}). El gráfico y
          las tarjetas se actualizan al aplicar.
        </p>
      </Section>

      <Section
        title="Presupuesto mensual"
        icon={Wallet}
        actions={
          <span className={`text-2xl font-bold tabular-nums ${budgetTextClasses}`}>
            {budgetPercent.toFixed(0)}%
          </span>
        }
        description="Consumo del presupuesto configurado con el costo mensual actual."
      >
        <ProgressBar percent={budgetPercent} tone={budgetStatus === 'ok' ? 'success' : budgetStatus === 'warn' ? 'warning' : 'danger'} className="h-3" />
        <p className="mt-3 text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
          {currency.format(totalMonthly)} consumidos de {currency.format(monthlyBudgetLimit)} / mes
        </p>
        <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
          Valor restante:{' '}
          {currency0.format(Math.max(0, monthlyBudgetLimit - totalMonthly))} ·{' '}
          {budgetPercent < 70
            ? 'Dentro del presupuesto'
            : budgetPercent <= 90
              ? 'Acercándose al límite'
              : 'Presupuesto excedido'}
        </p>
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <StatCard
          title="Costo mensual total"
          value={currency.format(totalMonthly)}
          icon={DollarSign}
          trend={
            varianceDirection === 'up'
              ? `-${Math.abs(variancePercent).toFixed(1)}%`
              : `+${Math.abs(variancePercent).toFixed(1)}%`
          }
        />
        <StatCard
          title="Costo anual total"
          value={currency.format(totalAnnual)}
          icon={Calendar}
          trend={
            activeCommitment.discount > 0
              ? `Ahorra ${currency0.format(monthlySavings)}/mes`
              : 'Derivado del inventario'
          }
        />
      </div>

      <Section
        title="Variación mensual vs mes anterior"
        icon={TrendingUp}
        badge={<Badge tone="info">Derivado del inventario</Badge>}
        actions={
          <span
            className={`badge ${varianceDirection === 'up' ? 'badge-danger' : 'badge-success'}`}
          >
            {varianceDirection === 'up' ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {variancePercent.toFixed(1)}%
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="panel-muted">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Mes actual</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-textPrimary dark:text-darkTextPrimary">
              {currency.format(totalMonthly)}
            </p>
          </div>
          <div className="panel-muted">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Mes anterior</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-textPrimary dark:text-darkTextPrimary">
              {currency.format(previousMonthlyCost)}
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Proyección de costos a 12 meses"
        icon={LineChartIcon}
        badge={<Badge tone="warning">Simulación</Badge>}
        actions={
          <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
            Histórico + proyección con crecimiento anual estimado del 2% mensual
          </p>
        }
      >
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionMonths}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
              <XAxis dataKey="name" tick={{ fill: secondaryColor, fontSize: 11 }} />
              <YAxis tick={{ fill: secondaryColor, fontSize: 11 }} tickFormatter={(value) => currency0.format(Number(value))} width={70} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={{ color: secondaryColor }}
                formatter={(value) => currency.format(Number(value))}
              />
              <Legend formatter={(value) => <span style={{ color: textColor }}>{value === 'cost' ? 'Proyección' : value}</span>} />
              <Line type="monotone" dataKey="cost" name="cost" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section
        title="Sugerencias de optimización"
        icon={AlertTriangle}
        badge={<Badge tone="warning">Simulación</Badge>}
        description="Servicios subutilizados que podrían downgradearse para reducir el costo."
      >
        {optimizationSuggestions.length === 0 ? (
          <p className="panel-muted text-sm text-textSecondary dark:text-darkTextSecondary">
            No se detectaron servicios subutilizados con la configuración actual.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {optimizationSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="panel-muted"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="badge badge-solid">{suggestion.service}</span>
                  <span className="eyebrow">{suggestion.tag}</span>
                </div>
                <p className="mt-2 text-sm text-textPrimary dark:text-darkTextPrimary">
                  {suggestion.tip}
                </p>
                <p className="mt-2 text-xs font-semibold text-success dark:text-darkSuccess">
                  Ahorro potencial: {currency0.format(suggestion.potentialSavings)}/mes
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Simulador de Saving Plans"
        icon={Gauge}
        badge={<Badge tone="warning">Simulación</Badge>}
        actions={<Badge tone="accent">{activeCommitment.discount}% de descuento</Badge>}
        description="Mueve el control hacia la derecha para comprometer el uso de tus recursos por más tiempo."
      >

        <div className="mt-6">
          <input
            type="range"
            min={0}
            max={commitmentOptions.length - 1}
            step={1}
            value={commitmentIndex[commitment]}
            onChange={(event) =>
              setCommitment(commitmentOptions[Number(event.target.value)].value)
            }
            aria-label="Compromiso de uso"
            className="w-full cursor-pointer accent-accentFrom dark:accent-darkAccentFrom"
          />
          <div className="mt-2 flex justify-between">
            {commitmentOptions.map((option) => {
              const isActive = option.value === commitment
              return (
                <span
                  key={option.value}
                  className={`text-center text-xs font-semibold ${isActive ? 'text-accentFrom dark:text-darkAccentFrom' : 'text-textSecondary dark:text-darkTextSecondary'}`}
                >
                  {option.label}
                  <span className="block font-normal">{option.discount}% descuento</span>
                </span>
              )
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Costo mensual</p>
            <p className="mt-1 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {currency.format(totalMonthly)}
            </p>
            {activeCommitment.discount > 0 ? (
              <p className="mt-1 text-xs font-semibold text-success dark:text-darkSuccess">
                Ahorro de {currency0.format(monthlySavings)} / mes
              </p>
            ) : (
              <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
                Sin descuento aplicado
              </p>
            )}
          </div>
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Costo anual</p>
            <p className="mt-1 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {currency.format(totalAnnual)}
            </p>
            {activeCommitment.discount > 0 ? (
              <p className="mt-1 text-xs font-semibold text-success dark:text-darkSuccess">
                Ahorro de {currency0.format(annualSavings)} / año
              </p>
            ) : (
              <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
                Sin descuento aplicado
              </p>
            )}
          </div>
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Reservado (con descuento)</p>
            <p className="mt-1 text-2xl font-bold text-primary dark:text-darkPrimary">
              {currency.format(reservedMonthly)}
            </p>
            <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
              {commitment === 'none' ? 'Sin cobertura reservada' : `${Math.round(coverage * 100)}% del uso comprometido`}
            </p>
          </div>
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">On-demand</p>
            <p className="mt-1 text-2xl font-bold text-warning dark:text-darkWarning">
              {currency.format(onDemandMonthly)}
            </p>
            <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
              {commitment === 'none' ? '100% del uso corriente' : `${Math.round((1 - coverage) * 100)}% sin comprometer`}
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Detalle de costos"
        description="Filtra por entorno y categoría; la exportación respeta los mismos filtros."
        actions={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <ChipTabs
              ariaLabel="Filtrar por entorno"
              value={envFilter}
              onChange={setEnvFilter}
              options={environmentFilters.map((filter) => ({
                value: filter.value,
                label: filter.label
              }))}
            />
            <ChipTabs
              ariaLabel="Filtrar por categoría"
              value={catFilter}
              onChange={setCatFilter}
              options={categoryFilters.map((filter) => ({
                value: filter.value,
                label: filter.label
              }))}
            />
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-textSecondary dark:text-darkTextSecondary">
            Mostrando {filteredCosts.length} de {discountedCosts.length} servicios
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-textPrimary dark:text-darkTextPrimary">
              Subtotal mensual:{' '}
              <span className="tabular-nums text-accentFrom dark:text-darkAccentFrom">
                {currency0.format(filteredMonthly)}
              </span>
            </span>
            <span className="font-semibold text-textPrimary dark:text-darkTextPrimary">
              Subtotal anual:{' '}
              <span className="tabular-nums text-accentFrom dark:text-darkAccentFrom">
                {currency0.format(filteredAnnual)}
              </span>
            </span>
          </div>
        </div>

        {filteredCosts.length === 0 ? (
          <p className="empty-state">
            No hay servicios que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCosts.map((item) => (
              <CostCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Distribución del costo mensual"
        description="Costo mensual por servicio en USD, con el compromiso seleccionado."
      >
        <div className="mt-4 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={60}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={{ color: secondaryColor }}
                formatter={(value) => currency.format(Number(value))}
              />
              <Legend
                wrapperStyle={{ color: secondaryColor }}
                formatter={(value) => <span style={{ color: textColor }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  )
}