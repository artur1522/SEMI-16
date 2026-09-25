import { Trophy } from 'lucide-react'
import type { CostItem } from '../types/cloud'

const currency = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
})

const RANK_STYLES = ['text-amber-400', 'text-slate-400', 'text-orange-400']

export default function TopCostServices({ items }: { items: CostItem[] }) {
  const top = [...items].sort((a, b) => b.monthlyCost - a.monthlyCost).slice(0, 3)
  const max = top[0]?.monthlyCost ?? 1

  return (
    <article className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-darkBorder dark:bg-darkCard">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary dark:text-darkPrimary" />
        <h3 className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
          Top 3 servicios por costo
        </h3>
      </div>

      <ul className="mt-4 space-y-3">
        {top.map((item, index) => (
          <li key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold ${RANK_STYLES[index]}`}>#{index + 1}</span>
                <span className="text-sm font-medium text-textPrimary dark:text-darkTextPrimary">
                  {item.service}
                </span>
              </div>
              <span className="text-sm font-semibold text-textPrimary dark:text-darkTextPrimary">
                {currency.format(item.monthlyCost)}
                <span className="text-xs font-normal text-textSecondary dark:text-darkTextSecondary">
                  {' '}
                  /mes
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-background dark:bg-darkBackground">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300 dark:bg-darkPrimary"
                style={{ width: `${(item.monthlyCost / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
        {top.length === 0 && (
          <li className="py-4 text-center text-sm text-textSecondary dark:text-darkTextSecondary">
            Sin costos en esta región.
          </li>
        )}
      </ul>
    </article>
  )
}