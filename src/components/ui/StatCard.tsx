import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  href,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  detail: string
  href: string
}) {
  return (
    <Link
      to={href}
      className="group flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] p-5 transition hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-panel)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-overlay)] text-[var(--color-gold-soft)]">
          <Icon className="size-4.5" />
        </span>
        <span className="font-serif-display text-3xl font-semibold text-[var(--color-ink)]">{value}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-ink-soft)] group-hover:text-[var(--color-gold-soft)]">{label}</p>
        <p className="text-xs text-[var(--color-ink-faint)]">{detail}</p>
      </div>
    </Link>
  )
}
