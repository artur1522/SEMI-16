import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Tone } from '../../data/cloudOpsData'

/* ── Badges ─────────────────────────────────────────────────────────────── */

const TONE_CLASS: Record<Tone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
  accent: 'badge-accent'
}

export function Badge({
  tone = 'neutral',
  children,
  dot = false,
  className = ''
}: {
  tone?: Tone
  children: ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span className={`badge ${TONE_CLASS[tone]} ${className}`}>
      {dot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

/** Etiqueta de estado corta y uniforme (servicios, regiones, proyectos). */
export function Tag({
  children,
  tone = 'neutral',
  className = ''
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return <Badge tone={tone} className={className}>{children}</Badge>
}

/* ── Botones ────────────────────────────────────────────────────────────── */

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'ghost'
  | 'danger'

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger'
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  return (
    <button
      type={type}
      className={`btn ${BUTTON_VARIANT[variant]} ${sizeClass} ${className}`}
      {...rest}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />}
      {children}
    </button>
  )
}

/* ── Encabezados ────────────────────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  badge
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
}) {
  return (
    <header className="page-header animate-fade-up">
      <div className="min-w-0">
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">{title}</h1>
          {badge}
        </div>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {actions && <div className="page-actions shrink-0">{actions}</div>}
    </header>
  )
}

export function Section({
  title,
  icon: Icon,
  description,
  actions,
  badge,
  children,
  className = '',
  bodyClassName = ''
}: {
  title?: string
  icon?: LucideIcon
  description?: ReactNode
  actions?: ReactNode
  badge?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={`section-card ${className}`}>
      {(title || actions) && (
        <div className="section-head">
          <div className="min-w-0">
            {title && (
              <h2 className="section-title">
                {Icon && (
                  <span className="icon-tile h-8 w-8 bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary">
                    <Icon className="h-4 w-4" />
                  </span>
                )}
                {title}
                {badge}
              </h2>
            )}
            {description && <p className="section-subtitle">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`section-body ${bodyClassName}`}>{children}</div>
    </section>
  )
}

/* ── Píldoras de filtro ─────────────────────────────────────────────────── */

export function ChipTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel
}: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={`chip ${value === option.value ? 'chip-active' : ''}`}
        >
          {option.label}
          {typeof option.count === 'number' && <span className="opacity-70">({option.count})</span>}
        </button>
      ))}
    </div>
  )
}

/* ── Formularios ────────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  children,
  className = ''
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

export function TextInput({
  invalid,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={`input ${invalid ? 'input-error' : ''} ${className}`} {...rest} />
}

export function SelectInput({
  invalid,
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select className={`select ${invalid ? 'input-error' : ''} ${className}`} {...rest}>
      {children}
    </select>
  )
}

export function TextArea({
  invalid,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={`textarea ${invalid ? 'input-error' : ''} ${className}`} {...rest} />
}

/* ── Métricas y estados ─────────────────────────────────────────────────── */

export function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'info',
  className = ''
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: LucideIcon
  tone?: Tone
  className?: string
}) {
  const iconTone: Record<Tone, string> = {
    success: 'bg-success/10 text-success dark:bg-darkSuccess/10 dark:text-darkSuccess',
    warning: 'bg-warning/10 text-warning dark:bg-darkWarning/10 dark:text-darkWarning',
    danger: 'bg-danger/10 text-danger dark:bg-darkDanger/10 dark:text-darkDanger',
    info: 'bg-primary/10 text-primary dark:bg-darkPrimary/10 dark:text-darkPrimary',
    neutral: 'bg-textSecondary/10 text-textSecondary dark:bg-darkTextSecondary/10 dark:text-darkTextSecondary',
    accent: 'bg-accentFrom/10 text-accentFrom dark:bg-darkAccentFrom/10 dark:text-darkAccentFrom'
  }

  return (
    <div className={`card-tile flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <p className="metric-label">{label}</p>
        <p className="metric-value">{value}</p>
        {hint && <p className="mt-1 text-xs text-textSecondary dark:text-darkTextSecondary">{hint}</p>}
      </div>
      {Icon && (
        <span className={`icon-tile ${iconTone[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="icon-tile mx-auto bg-textSecondary/10 text-textSecondary dark:bg-darkTextSecondary/10 dark:text-darkTextSecondary">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="mt-3 font-semibold text-textPrimary dark:text-darkTextPrimary">{title}</p>
      {description && <p className="mt-1">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

/** Barra de progreso uniforme (presupuestos, scores, utilidad). */
export function ProgressBar({
  percent,
  tone = 'info',
  className = ''
}: {
  percent: number
  tone?: Tone
  className?: string
}) {
  const barTone: Record<Tone, string> = {
    success: 'bg-success dark:bg-darkSuccess',
    warning: 'bg-warning dark:bg-darkWarning',
    danger: 'bg-danger dark:bg-darkDanger',
    info: 'bg-primary dark:bg-darkPrimary',
    neutral: 'bg-textSecondary dark:bg-darkTextSecondary',
    accent: 'bg-gradient-to-r from-accentFrom to-accentTo dark:from-darkAccentFrom dark:to-darkAccentTo'
  }
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-background dark:bg-darkBackground ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${barTone[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

/** Etiqueta clave/valor alineada para fichas de datos. */
export function KeyValue({
  label,
  children,
  mono = false
}: {
  label: string
  children: ReactNode
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-semibold text-textPrimary dark:text-darkTextPrimary ${
          mono ? 'font-mono' : ''
        }`}
      >
        {children}
      </p>
    </div>
  )
}
