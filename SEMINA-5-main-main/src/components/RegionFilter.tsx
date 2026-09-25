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
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/40 ${
          value === 'all'
            ? 'border-transparent bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 text-white shadow-[0_0_12px_rgba(124,58,237,0.18)] dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_12px_rgba(139,92,246,0.24)] dark:focus:ring-darkAccentFrom/40'
            : 'border-border bg-white text-textSecondary hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-textPrimary dark:border-darkBorder dark:bg-darkCard dark:text-darkTextSecondary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkTextPrimary dark:focus:ring-darkAccentFrom/40'
        }`}
      >
        Todas
      </button>
      {regions.map((region) => (
        <button
          key={region.id}
          type="button"
          onClick={() => onChange(region.id)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/40 ${
            value === region.id
              ? 'border-transparent bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 text-white shadow-[0_0_12px_rgba(124,58,237,0.18)] dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_12px_rgba(139,92,246,0.24)] dark:focus:ring-darkAccentFrom/40'
              : 'border-border bg-white text-textSecondary hover:border-accentFrom/40 hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-textPrimary dark:border-darkBorder dark:bg-darkCard dark:text-darkTextSecondary dark:hover:border-darkAccentFrom/40 dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkTextPrimary dark:focus:ring-darkAccentFrom/40'
          }`}
        >
          {region.name}
        </button>
      ))}
    </div>
  )
}