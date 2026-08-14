export type SecretLevel = 'public' | 'master' | 'secret'

export type EntityType =
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

export interface Block {
  heading: string
  level: SecretLevel
  content: string
}

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
  players?: number
  sessions?: number
  party?: PartyMember[]
}
