export type SecretLevel = 'public' | 'master' | 'secret'

export type EntityType =
  | 'page'
  | 'campaign'
  | 'monster'
  | 'antagonist'
  | 'npc'
  | 'location'
  | 'document'
  | 'clue'
  | 'experiment'
  | 'organization'
  | 'idea'

// ── Document blocks ──────────────────────────────
// Every page (entity or campaign) is a small document made of these. Each block
// carries its own SecretLevel so a section can be hidden independently of the page.

export type BlockType =
  | 'heading2'
  | 'heading3'
  | 'paragraph'
  | 'bulleted_list'
  | 'numbered_list'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'image'
  | 'page_link'
  | 'relation'

interface BlockBase {
  id: string
  level: SecretLevel
}

export interface TextBlock extends BlockBase {
  type: 'heading2' | 'heading3' | 'paragraph' | 'quote'
  text: string
}

export interface ListItem {
  id: string
  text: string
}

export interface ListBlock extends BlockBase {
  type: 'bulleted_list' | 'numbered_list'
  items: ListItem[]
}

export interface DividerBlock extends BlockBase {
  type: 'divider'
}

export interface CalloutBlock extends BlockBase {
  type: 'callout'
  icon: string
  text: string
}

export interface ImageBlock extends BlockBase {
  type: 'image'
  url: string
  caption: string
}

export interface PageLinkBlock extends BlockBase {
  type: 'page_link'
  targetId: string
}

/** Renders the page's own `relations` inline in the document flow — reading and writing the same array the backlinks graph uses. */
export interface RelationBlock extends BlockBase {
  type: 'relation'
}

export type Block =
  | TextBlock
  | ListBlock
  | DividerBlock
  | CalloutBlock
  | ImageBlock
  | PageLinkBlock
  | RelationBlock

export interface Entity {
  id: string
  type: EntityType
  title: string
  subtitle?: string
  icon: string
  campaignId?: string
  status?: SecretLevel
  tags?: string[]
  element?: string
  summary: string
  updatedAt: string
  archivedAt?: string
  blocks: Block[]
  relations?: string[]
}

export interface PartyMember {
  name: string
  role: string
}

export interface Campaign {
  id: string
  title: string
  subtitle: string
  icon: string
  status: 'ativa' | 'planejamento' | 'concluída'
  summary: string
  updatedAt: string
  archivedAt?: string
  players?: number
  sessions?: number
  party?: PartyMember[]
  blocks?: Block[]
  /** Links to entities beyond what already belongs to this campaign via campaignId — e.g. an org or antagonist that spans campaigns. */
  relations?: string[]
}
