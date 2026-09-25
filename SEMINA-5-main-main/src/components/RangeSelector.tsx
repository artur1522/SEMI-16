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
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-accentFrom/40 dark:focus:ring-darkAccentFrom/40 ${
            value === option.key
              ? 'bg-slate-950 bg-gradient-to-r from-accentFrom/90 to-accentTo/90 text-white shadow-[0_0_12px_rgba(124,58,237,0.18)] dark:from-darkAccentFrom/90 dark:to-darkAccentTo/90 dark:shadow-[0_0_12px_rgba(139,92,246,0.24)] dark:focus:ring-darkAccentFrom/40'
              : 'text-textSecondary hover:bg-gradient-to-r hover:from-accentFrom/10 hover:to-accentTo/10 hover:text-textPrimary dark:text-darkTextSecondary dark:hover:from-darkAccentFrom/15 dark:hover:to-darkAccentTo/15 dark:hover:text-darkTextPrimary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}