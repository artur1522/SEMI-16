import { AlertTriangle, Fingerprint, ShieldCheck, Wrench } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useTheme } from '../hooks/useTheme'

interface SecurityScoreProps {
  score: number
  threats: number
  mfaCoverage: number
  patches: number
}

const severityFor = (score: number) =>
  score < 50
    ? { label: 'Riesgo Alto', className: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger' }
    : score <= 80
      ? { label: 'Riesgo Medio', className: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning' }
      : { label: 'Saludable', className: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess' }

export default function SecurityScore({ score, threats, mfaCoverage, patches }: SecurityScoreProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const normalized = Math.max(0, Math.min(100, Math.round(score)))
  const severity = severityFor(normalized)

  const accent =
    normalized < 50
      ? isDark
        ? '#F87171'
        : '#DC2626'
      : normalized <= 80
        ? isDark
          ? '#FBBF24'
          : '#F59E0B'
        : isDark
          ? '#22C55E'
          : '#16A34A'

  const track = isDark ? '#1E293B' : '#E2E8F0'

  const data = [
    { name: 'score', value: normalized },
    { name: 'restante', value: 100 - normalized }
  ]

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex flex-col lg:flex-row">
        <div className="flex flex-col items-center gap-4 p-6 lg:w-[20rem] lg:flex-row lg:gap-5 lg:border-r lg:border-slate-200 lg:pr-8 dark:lg:border-darkBorder">
          <div className="relative h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="75%"
                  outerRadius="97%"
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={accent} />
                  <Cell fill={track} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-textPrimary dark:text-darkTextPrimary">
                {normalized}
              </span>
              <span className="text-xs text-textSecondary dark:text-darkTextSecondary">/ 100</span>
            </div>
          </div>
          <div className="text-center lg:text-left">
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary lg:justify-start">
              <ShieldCheck className="h-3.5 w-3.5 text-primary dark:text-darkPrimary" />
              Security Score
            </p>
            <span
              className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${severity.className}`}
            >
              {severity.label}
            </span>
            <p className="mt-2 max-w-44 text-xs text-textSecondary dark:text-darkTextSecondary">
              Consolidado de controles IAM, cifrado y gestión de accesos.
            </p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 divide-y divide-slate-200 sm:grid-cols-2 lg:grid-cols-3 lg:divide-x lg:divide-y-0 dark:divide-darkBorder">
          <div className="flex flex-col justify-center gap-1.5 p-6">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              <AlertTriangle className="h-3.5 w-3.5 text-danger dark:text-darkDanger" />
              Amenazas detectadas
            </p>
            <p className="text-3xl font-bold text-danger dark:text-darkDanger">{threats}</p>
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
              {threats} alertas activas requieren revisión
            </p>
          </div>

          <div className="flex flex-col justify-center gap-1.5 p-6">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              <Fingerprint className="h-3.5 w-3.5 text-primary dark:text-darkPrimary" />
              Cobertura de MFA
            </p>
            <p className="text-3xl font-bold text-primary dark:text-darkPrimary">{mfaCoverage}%</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-darkBackground">
              <div
                className="h-full rounded-full bg-primary dark:bg-darkPrimary"
                style={{ width: `${Math.max(0, Math.min(100, mfaCoverage))}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">
              Cuentas con autenticación multifactor activa
            </p>
          </div>

          <div className="flex flex-col justify-center gap-1.5 p-6">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              <Wrench className="h-3.5 w-3.5 text-warning dark:text-darkWarning" />
              Parches pendientes
            </p>
            <p className="text-3xl font-bold text-warning dark:text-darkWarning">{patches}</p>
            <p className="text-xs text-textSecondary dark:text-darkTextSecondary">
              {patches} instancias EC2 afectadas por actualizaciones
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}