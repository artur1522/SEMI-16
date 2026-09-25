import { useMemo, useState, type FormEvent } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Calculator, Calendar, DollarSign, Download, Gauge, LineChart as LineChartIcon, Plus, TrendingUp, Wallet } from 'lucide-react'
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import StatCard from '../components/StatCard'
import CostCard from '../components/CostCard'
import { useTheme } from '../hooks/useTheme'
import { usePreferences } from '../hooks/usePreferences'
import { useCloudStore } from '../store/cloudStore'
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

const HOURS_PER_MONTH = 730

const serviceCatalog: { name: string; unitCost: number; category: CostCategory }[] = [
  { name: 'EC2', unitCost: 120, category: 'Compute' },
  { name: 'S3', unitCost: 0.023, category: 'Storage' },
  { name: 'RDS', unitCost: 185, category: 'Database' },
  { name: 'CloudFront', unitCost: 95.5, category: 'Networking' },
  { name: 'Route 53', unitCost: 5, category: 'Networking' },
  { name: 'VPC (NAT Gateway)', unitCost: 45, category: 'Networking' }
]

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

const BUDGET_LIMIT = 4000

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
  { value: 'Compute', label: 'Compute' },
  { value: 'Storage', label: 'Storage' },
  { value: 'Database', label: 'Database' },
  { value: 'Networking', label: 'Networking' }
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

  const { costItems, monthlyHistory } = useCloudStore()
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

  const budgetPercent = Math.min(100, (totalMonthly / BUDGET_LIMIT) * 100)
  const budgetStatus = budgetPercent < 70 ? 'ok' : budgetPercent <= 90 ? 'warn' : 'danger'
  const budgetBarClasses = {
    ok: 'bg-success dark:bg-darkSuccess',
    warn: 'bg-warning dark:bg-darkWarning',
    danger: 'bg-danger dark:bg-darkDanger'
  }[budgetStatus]
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

  const filterTabClass = (isActive: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
      isActive
        ? 'border-primary bg-primary text-white'
        : 'border-border bg-white text-textSecondary hover:bg-background hover:text-textPrimary dark:border-darkBorder dark:bg-darkCard dark:text-darkTextSecondary dark:hover:bg-darkBackground dark:hover:text-darkTextPrimary'
    }`

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

  function handleExportCsv() {
    const header = ['Servicio', 'Categoría', 'Entorno', 'Cantidad', 'Costo mensual', 'Costo anual', 'On-demand', 'Reservado']
    const rows = discountedCosts.map((item) => [
      item.service,
      item.category,
      item.environment,
      item.quantity,
      item.monthlyCost.toFixed(2),
      item.annualCost.toFixed(2),
      (item.onDemandCost ?? 0).toFixed(2),
      (item.reservedCost ?? 0).toFixed(2)
    ])
    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'desglose-costos.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">Costos</h1>
        <p className="mt-2 text-textSecondary dark:text-darkTextSecondary">
          Costos reales derivados del inventario de servidores, editables con estimaciones simuladas.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
          <Calculator className="h-5 w-5 text-primary dark:text-darkPrimary" />
          Estimación simulada
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
            Simulación
          </span>
        </h2>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Selecciona un servicio, cantidad y horas para sobreescribir el costo derivado del inventario.
        </p>

        <form onSubmit={handleEstimate} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            Servicio
            <select
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary"
            >
              {serviceCatalog.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            Cantidad
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            Horas estimadas
            <input
              type="number"
              min={1}
              max={HOURS_PER_MONTH}
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            Entorno
            <select
              value={environment}
              onChange={(event) => setEnvironment(event.target.value as CostEnvironment)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary"
            >
              <option value="dev">Dev</option>
              <option value="staging">Staging</option>
              <option value="production">Producción</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={!preview}
            className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Aplicar estimación
          </button>
        </form>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Costo estimado</p>
            <p className="mt-1 text-xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {preview ? currency.format(preview.estimatedCost) : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Costo mensual</p>
            <p className="mt-1 text-xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {preview ? currency.format(preview.monthlyCost) : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Costo anual</p>
            <p className="mt-1 text-xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {preview ? currency.format(preview.annualCost) : '—'}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-textSecondary dark:text-darkTextSecondary">
          Fórmula simulada: cantidad × tarifa mensual × (horas / {HOURS_PER_MONTH}). El gráfico y las tarjetas se actualizan al aplicar.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            <Wallet className="h-5 w-5 text-primary dark:text-darkPrimary" />
            Presupuesto mensual
          </h2>
          <span className={`text-2xl font-bold ${budgetTextClasses}`}>
            {budgetPercent.toFixed(0)}%
          </span>
        </div>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Consumo del presupuesto configurado con el costo mensual actual.
        </p>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-background dark:bg-darkBackground">
          <div
            className={`h-full rounded-full transition-all duration-300 ${budgetBarClasses}`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <p className="mt-3 text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
          {currency.format(totalMonthly)} consumidos de {currency.format(BUDGET_LIMIT)} / mes
        </p>
        <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
          Valor restante:{' '}
          {currency0.format(Math.max(0, BUDGET_LIMIT - totalMonthly))} ·{' '}
          {budgetPercent < 70
            ? 'Dentro del presupuesto'
            : budgetPercent <= 90
              ? 'Acercándose al límite'
              : 'Presupuesto excedido'}
        </p>
      </section>

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

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            <TrendingUp className="h-5 w-5 text-primary dark:text-darkPrimary" />
            Variación mensual vs mes anterior
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
              Derivado del inventario
            </span>
          </h2>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${
              varianceDirection === 'up'
                ? 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger'
                : 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess'
            }`}
          >
            {varianceDirection === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {variancePercent.toFixed(1)}%
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Mes actual</p>
            <p className="mt-1 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">{currency.format(totalMonthly)}</p>
          </div>
          <div className="rounded-xl bg-background p-4 dark:bg-darkBackground">
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">Mes anterior</p>
            <p className="mt-1 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">{currency.format(previousMonthlyCost)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            <LineChartIcon className="h-5 w-5 text-primary dark:text-darkPrimary" />
            Proyección de costos a 12 meses
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
              Simulación
            </span>
          </h2>
          <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
            Histórico + proyección con crecimiento anual estimado del 2% mensual
          </p>
        </div>
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
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            <AlertTriangle className="h-5 w-5 text-warning dark:text-darkWarning" />
            Sugerencias de optimización
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
              Simulación
            </span>
          </h2>
        </div>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Servicios subutilizados que podrían downgradearse para reducir el costo.
        </p>
        {optimizationSuggestions.length === 0 ? (
          <p className="mt-4 rounded-xl bg-background p-4 text-sm text-textSecondary dark:bg-darkBackground dark:text-darkTextSecondary">
            No se detectaron servicios subutilizados con la configuración actual.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {optimizationSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-xl border border-border bg-background p-4 dark:border-darkBorder dark:bg-darkBackground">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
                    {suggestion.service}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    {suggestion.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm text-textPrimary dark:text-darkTextPrimary">{suggestion.tip}</p>
                <p className="mt-2 text-xs font-semibold text-success dark:text-darkSuccess">
                  Ahorro potencial: {currency0.format(suggestion.potentialSavings)}/mes
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
            <Gauge className="h-5 w-5 text-primary dark:text-darkPrimary" />
            Simulador de Saving Plans
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
              Simulación
            </span>
          </h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
            {activeCommitment.discount}% de descuento
          </span>
        </div>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Mueve el control hacia la derecha para comprometer el uso de tus recursos por más tiempo.
        </p>

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
            className="w-full cursor-pointer accent-primary dark:accent-darkPrimary"
          />
          <div className="mt-2 flex justify-between">
            {commitmentOptions.map((option) => {
              const isActive = option.value === commitment
              return (
                <span
                  key={option.value}
                  className={`text-center text-xs font-semibold ${isActive ? 'text-primary dark:text-darkPrimary' : 'text-textSecondary dark:text-darkTextSecondary'}`}
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
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              Entorno
            </span>
            {environmentFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setEnvFilter(filter.value)}
                className={filterTabClass(envFilter === filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              Categoría
            </span>
            {categoryFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setCatFilter(filter.value)}
                className={filterTabClass(catFilter === filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-textSecondary dark:text-darkTextSecondary">
            Mostrando {filteredCosts.length} de {discountedCosts.length} servicios
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-textPrimary dark:text-darkTextPrimary">
              Subtotal mensual:{' '}
              <span className="text-primary dark:text-darkPrimary">
                {currency0.format(filteredMonthly)}
              </span>
            </span>
            <span className="font-semibold text-textPrimary dark:text-darkTextPrimary">
              Subtotal anual:{' '}
              <span className="text-primary dark:text-darkPrimary">
                {currency0.format(filteredAnnual)}
              </span>
            </span>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textPrimary shadow-sm transition-colors hover:bg-background dark:border-darkBorder dark:bg-darkCard dark:text-darkTextPrimary dark:hover:bg-darkBackground"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {filteredCosts.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white p-6 text-center text-textSecondary dark:border-darkBorder dark:bg-darkCard dark:text-darkTextSecondary">
            No hay servicios que coincidan con los filtros seleccionados.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {filteredCosts.map((item) => (
              <CostCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <h2 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
          Distribución del costo mensual
        </h2>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Costo mensual por servicio en USD, con el compromiso seleccionado.
        </p>
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
      </section>
    </div>
  )
}