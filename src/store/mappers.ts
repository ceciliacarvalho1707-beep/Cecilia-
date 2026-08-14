import type { Block, BlockType, Campaign, Entity, EntityType, SecretLevel } from '../types'

export interface PageRow {
  id: string
  workspace_id: string
  type: string
  campaign_id: string | null
  title: string
  subtitle: string | null
  icon: string | null
  summary: string | null
  status: SecretLevel
  tags: string[]
  properties: Record<string, unknown>
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface BlockRow {
  id: string
  page_id: string
  type: string
  level: SecretLevel
  position: number
  content: Record<string, unknown>
}

// content jsonb holds every field the block has beyond id/type/level — e.g. {text}, {items},
// {icon,text}, {url,caption}, {targetId}. Spreading it back on read is enough; no per-type switch needed.
export function rowToBlock(row: BlockRow): Block {
  return { id: row.id, type: row.type as BlockType, level: row.level, ...row.content } as Block
}

export function blockToContent(block: Block): Record<string, unknown> {
  const { id: _id, type: _type, level: _level, ...rest } = block
  return rest
}

export function rowToEntity(row: PageRow, blocks: Block[], relations: string[]): Entity {
  const props = row.properties ?? {}
  return {
    id: row.id,
    type: row.type as EntityType,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    icon: row.icon ?? '📄',
    campaignId: row.campaign_id ?? undefined,
    status: row.status,
    tags: row.tags ?? [],
    element: typeof props.element === 'string' ? props.element : undefined,
    summary: row.summary ?? '',
    updatedAt: row.updated_at.slice(0, 10),
    archivedAt: row.archived_at ?? undefined,
    blocks,
    relations,
  }
}

export function rowToCampaign(row: PageRow, blocks: Block[], relations: string[]): Campaign {
  const props = row.properties as {
    campaignStatus?: Campaign['status']
    players?: number
    sessions?: number
    party?: Campaign['party']
  }
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? '',
    icon: row.icon ?? '🎭',
    status: props?.campaignStatus ?? 'planejamento',
    summary: row.summary ?? '',
    updatedAt: row.updated_at.slice(0, 10),
    archivedAt: row.archived_at ?? undefined,
    players: props?.players,
    sessions: props?.sessions,
    party: props?.party,
    blocks,
    relations,
  }
}

export function entityPatchToRowUpdate(current: Entity, patch: Partial<Entity>) {
  const merged = { ...current, ...patch }
  return {
    title: merged.title,
    subtitle: merged.subtitle ?? null,
    icon: merged.icon,
    campaign_id: merged.campaignId ?? null,
    status: merged.status ?? 'public',
    tags: merged.tags ?? [],
    summary: merged.summary ?? '',
    properties: { element: merged.element },
  }
}

export function campaignPatchToRowUpdate(current: Campaign, patch: Partial<Campaign>) {
  const merged = { ...current, ...patch }
  return {
    title: merged.title,
    subtitle: merged.subtitle ?? '',
    icon: merged.icon,
    summary: merged.summary ?? '',
    properties: {
      campaignStatus: merged.status,
      players: merged.players,
      sessions: merged.sessions,
      party: merged.party,
    },
  }
}
