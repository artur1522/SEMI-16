import { useEffect, useRef } from 'react'
import { BookOpen, Cloud, ExternalLink, FileText, Flame, Gauge, Link2, X } from 'lucide-react'
import type { Service } from '../types/cloud'
import StatusBadge from './StatusBadge'
import { awsServices } from '../data/awsServices'

interface ServiceDetailModalProps {
  service: Service
  popularity?: number
  onClose: () => void
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function ServiceDetailModal({ service, popularity = 0, onClose }: ServiceDetailModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousActiveRef.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((element) => !element.hasAttribute('disabled'))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveRef.current?.focus()
    }
  }, [onClose])

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label={`Detalles del servicio ${service.name}`}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-xl outline-none focus:ring-2 focus:ring-primary/40 dark:border-darkBorder dark:bg-darkCard dark:focus:ring-darkPrimary/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-textPrimary dark:text-darkTextPrimary">
              {service.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
                {service.category}
              </span>
              <StatusBadge status={service.status} />
              {popularity > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning dark:bg-darkWarning/10 dark:text-darkWarning"
                  title="Apariciones en propuestas de Planificación"
                >
                  <Flame className="h-3.5 w-3.5" />
                  {popularity} propuesta{popularity !== 1 && 's'}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalles"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-textSecondary transition-colors hover:bg-danger/10 hover:text-danger dark:text-darkTextSecondary dark:hover:bg-darkDanger/10 dark:hover:text-darkDanger"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-textSecondary dark:text-darkTextSecondary">
          {service.description}
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-background p-3 text-sm text-textPrimary dark:bg-darkBackground dark:text-darkTextPrimary">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-darkPrimary" />
          <p>
            <span className="font-semibold">Función principal: </span>
            {service.mainFunction}
          </p>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-background p-3 text-sm text-textPrimary dark:bg-darkBackground dark:text-darkTextPrimary">
          <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-darkPrimary" />
          <p>
            <span className="font-semibold">Cuotas: </span>
            {service.quotas}
          </p>
        </div>

        {service.related && service.related.length > 0 && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
              <Link2 className="h-4 w-4" />
              Se usa junto con
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {service.related.map((relatedId) => {
                const related = awsServices.find((item) => item.id === relatedId)
                if (!related) return null
                return (
                  <span
                    key={relatedId}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary"
                  >
                    {related.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            <Cloud className="h-4 w-4" />
            Alternativas en otras nubes
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {service.alternatives.map((alternative) => (
              <span
                key={alternative}
                className="rounded-full bg-textSecondary/10 px-2.5 py-1 text-xs font-medium text-textPrimary dark:bg-darkTextSecondary/10 dark:text-darkTextPrimary"
              >
                {alternative}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
            <BookOpen className="h-4 w-4" />
            Documentación
          </p>
          <div className="mt-2">
            <a
              href={service.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              Ver documentación oficial
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}