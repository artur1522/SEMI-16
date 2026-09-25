import { CheckCircle2, Eye, Flame, Wrench } from 'lucide-react'
import type { Service } from '../types/cloud'
import StatusBadge from './StatusBadge'

interface ServiceCardProps {
  service: Service
  onSelect?: (service: Service) => void
  popularity?: number
  compareMode?: boolean
  compareSelected?: boolean
  onToggleCompare?: () => void
}

export default function ServiceCard({
  service,
  onSelect,
  popularity = 0,
  compareMode = false,
  compareSelected = false,
  onToggleCompare
}: ServiceCardProps) {
  function handleClick() {
    onSelect?.(service)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (compareMode) {
        onToggleCompare?.()
      } else {
        onSelect?.(service)
      }
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-haspopup={!compareMode ? 'dialog' : undefined}
      aria-label={
        compareMode
          ? `${compareSelected ? 'Quitar' : 'Agregar'} ${service.name} de la comparación`
          : `Ver detalles de ${service.name}`
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex cursor-pointer flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-accentFrom/10 dark:bg-darkCard dark:hover:ring-darkAccentFrom/10 ${
        compareSelected
          ? 'border-accentFrom/50 bg-gradient-to-r from-accentFrom/10 via-white to-accentTo/10 ring-2 ring-accentFrom/20 dark:border-darkAccentFrom/50 dark:from-darkAccentFrom/15 dark:via-darkCard dark:to-darkAccentTo/15 dark:ring-darkAccentFrom/25'
          : 'border-border dark:border-darkBorder'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-textPrimary dark:text-darkTextPrimary">
              {service.name}
            </h3>
            <span className="text-[10px] font-medium text-textSecondary dark:text-darkTextSecondary">
              {service.fullName}
            </span>
          </div>
          <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
            {service.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {popularity > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning dark:bg-darkWarning/10 dark:text-darkWarning"
              title="Apariciones en propuestas de Planificación"
            >
              <Flame className="h-3.5 w-3.5" />
              {popularity}
            </span>
          )}
          <StatusBadge status={service.status} />
          {compareMode ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onToggleCompare?.()
              }}
              aria-label={`${compareSelected ? 'Quitar' : 'Agregar'} ${service.name} a la comparación`}
               className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                 compareSelected
                   ? 'bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 text-white shadow-[0_0_12px_rgba(124,58,237,0.18)] dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_12px_rgba(139,92,246,0.24)]'
                   : 'bg-background text-textSecondary hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-accentFrom dark:bg-darkBackground dark:text-darkTextSecondary dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkAccentFrom'
               }`}
            >
              {compareSelected ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Elegido
                </>
              ) : (
                'Comparar'
              )}
            </button>
          ) : (
            <Eye className="h-4 w-4 shrink-0 text-textSecondary dark:text-darkTextSecondary" aria-hidden="true" />
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
        {service.description}
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-background p-3 text-sm text-textPrimary dark:bg-darkBackground dark:text-darkTextPrimary">
        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-darkPrimary" />
        <p>
          <span className="font-semibold">Función principal: </span>
          {service.mainFunction}
        </p>
      </div>
    </article>
  )
}