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
      className={`card-tile flex cursor-pointer flex-col ${
        compareSelected
          ? 'border-accentFrom/60 ring-2 ring-accentFrom/25 dark:border-darkAccentFrom/60 dark:ring-darkAccentFrom/30'
          : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-textPrimary dark:text-darkTextPrimary">
              {service.name}
            </h3>
            <span className="text-2xs text-textSecondary dark:text-darkTextSecondary">
              {service.fullName}
            </span>
          </div>
          <span className="badge badge-solid mt-2">{service.category}</span>
        </div>
        <div className="flex items-center gap-2">
          {popularity > 0 && (
            <span
              className="badge badge-warning"
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
              className={`btn btn-sm ${compareSelected ? 'btn-accent' : 'btn-secondary'}`}
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
            <Eye
              className="h-4 w-4 shrink-0 text-textSecondary dark:text-darkTextSecondary"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
        {service.description}
      </p>

      <div className="panel-muted mt-4 flex items-start gap-2 text-sm text-textPrimary dark:text-darkTextPrimary">
        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-accentFrom dark:text-darkAccentFrom" />
        <p>
          <span className="font-semibold">Función principal: </span>
          {service.mainFunction}
        </p>
      </div>
    </article>
  )
}
