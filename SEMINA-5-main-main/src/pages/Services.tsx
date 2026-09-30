import { useMemo, useState } from 'react'
import { ArrowDownUp, Flame, Search, Shuffle, X } from 'lucide-react'
import ExportMenu from '../components/ExportMenu'
import ServiceCard from '../components/ServiceCard'
import ServiceDetailModal from '../components/ServiceDetailModal'
import { ChipTabs, EmptyState, PageHeader, Section } from '../components/ui'
import { awsServices } from '../data/awsServices'
import { useCloudStore } from '../store/cloudStore'
import type { Service } from '../types/cloud'
import StatusBadge from '../components/StatusBadge'

const categoryLabels: Record<string, string> = {
  Compute: 'Cómputo',
  Storage: 'Almacenamiento',
  Database: 'Bases de Datos',
  Networking: 'Redes',
  Security: 'Seguridad',
  DNS: 'DNS',
  CDN: 'CDN'
}

const categoryOrder = ['Compute', 'Storage', 'Database', 'Networking', 'Security', 'DNS', 'CDN']

type SortKey = 'nombre' | 'categoria' | 'estado' | 'popularidad'

const sortLabels: Record<SortKey, string> = {
  nombre: 'Nombre',
  categoria: 'Categoría',
  estado: 'Estado',
  popularidad: 'Popularidad'
}

interface CompareRow {
  label: string
  values: [string, string]
}

export default function Services() {
  const { proposals } = useCloudStore()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('nombre')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])

  const popularity = useMemo(() => {
    const counts = new Map<string, number>()
    for (const proposal of proposals) {
      for (const id of proposal.selectedServices) {
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
    }
    return counts
  }, [proposals])

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matches = awsServices.filter((service) => {
      const matchesName =
        service.name.toLowerCase().includes(normalizedQuery) ||
        service.fullName.toLowerCase().includes(normalizedQuery) ||
        service.description.toLowerCase().includes(normalizedQuery)
      const matchesCategory = category === 'all' || service.category === category
      return matchesName && matchesCategory
    })

    return [...matches].sort((a, b) => {
      switch (sortBy) {
        case 'categoria':
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
        case 'estado':
          return a.status.localeCompare(b.status) || a.name.localeCompare(b.name)
        case 'popularidad':
          return (popularity.get(b.id) ?? 0) - (popularity.get(a.id) ?? 0) || a.name.localeCompare(b.name)
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }, [query, category, sortBy, popularity])

  function handleToggleCompare(id: string) {
    setCompareIds((previous) => {
      if (previous.includes(id)) return previous.filter((item) => item !== id)
      if (previous.length >= 2) return previous
      return [...previous, id]
    })
  }

  function clearCompare() {
    setCompareIds([])
  }

  const compareServices = compareIds
    .map((id) => awsServices.find((service) => service.id === id))
    .filter((service): service is Service => Boolean(service))

  const totalPopular = Array.from(popularity.values()).reduce((sum, count) => sum + count, 0)

  const compareRows: CompareRow[] = [
    { label: 'Categoría', values: [compareServices[0]?.category ?? '', compareServices[1]?.category ?? ''] },
    { label: 'Estado', values: [compareServices[0]?.status ?? '', compareServices[1]?.status ?? ''] },
    { label: 'Descripción', values: [compareServices[0]?.description ?? '', compareServices[1]?.description ?? ''] },
    { label: 'Función principal', values: [compareServices[0]?.mainFunction ?? '', compareServices[1]?.mainFunction ?? ''] },
    { label: 'Cuotas', values: [compareServices[0]?.quotas ?? '', compareServices[1]?.quotas ?? ''] },
    {
      label: 'Servicios relacionados',
      values: [
        (compareServices[0]?.related ?? []).map((id) => awsServices.find((s) => s.id === id)?.name ?? id).join(', '),
        (compareServices[1]?.related ?? []).map((id) => awsServices.find((s) => s.id === id)?.name ?? id).join(', ')
      ]
    },
    {
      label: 'Popularidad',
      values: [
        `${popularity.get(compareServices[0]?.id ?? '') ?? 0} propuesta${(popularity.get(compareServices[0]?.id ?? '') ?? 0) !== 1 ? 's' : ''} en las que aparece`,
        `${popularity.get(compareServices[1]?.id ?? '') ?? 0} propuesta${(popularity.get(compareServices[1]?.id ?? '') ?? 0) !== 1 ? 's' : ''} en las que aparece`
      ]
    },
    { label: 'Alternativas', values: [(compareServices[0]?.alternatives ?? []).join(', '), (compareServices[1]?.alternatives ?? []).join(', ')] }
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow="Catálogo"
        title="Servicios AWS"
        description={
          <>
            {filteredServices.length} servicio{filteredServices.length !== 1 && 's'} encontrado
            {filteredServices.length !== 1 && 's'}
            {totalPopular > 0 && <> · {totalPopular} aparición{totalPopular !== 1 && 'es'} en propuestas</>}
          </>
        }
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <label className="relative inline-flex items-center">
              <ArrowDownUp className="pointer-events-none absolute left-3 h-4 w-4 text-textSecondary dark:text-darkTextSecondary" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortKey)}
                aria-label="Ordenar servicios"
                className="select pl-9 sm:w-44"
              >
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    Ordenar por {sortLabels[key]}
                  </option>
                ))}
              </select>
              <ArrowDownUp className="pointer-events-none absolute right-2.5 h-4 w-4 rotate-180 text-textSecondary dark:text-darkTextSecondary" />
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textSecondary dark:text-darkTextSecondary" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o descripción..."
                className="input pl-9 pr-8 sm:w-64"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-textSecondary hover:text-danger dark:text-darkTextSecondary dark:hover:text-darkDanger"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <ExportMenu
            fileName="servicios-filtrados"
            title="Reporte de servicios AWS"
            headers={['ID', 'Servicio', 'Nombre completo', 'Categoría', 'Estado', 'Popularidad', 'Descripción', 'Función principal', 'Cuotas', 'Alternativas', 'Documentación']}
            rows={filteredServices.map((service) => [
              service.id,
              service.name,
              service.fullName,
              categoryLabels[service.category] ?? service.category,
              service.status,
              popularity.get(service.id) ?? 0,
              service.description,
              service.mainFunction,
              service.quotas,
              service.alternatives.join('; '),
              service.docsUrl
            ])}
            summary={[
              { label: 'Servicios incluidos', value: filteredServices.length },
              { label: 'Coincidencia de búsqueda', value: query.trim() || 'Todas' },
              { label: 'Categoría', value: category === 'all' ? 'Todas' : categoryLabels[category] ?? category },
              { label: 'Activos', value: filteredServices.filter((service) => service.status === 'active').length },
              { label: 'En advertencia', value: filteredServices.filter((service) => service.status === 'warning').length },
              { label: 'Inactivos', value: filteredServices.filter((service) => service.status === 'inactive').length },
              { label: 'Apariciones en propuestas', value: filteredServices.reduce((sum, service) => sum + (popularity.get(service.id) ?? 0), 0) }
            ]}
          />
          </div>
        }
      />

      <ChipTabs
        ariaLabel="Filtrar por categoría"
        options={[
          { value: 'all', label: 'Todos' },
          ...categoryOrder.map((key) => ({ value: key, label: categoryLabels[key] ?? key }))
        ]}
        value={category}
        onChange={setCategory}
      />

      {compareServices.length === 1 && (
        <p className="hint-bar mt-4">
          <Shuffle className="mt-0.5 h-4 w-4 shrink-0" />
          Selecciona un segundo servicio para compararlos lado a lado.
        </p>
      )}

      {compareServices.length === 2 && (
        <Section
          title="Comparación lado a lado"
          icon={Shuffle}
          actions={
            <button type="button" onClick={clearCompare} className="btn btn-ghost btn-sm text-danger dark:text-darkDanger">
              <X className="h-3.5 w-3.5" />
              Limpiar comparación
            </button>
          }
          className="mt-2 overflow-hidden p-0"
          bodyClassName="mt-0"
        >
          <div className="table-wrap border-0 shadow-none">
            <table className="data-table min-w-[600px]">
              <thead>
                <tr className="border-b border-border dark:border-darkBorder">
                  <th className="w-40 px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    {compareServices[0].name}
                    {(popularity.get(compareServices[0].id) ?? 0) > 0 && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning dark:bg-darkWarning/10 dark:text-darkWarning" title="Popularidad">
                        <Flame className="h-3 w-3" />
                        {popularity.get(compareServices[0].id) ?? 0}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                    {compareServices[1].name}
                    {(popularity.get(compareServices[1].id) ?? 0) > 0 && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning dark:bg-darkWarning/10 dark:text-darkWarning" title="Popularidad">
                        <Flame className="h-3 w-3" />
                        {popularity.get(compareServices[1].id) ?? 0}
                      </span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-darkBorder">
                {compareRows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-6 py-4 align-top text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-darkTextSecondary">
                      {row.label}
                    </td>
                    {row.values.map((value, index) => (
                      <td key={index} className="px-6 py-4 align-top text-textPrimary dark:text-darkTextPrimary">
                        {row.label === 'Estado' ? <StatusBadge status={value as Service['status']} /> : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {filteredServices.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelect={setSelectedService}
              popularity={popularity.get(service.id) ?? 0}
              compareMode={compareIds.length > 0}
              compareSelected={compareIds.includes(service.id)}
              onToggleCompare={() => handleToggleCompare(service.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Search}
            title="Sin resultados"
            description="No se encontraron servicios con los filtros seleccionados."
          />
        </div>
      )}

      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          popularity={popularity.get(selectedService.id) ?? 0}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  )
}