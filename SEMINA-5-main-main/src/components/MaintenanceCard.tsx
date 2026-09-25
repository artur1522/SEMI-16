import { CalendarClock, Wrench, type LucideIcon } from 'lucide-react'

interface MaintenanceCardProps {
  region: string
}

const TASKS: { icon: LucideIcon; label: string }[] = [
  { icon: Wrench, label: 'Actualización de AMIs y parches de seguridad' },
  { icon: CalendarClock, label: 'Rotación de credenciales IAM' },
  { icon: CalendarClock, label: 'Snapshot de bases de datos RDS' }
]

function nextMaintenanceWindow(): string {
  const date = new Date()
  const day = date.getDay()
  const diff = (6 - day + 7) % 7 || 7
  const target = new Date(date.getTime() + diff * 24 * 60 * 60 * 1000)
  target.setUTCHours(2, 0, 0, 0)
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(target)
}

export default function MaintenanceCard({ region }: MaintenanceCardProps) {
  const window = nextMaintenanceWindow()

  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-textSecondary dark:text-darkTextSecondary">
              Próximo mantenimiento programado
            </p>
            <p className="mt-0.5 text-base font-bold capitalize text-textPrimary dark:text-darkTextPrimary">
              {window}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning dark:bg-darkWarning/10 dark:text-darkWarning">
          Simulación
        </span>
      </div>

      <p className="mt-3 text-xs text-textSecondary dark:text-darkTextSecondary">
        Ventana de <strong className="text-textPrimary dark:text-darkTextPrimary">{region}</strong> · duración estimada 2 h.
      </p>

      <ul className="mt-3 space-y-2">
        {TASKS.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-2 text-xs text-textSecondary dark:text-darkTextSecondary"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-primary dark:text-darkPrimary" />
            {label}
          </li>
        ))}
      </ul>
    </article>
  )
}