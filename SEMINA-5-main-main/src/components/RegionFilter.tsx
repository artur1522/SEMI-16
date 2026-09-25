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
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          value === 'all'
            ? 'border-primary bg-primary text-white dark:border-darkPrimary dark:bg-darkPrimary'
            : 'border-border bg-white text-textSecondary hover:text-textPrimary dark:border-darkBorder dark:bg-darkCard dark:text-darkTextSecondary dark:hover:text-darkTextPrimary'
        }`}
      >
        Todas
      </button>
      {regions.map((region) => (
        <button
          key={region.id}
          type="button"
          onClick={() => onChange(region.id)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            value === region.id
              ? 'border-primary bg-primary text-white dark:border-darkPrimary dark:bg-darkPrimary'
              : 'border-border bg-white text-textSecondary hover:text-textPrimary dark:border-darkBorder dark:bg-darkCard dark:text-darkTextSecondary dark:hover:text-darkTextPrimary'
          }`}
        >
          {region.name}
        </button>
      ))}
    </div>
  )
}