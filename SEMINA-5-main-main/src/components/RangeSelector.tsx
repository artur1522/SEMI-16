export type RangeKey = '24h' | '7d' | '30d'

const OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' }
]

interface RangeSelectorProps {
  value: RangeKey
  onChange: (range: RangeKey) => void
}

export default function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1 dark:border-darkBorder dark:bg-darkBackground">
      {OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            value === option.key
              ? 'bg-primary text-white dark:bg-darkPrimary'
              : 'text-textSecondary hover:text-textPrimary dark:text-darkTextSecondary dark:hover:text-darkTextPrimary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}