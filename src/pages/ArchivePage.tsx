import { Link } from 'react-router-dom'
import { ArchiveRestore } from 'lucide-react'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { EmptyState } from '../components/ui/EmptyState'
import { useUniverse } from '../store/UniverseStore'
import { typeLabels, typeToPath } from '../data/universe'

export function ArchivePage() {
  const { getArchivedPages, unarchivePage } = useUniverse()
  const { entities, campaigns } = getArchivedPages()
  const items = [
    ...campaigns.map((c) => ({ id: c.id, title: c.title, icon: c.icon, href: `/campanhas/${c.id}`, label: 'Campanha' })),
    ...entities.map((e) => ({ id: e.id, title: e.title, icon: e.icon, href: `/${typeToPath(e.type)}/${e.id}`, label: typeLabels[e.type].singular })),
  ]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Arquivo' }]} />

      <div className="mb-7 flex items-center gap-3">
        <span className="text-2xl">🗑️</span>
        <div>
          <h1 className="font-serif-display text-3xl font-semibold text-[var(--color-ink)]">Arquivo</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">{items.length} páginas arquivadas</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState label="Arquivo" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-raised)] px-4 py-3">
              <span className="text-base">{item.icon}</span>
              <Link to={item.href} className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-gold-soft)]">
                {item.title || 'Sem título'}
              </Link>
              <span className="shrink-0 text-xs text-[var(--color-ink-faint)]">{item.label}</span>
              <button
                type="button"
                onClick={() => unarchivePage(item.id)}
                title="Restaurar"
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-ink-muted)] transition hover:border-[var(--color-gold-dim)] hover:text-[var(--color-gold-soft)]"
              >
                <ArchiveRestore className="size-3.5" />
                Restaurar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
