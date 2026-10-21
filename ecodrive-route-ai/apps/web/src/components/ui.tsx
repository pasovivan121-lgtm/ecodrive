import * as React from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-[#04120c] hover:bg-brand-2 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.8)] disabled:hover:bg-brand',
  secondary: 'bg-surface-2 text-ink border border-line hover:border-brand/40 hover:text-brand-2',
  ghost: 'text-muted hover:text-ink hover:bg-white/5',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
  outline: 'border border-line text-ink hover:border-brand/50 hover:text-brand-2 bg-transparent',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-sm gap-2',
}

export interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ className, variant = 'primary', size = 'md', ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...rest}
    />
  )
}

export function Card({ className, ...rest }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line/80 bg-surface/80 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.9)] backdrop-blur',
        className
      )}
      {...rest}
    />
  )
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  eyebrow?: string
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand/80">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

type Tone = 'brand' | 'neutral' | 'warn' | 'danger' | 'info'

const BADGE_TONES: Record<Tone, string> = {
  brand: 'bg-brand/12 text-brand-2 border-brand/25',
  neutral: 'bg-white/5 text-muted border-line',
  warn: 'bg-warn/12 text-warn border-warn/25',
  danger: 'bg-danger/12 text-danger border-danger/25',
  info: 'bg-sky-400/10 text-sky-300 border-sky-400/25',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  icon,
  tone = 'brand',
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  icon?: React.ReactNode
  tone?: Tone
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        {icon ? (
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border',
              BADGE_TONES[tone]
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-ink">
        {value}
        {unit ? <span className="ml-1 text-sm font-normal text-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs leading-snug text-muted/80">{hint}</p> : null}
    </Card>
  )
}

export function Input({ className, ...rest }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-line bg-canvas/70 px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand/60 focus:ring-2 focus:ring-brand/15 disabled:opacity-60',
        className
      )}
      {...rest}
    />
  )
}

export function Select({ className, children, ...rest }: React.ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-11 w-full appearance-none rounded-xl border border-line bg-canvas/70 px-3.5 text-sm text-ink outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/15 disabled:opacity-60',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs leading-snug text-muted/70">{hint}</span> : null}
    </label>
  )
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warn' | 'danger' | 'success'
  title?: string
  children: React.ReactNode
  className?: string
}) {
  const styles = {
    info: 'border-sky-400/25 bg-sky-400/8 text-sky-100',
    warn: 'border-warn/30 bg-warn/8 text-amber-100',
    danger: 'border-danger/30 bg-danger/8 text-red-100',
    success: 'border-brand/30 bg-brand/8 text-emerald-50',
  }[tone]
  const Icon = { info: Info, warn: AlertTriangle, danger: XCircle, success: CheckCircle2 }[tone]
  return (
    <div className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', styles, className)} role="status">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title ? <p className="mb-0.5 font-medium">{title}</p> : null}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface/40 px-6 py-10 text-center">
      {icon ? <div className="text-muted">{icon}</div> : null}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </span>
  )
}

export function InlineStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-ink">{value}</p>
    </div>
  )
}
