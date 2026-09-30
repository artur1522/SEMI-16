import { useEffect } from 'react'
import { Boxes, DollarSign, MapPin, Server, X } from 'lucide-react'
import type { Region } from '../types/cloud'
import { awsServices } from '../data/awsServices'
import StatusBadge from './StatusBadge'

interface RegionDetailModalProps {
  region: Region
  monthlyCost: number
  onClose: () => void
}

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

export default function RegionDetailModal({ region, monthlyCost, onClose }: RegionDetailModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const deployedServiceIds = new Set(region.deployedServices)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="region-detail-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-white shadow-2xl dark:border-darkBorder dark:bg-darkCard sm:rounded-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white/95 px-5 py-4 backdrop-blur dark:border-darkBorder dark:bg-darkCard/95 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="region-detail-title" className="text-lg font-bold text-textPrimary dark:text-darkTextPrimary">
                {region.name}
              </h2>
              <StatusBadge status={region.status} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-textSecondary dark:text-darkTextSecondary">
              <MapPin className="h-4 w-4 shrink-0" />
              {region.location} · {region.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalles de región"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-textSecondary transition-colors hover:bg-background hover:text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentFrom/30 dark:text-darkTextSecondary dark:hover:bg-darkBackground dark:hover:text-darkTextPrimary"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3 dark:border-darkBorder">
              <p className="flex items-center gap-1.5 text-xs text-textSecondary dark:text-darkTextSecondary"><Server className="h-3.5 w-3.5" /> Servidores</p>
              <p className="mt-1 text-xl font-bold text-textPrimary dark:text-darkTextPrimary">{region.serversDeployed}</p>
            </div>
            <div className="rounded-lg border border-border p-3 dark:border-darkBorder">
              <p className="flex items-center gap-1.5 text-xs text-textSecondary dark:text-darkTextSecondary"><Boxes className="h-3.5 w-3.5" /> RTT simulado</p>
              <p className="mt-1 text-xl font-bold text-textPrimary dark:text-darkTextPrimary">{region.latencyMs} ms</p>
            </div>
            <div className="col-span-2 rounded-lg border border-border p-3 dark:border-darkBorder sm:col-span-1">
              <p className="flex items-center gap-1.5 text-xs text-textSecondary dark:text-darkTextSecondary"><DollarSign className="h-3.5 w-3.5" /> Costo mensual</p>
              <p className="mt-1 text-xl font-bold text-textPrimary dark:text-darkTextPrimary">{currency.format(monthlyCost)}</p>
            </div>
          </div>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">Zonas de disponibilidad</h3>
              <span className="text-xs text-textSecondary dark:text-darkTextSecondary">{region.availabilityZones.length} zonas</span>
            </div>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border dark:divide-darkBorder dark:border-darkBorder">
              {region.availabilityZones.map((zone) => (
                <li key={zone.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="font-mono text-sm text-textPrimary dark:text-darkTextPrimary">{zone.name}</span>
                  <StatusBadge status={zone.status} />
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">Servicios disponibles</h3>
              <span className="text-xs text-textSecondary dark:text-darkTextSecondary">{awsServices.length} en catálogo</span>
            </div>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {awsServices.map((service) => {
                const deployed = deployedServiceIds.has(service.id)
                return (
                  <li key={service.id} className="flex min-w-0 items-start justify-between gap-3 rounded-lg bg-background px-3 py-2.5 dark:bg-darkBackground">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-textPrimary dark:text-darkTextPrimary">{service.name}</span>
                      <span className="block truncate text-xs text-textSecondary dark:text-darkTextSecondary">{service.category}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${deployed ? 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess' : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300'}`}>
                      {deployed ? 'Desplegado' : 'Disponible'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </section>
    </div>
  )
}