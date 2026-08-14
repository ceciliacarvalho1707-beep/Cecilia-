import { Link } from 'react-router-dom'

export function RelationChip({ title, icon, href }: { title: string; icon: string; href: string }) {
  return (
    <Link
      to={href}
      className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-raised)] px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition hover:border-[var(--color-gold)]/40 hover:text-[var(--color-gold-soft)]"
    >
      <span className="text-[13px] opacity-80">{icon}</span>
      {title}
    </Link>
  )
}
