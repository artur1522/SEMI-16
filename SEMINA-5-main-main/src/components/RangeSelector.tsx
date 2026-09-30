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
    <div className="segmented" role="tablist" aria-label="Rango de tiempo">
      {OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          role="tab"
          aria-selected={value === option.key}
          onClick={() => onChange(option.key)}
          className={`segmented-item ${value === option.key ? 'segmented-item-active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}