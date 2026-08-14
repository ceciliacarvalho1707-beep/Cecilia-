import { useParams, Link } from 'react-router-dom'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { SecretBadge } from '../components/ui/SecretBadge'
import { SecretBlock } from '../components/ui/SecretBlock'
import { RelationGroups } from '../components/ui/RelationGroups'
import { formatDate } from '../components/ui/EntityCard'
import { getCampaign, getEntity, getGroupedRelations, typeLabels, typeToPath } from '../data/universe'
import type { EntityType } from '../types'
import { NotFound } from './NotFound'

export function EntityDetail({ type }: { type: EntityType }) {
  const { id } = useParams()
  const entity = id ? getEntity(id) : undefined

  if (!entity || entity.type !== type) return <NotFound />

  const label = typeLabels[entity.type]
  const campaign = entity.campaignId ? getCampaign(entity.campaignId) : undefined
  const relationGroups = getGroupedRelations(entity.id)

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: label.plural, href: `/${typeToPath(entity.type)}` },
          { label: entity.title },
        ]}
      />

      <header className="mb-8 border-b border-[var(--color-border-soft)] pb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--color-border-soft)] px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-[var(--color-ink-faint)]">
            {label.icon} {label.singular}
          </span>
          {entity.status && <SecretBadge level={entity.status} />}
          {entity.element && (
            <span className="rounded-full border border-[var(--color-border-soft)] px-2.5 py-0.5 text-[11px] text-[var(--color-ink-muted)]">
              {entity.element}
            </span>
          )}
          {campaign && (
            <Link
              to={`/campanhas/${campaign.id}`}
              className="rounded-full border border-[var(--color-border-soft)] px-2.5 py-0.5 text-[11px] text-[var(--color-ink-muted)] hover:text-[var(--color-gold-soft)]"
            >
              🎭 {campaign.title}
            </Link>
          )}
        </div>

        <h1 className="font-serif-display text-4xl font-semibold text-[var(--color-ink)]">
          <span className="mr-2">{entity.icon}</span>
          {entity.title}
        </h1>
        {entity.subtitle && <p className="mt-1.5 text-lg text-[var(--color-ink-muted)]">{entity.subtitle}</p>}

        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">{entity.summary}</p>

        <p className="mt-4 text-xs text-[var(--color-ink-faint)]">Atualizado em {formatDate(entity.updatedAt)}</p>
      </header>

      {entity.blocks.length > 0 && (
        <div className="space-y-4">
          {entity.blocks.map((block) => (
            <SecretBlock key={block.heading} block={block} />
          ))}
        </div>
      )}

      <RelationGroups groups={relationGroups} />
    </div>
  )
}
