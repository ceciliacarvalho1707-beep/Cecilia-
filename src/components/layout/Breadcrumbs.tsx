import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-[var(--color-ink-faint)]">
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !last ? (
              <Link to={item.href} className="transition hover:text-[var(--color-ink-soft)]">
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'text-[var(--color-ink-soft)]' : ''}>{item.label}</span>
            )}
            {!last && <ChevronRight className="size-3.5" />}
          </span>
        )
      })}
    </nav>
  )
}
