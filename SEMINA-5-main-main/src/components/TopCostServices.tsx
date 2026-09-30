import { Trophy } from 'lucide-react'
import type { CostItem } from '../types/cloud'

const money = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const RANK_STYLES = ['text-warning', 'text-textSecondary', 'text-accentFrom']

export default function TopCostServices({ items }: { items: CostItem[] }) {
  const top = [...items].sort((a, b) => b.monthlyCost - a.monthlyCost).slice(0, 3)
  const max = top[0]?.monthlyCost ?? 1

  return (
    <section className="section-card">
      <div className="section-head">
        <h3 className="section-title">
          <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
          Top 3 servicios por costo
        </h3>
      </div>

      <ul className="section-body space-y-4">
        {top.map((item, index) => (
          <li key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`text-sm font-bold ${RANK_STYLES[index]}`}>#{index + 1}</span>
                <span className="truncate text-sm font-medium text-textPrimary dark:text-darkTextPrimary">
                  {item.service}
                </span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-textPrimary dark:text-darkTextPrimary">
                {money.format(item.monthlyCost)} USD
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background dark:bg-darkBackground">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accentFrom to-accentTo transition-all duration-300 dark:from-darkAccentFrom dark:to-darkAccentTo"
                style={{ width: `${(item.monthlyCost / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
        {top.length === 0 && (
          <li className="text-center text-sm text-textSecondary dark:text-darkTextSecondary">
            Sin costos en esta región.
          </li>
        )}
      </ul>
    </section>
  )
}
