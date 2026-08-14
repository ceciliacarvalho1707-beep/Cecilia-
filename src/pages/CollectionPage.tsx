import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { EntityCard } from '../components/ui/EntityCard'
import { EmptyState } from '../components/ui/EmptyState'
import { typeLabels } from '../data/universe'
import { useUniverse } from '../store/UniverseStore'
import type { EntityType } from '../types'

export function CollectionPage({ type }: { type: EntityType }) {
  const { getEntitiesByType } = useUniverse()
  const items = getEntitiesByType(type)
  const label = typeLabels[type]

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: label.plural }]} />

      <div className="mb-7 flex items-center gap-3">
        <span className="text-2xl">{label.icon}</span>
        <div>
          <h1 className="font-serif-display text-3xl font-semibold text-[var(--color-ink)]">{label.plural}</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">{items.length} {items.length === 1 ? 'registro' : 'registros'}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState label={label.plural} />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((entity) => (
            <EntityCard key={entity.id} entity={entity} />
          ))}
        </div>
      )}
    </div>
  )
}
