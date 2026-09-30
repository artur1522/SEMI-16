import { Activity, Check, ChevronDown, Coins, Monitor, RotateCcw, Server, Timer, type LucideIcon } from 'lucide-react'
import { Button, PageHeader, Section } from '../components/ui'
import { usePreferences, type Currency, type Density, type TimeUnit } from '../hooks/usePreferences'
import { useCloudStore } from '../store/cloudStore'

interface Option<T> {
  value: T
  label: string
  description: string
}

const currencyOptions: Option<Currency>[] = [
  { value: 'USD', label: 'USD · Dólar', description: '$ — dólar estadounidense' },
  { value: 'PEN', label: 'PEN · Sol peruano', description: 'S/ — sol peruano' },
  { value: 'EUR', label: 'EUR · Euro', description: '€ — euro' }
]

const timeUnitOptions: Option<TimeUnit>[] = [
  { value: 'days', label: 'Días', description: 'Mostrar duraciones en días (y horas menores a 1 día)' },
  { value: 'hours', label: 'Horas', description: 'Mostrar duraciones siempre en horas' }
]

const densityOptions: Option<Density>[] = [
  { value: 'compacto', label: 'Compacto', description: 'Máxima densidad de información en pantalla' },
  { value: 'comodo', label: 'Cómodo', description: 'Equilibrio entre densidad y lectura (recomendado)' },
  { value: 'espacioso', label: 'Espacioso', description: 'Más aire entre secciones y tarjetas' }
]

function Select<T extends string>({
  icon: Icon,
  label,
  value,
  options,
  onChange
}: {
  icon: LucideIcon
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  const selected = options.find((option) => option.value === value)
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className="select pr-10 font-medium"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary dark:text-darkTextSecondary" />
      </div>
      {selected && (
        <p className="mt-1.5 text-xs text-textSecondary dark:text-darkTextSecondary">
          {selected.description}
        </p>
      )}
    </label>
  )
}

function SegmentedControl<T extends string>({
  icon: Icon,
  label,
  value,
  options,
  onChange
}: {
  icon: LucideIcon
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/40 ${
                active
                  ? 'border-transparent bg-gradient-to-r from-accentFrom/10 via-white to-accentTo/10 text-textPrimary dark:text-darkTextPrimary shadow-[0_0_12px_rgba(124,58,237,0.12)] dark:from-darkAccentFrom/15 dark:via-darkCard dark:to-darkAccentTo/15 dark:shadow-[0_0_12px_rgba(139,92,246,0.18)] dark:focus:ring-darkAccentFrom/40'
                  : 'border-border bg-white text-textSecondary hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 dark:border-darkBorder dark:bg-darkCard dark:text-darkTextSecondary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:focus:ring-darkAccentFrom/40'
              }`}
            >
              <span
className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                   active
                     ? 'border-transparent bg-slate-950 bg-gradient-to-br from-accentFrom/90 to-accentTo/90 shadow-[0_0_8px_rgba(124,58,237,0.2)] dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_8px_rgba(139,92,246,0.26)]'
                     : 'border-textSecondary/40 dark:border-darkTextSecondary/40'
                 }`}
              >
                {active && <Check className="h-3 w-3 text-white" />}
              </span>
              <span>
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed">{option.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Config() {
  const { preferences, updatePreferences, resetPreferences } = usePreferences()
  const { servers, proposals, regions } = useCloudStore()

  const operationalRegions = regions.filter((region) => region.status === 'operational').length

  return (
    <div className="page">
      <PageHeader
        eyebrow="Preferencias"
        title="Configuración"
        description="Preferencias de la aplicación. Se guardan localmente en este navegador."
      />

      <Section
        title="Preferencias generales"
        icon={Coins}
        description="Estos ajustes aplican a todo el panel: costos, duraciones y espaciado de la interfaz."
      >
        <div className="space-y-8">
          <Select
            icon={Coins}
            label="Moneda mostrada"
            value={preferences.currency}
            options={currencyOptions}
            onChange={(value) => updatePreferences('currency', value)}
          />

          <Select
            icon={Timer}
            label="Unidad de tiempo"
            value={preferences.timeUnit}
            options={timeUnitOptions}
            onChange={(value) => updatePreferences('timeUnit', value)}
          />

          <SegmentedControl
            icon={Monitor}
            label="Densidad de la interfaz"
            value={preferences.density}
            options={densityOptions}
            onChange={(value) => updatePreferences('density', value)}
          />
        </div>
      </Section>

      <Section
        title="Estado del sistema"
        icon={Activity}
        description="Fuente única de datos del panel: servidores, propuestas y regiones provienen del mismo store central."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="panel-muted text-center">
            <Server className="mx-auto h-5 w-5 text-primary dark:text-darkPrimary" />
            <p className="metric-value">{servers.length}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              Servidores
            </p>
          </div>

          <div className="panel-muted text-center">
            <Coins className="mx-auto h-5 w-5 text-primary dark:text-darkPrimary" />
            <p className="metric-value">{proposals.length}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              Propuestas
            </p>
          </div>

          <div className="panel-muted text-center">
            <Activity className="mx-auto h-5 w-5 text-success dark:text-darkSuccess" />
            <p className="metric-value">{operationalRegions}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              Regiones operativas
            </p>
          </div>
        </div>
      </Section>

      <Section title="Tour de bienvenida" icon={Monitor}
        description="¿Quieres volver a ver la guía de introducción que se muestra la primera vez que abres la aplicación?"
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" onClick={() => updatePreferences('onboardingSeen', false)}>
            Volver a mostrar el tour
          </Button>
          <Button variant="secondary" onClick={() => updatePreferences('onboardingSeen', true)}>
            No volver a mostrar
          </Button>
        </div>
      </Section>

      <Section
        title="Restablecer preferencias"
        icon={RotateCcw}
        description="Vuelve a los valores por defecto: dólar, días y densidad cómoda."
        className="border-danger/20 bg-danger/5 dark:border-darkDanger/20 dark:bg-darkDanger/5"
        actions={
          <Button variant="danger" icon={RotateCcw} onClick={resetPreferences}>
            Restablecer todo
          </Button>
        }
      >
        <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
          Esta acción solo afecta las preferencias de este navegador; no borra propuestas ni datos del store.
        </p>
      </Section>
    </div>
  )
}