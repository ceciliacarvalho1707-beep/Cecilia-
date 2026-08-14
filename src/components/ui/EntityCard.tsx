import { Link } from 'react-router-dom'
import type { Entity } from '../../types'
import { SecretBadge } from './SecretBadge'
import { typeToPath } from '../../data/universe'

export function EntityCard({ entity }: { entity: Entity }) {
  return (
    <Link
      to={`/${typeToPath(entity.type)}/${entity.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-panel)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{entity.icon}</span>
          <div>
            <h3 className="font-serif-display text-lg font-semibold leading-tight text-[var(--color-ink)] group-hover:text-[var(--color-gold-soft)]">
              {entity.title || 'Sem título'}
            </h3>
            {entity.subtitle && <p className="text-xs text-[var(--color-ink-muted)]">{entity.subtitle}</p>}
          </div>
        </div>
        {entity.status && <SecretBadge level={entity.status} size="xs" />}
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{entity.summary}</p>
      <div className="mt-auto flex items-center justify-between pt-1 text-xs text-[var(--color-ink-faint)]">
        {entity.element && <span className="rounded-full border border-[var(--color-border-soft)] px-2 py-0.5">{entity.element}</span>}
        <span className="ml-auto">{formatDate(entity.updatedAt)}</span>
      </div>
    </Link>
  )
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
