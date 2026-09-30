import { Globe } from 'lucide-react'
import type { RegionReference } from '../types/cloud'

interface RegionFilterProps {
  value: string
  regions: RegionReference[]
  onChange: (regionId: string) => void
}

export default function RegionFilter({ value, regions, onChange }: RegionFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-textSecondary dark:text-darkTextSecondary">
        <Globe className="h-3.5 w-3.5" />
        Región:
      </span>
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`chip ${value === 'all' ? 'chip-active' : ''}`}
      >
        Todas
      </button>
      {regions.map((region) => (
        <button
          key={region.id}
          type="button"
          onClick={() => onChange(region.id)}
          className={`chip ${value === region.id ? 'chip-active' : ''}`}
        >
          {region.name}
        </button>
      ))}
    </div>
  )
}