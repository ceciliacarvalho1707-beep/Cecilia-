import type { RelationGroup } from '../../data/universe'
import { RelationChip } from './RelationChip'

export function RelationGroups({ groups, title = '🔗 Conexões' }: { groups: RelationGroup[]; title?: string }) {
  if (groups.length === 0) return null

  return (
    <section className="mt-10 border-t border-[var(--color-border-soft)] pt-7">
      <h2 className="mb-4 font-serif-display text-xl font-semibold text-[var(--color-ink)]">{title}</h2>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.type}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
              {group.icon} {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <RelationChip key={item.id} title={item.title} icon={item.icon} href={item.href} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
