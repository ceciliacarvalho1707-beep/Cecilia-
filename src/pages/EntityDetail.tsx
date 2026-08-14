import { useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { RelationGroups } from '../components/ui/RelationGroups'
import { MetaBar } from '../editor/MetaBar'
import { EditableText } from '../editor/EditableText'
import { BlockEditor } from '../editor/BlockEditor'
import { useDebouncedCommit } from '../hooks/useDebouncedCommit'
import { useUniverse } from '../store/UniverseStore'
import { typeLabels, typeToPath } from '../data/universe'
import type { Block, Entity, EntityType, SecretLevel } from '../types'
import { NotFound } from './NotFound'

export function EntityDetail({ type }: { type: EntityType }) {
  const { id } = useParams()
  const location = useLocation()
  const { getEntity, getGroupedRelations } = useUniverse()
  const entity = id ? getEntity(id) : undefined

  if (!entity || entity.type !== type) return <NotFound />

  const label = typeLabels[entity.type]
  const relationGroups = getGroupedRelations(entity.id)
  const focusTitle = Boolean((location.state as { focusTitle?: boolean } | null)?.focusTitle)

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Início', href: '/' },
          { label: label.plural, href: `/${typeToPath(entity.type)}` },
          { label: entity.title || 'Sem título' },
        ]}
      />

      <EntityDocument key={entity.id} entity={entity} label={label} autoFocusTitle={focusTitle} />

      <RelationGroups groups={relationGroups} />
    </div>
  )
}

function EntityDocument({
  entity,
  label,
  autoFocusTitle,
}: {
  entity: Entity
  label: { singular: string; plural: string; icon: string }
  autoFocusTitle: boolean
}) {
  const { updateEntityMeta, setEntityBlocks } = useUniverse()
  const [title, setTitle] = useState(entity.title)
  const [blocks, setBlocks] = useState<Block[]>(entity.blocks)

  useDebouncedCommit(title, (t) => updateEntityMeta(entity.id, { title: t || 'Sem título' }))
  useDebouncedCommit(blocks, (b) => setEntityBlocks(entity.id, b))

  return (
    <div>
      <MetaBar
        typeLabel={label.singular}
        typeIcon={label.icon}
        status={entity.status ?? 'public'}
        onChangeStatus={(status: SecretLevel) => updateEntityMeta(entity.id, { status })}
        campaignId={entity.campaignId}
        onChangeCampaign={(campaignId) => updateEntityMeta(entity.id, { campaignId })}
        tags={entity.tags ?? []}
        onChangeTags={(tags) => updateEntityMeta(entity.id, { tags })}
      />

      <EditableText
        value={title}
        onChange={setTitle}
        autoFocus={autoFocusTitle}
        placeholder="Sem título"
        className="mb-6 font-serif-display text-4xl font-semibold text-[var(--color-ink)] sm:text-[42px]"
      />

      <BlockEditor ownerId={entity.id} blocks={blocks} onChange={setBlocks} />
    </div>
  )
}
