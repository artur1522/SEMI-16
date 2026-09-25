import { Activity, Check, ChevronDown, Coins, Monitor, RotateCcw, Server, Timer, type LucideIcon } from 'lucide-react'
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
          className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm font-medium text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-darkBorder dark:bg-darkBackground dark:text-darkTextPrimary dark:focus:border-darkPrimary dark:focus:ring-darkPrimary/20"
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
              className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                active
                  ? 'border-primary bg-primary/5 text-textPrimary dark:border-darkPrimary dark:bg-darkPrimary/10'
                  : 'border-border bg-white text-textSecondary hover:bg-background dark:border-darkBorder dark:bg-darkCard dark:text-darkTextSecondary dark:hover:bg-darkBackground'
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  active
                    ? 'border-primary bg-primary dark:border-darkPrimary dark:bg-darkPrimary'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
          Configuración
        </h1>
        <p className="mt-2 text-textSecondary dark:text-darkTextSecondary">
          Preferencias de la aplicación. Se guardan localmente en este navegador.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
          <Coins className="h-5 w-5 text-primary dark:text-darkPrimary" />
          Preferencias generales
        </h2>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Estos ajustes aplican a todo el panel: costos, duraciones y espaciado de la interfaz.
        </p>

        <div className="mt-6 space-y-8">
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
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
          <Activity className="h-5 w-5 text-primary dark:text-darkPrimary" />
          Estado del sistema
        </h2>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Fuente única de datos del panel: servidores, propuestas y regiones provienen del mismo
          store central.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4 text-center dark:border-darkBorder dark:bg-darkBackground">
            <Server className="mx-auto h-5 w-5 text-primary dark:text-darkPrimary" />
            <p className="mt-2 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {servers.length}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              Servidores
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-center dark:border-darkBorder dark:bg-darkBackground">
            <Coins className="mx-auto h-5 w-5 text-primary dark:text-darkPrimary" />
            <p className="mt-2 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {proposals.length}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              Propuestas
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 text-center dark:border-darkBorder dark:bg-darkBackground">
            <Activity className="mx-auto h-5 w-5 text-success dark:text-darkSuccess" />
            <p className="mt-2 text-2xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {operationalRegions}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              Regiones operativas
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-darkBorder dark:bg-darkCard">
        <h2 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
          Tour de bienvenida
        </h2>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          ¿Quieres volver a ver la guía de introducción que se muestra la primera vez que abres la
          aplicación?
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updatePreferences('onboardingSeen', false)}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:bg-darkPrimary"
          >
            Volver a mostrar el tour
          </button>
          <button
            type="button"
            onClick={() => updatePreferences('onboardingSeen', true)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-textSecondary transition-colors hover:bg-background hover:text-textPrimary dark:border-darkBorder dark:text-darkTextSecondary dark:hover:bg-darkBackground dark:hover:text-darkTextPrimary"
          >
            No volver a mostrar
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-danger/20 bg-danger/5 p-6 dark:border-darkDanger/20 dark:bg-darkDanger/5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-danger dark:text-darkDanger">
          <RotateCcw className="h-5 w-5" />
          Restablecer preferencias
        </h2>
        <p className="mt-1 text-sm text-textSecondary dark:text-darkTextSecondary">
          Vuelve a los valores por defecto: dólar, días y densidad cómoda.
        </p>
        <button
          type="button"
          onClick={resetPreferences}
          className="mt-4 rounded-xl border border-danger/30 bg-white px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white focus:outline-none focus:ring-2 focus:ring-danger/40 dark:bg-darkCard dark:hover:bg-darkDanger"
        >
          Restablecer todo
        </button>
      </section>
    </div>
  )
}