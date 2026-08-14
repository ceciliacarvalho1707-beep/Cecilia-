import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Block, Campaign, Entity, EntityType } from '../types'
import { seedCampaigns, seedEntities, typeLabels, typeToPath } from '../data/universe'

const STORAGE_KEY = 'meu-universo:data'
const STORAGE_VERSION = 1

interface PersistedState {
  version: number
  campaigns: Campaign[]
  entities: Entity[]
}

function loadInitialState(): { campaigns: Campaign[]; entities: Entity[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: PersistedState = JSON.parse(raw)
      if (parsed.version === STORAGE_VERSION && Array.isArray(parsed.campaigns) && Array.isArray(parsed.entities)) {
        return { campaigns: parsed.campaigns, entities: parsed.entities }
      }
    }
  } catch {
    // fall through to seed data
  }
  return { campaigns: seedCampaigns, entities: seedEntities }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function generateId(type: string): string {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`
}

export interface RelationRef {
  id: string
  type: EntityType
  title: string
  icon: string
  href: string
}

export interface RelationGroup {
  type: EntityType
  label: string
  icon: string
  items: RelationRef[]
}

interface UniverseContextValue {
  campaigns: Campaign[]
  entities: Entity[]

  getEntity: (id: string) => Entity | undefined
  getCampaign: (id: string) => Campaign | undefined
  getEntitiesByType: (type: EntityType) => Entity[]
  getEntitiesByCampaign: (campaignId: string, type?: EntityType) => Entity[]
  resolveRelation: (id: string) => RelationRef | null
  getGroupedRelations: (id: string) => RelationGroup[]

  updateEntityMeta: (id: string, patch: Partial<Entity>) => void
  setEntityBlocks: (id: string, blocks: Block[]) => void
  updateCampaignMeta: (id: string, patch: Partial<Campaign>) => void
  setCampaignBlocks: (id: string, blocks: Block[]) => void
  addRelation: (id: string, targetId: string) => void
  removeRelation: (id: string, targetId: string) => void
  createPage: (type: EntityType, campaignId?: string) => string
  createCampaign: () => string
}

const UniverseContext = createContext<UniverseContextValue | null>(null)

export function UniverseProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadInitialState().campaigns)
  const [entities, setEntities] = useState<Entity[]>(() => loadInitialState().entities)

  useEffect(() => {
    const payload: PersistedState = { version: STORAGE_VERSION, campaigns, entities }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [campaigns, entities])

  const value = useMemo<UniverseContextValue>(() => {
    const getEntity = (id: string) => entities.find((e) => e.id === id)
    const getCampaign = (id: string) => campaigns.find((c) => c.id === id)

    const resolveRelation = (id: string): RelationRef | null => {
      const entity = getEntity(id)
      if (entity) {
        return { id: entity.id, type: entity.type, title: entity.title || 'Sem título', icon: entity.icon, href: `/${typeToPath(entity.type)}/${entity.id}` }
      }
      const campaign = getCampaign(id)
      if (campaign) {
        return { id: campaign.id, type: 'campaign', title: campaign.title || 'Sem título', icon: campaign.icon, href: `/campanhas/${campaign.id}` }
      }
      return null
    }

    const getIncomingRelationIds = (id: string): string[] => {
      const fromEntities = entities.filter((e) => e.relations?.includes(id)).map((e) => e.id)
      const fromCampaigns = campaigns.filter((c) => c.relations?.includes(id)).map((c) => c.id)
      const fromMembership = getCampaign(id) ? entities.filter((e) => e.campaignId === id).map((e) => e.id) : []
      return [...fromEntities, ...fromCampaigns, ...fromMembership]
    }

    const getGroupedRelations = (id: string): RelationGroup[] => {
      const outgoing = getEntity(id)?.relations ?? getCampaign(id)?.relations ?? []
      const allIds = Array.from(new Set([...outgoing, ...getIncomingRelationIds(id)])).filter((relId) => relId !== id)

      const groups = new Map<EntityType, RelationGroup>()
      for (const relId of allIds) {
        const ref = resolveRelation(relId)
        if (!ref) continue
        if (!groups.has(ref.type)) {
          const info = typeLabels[ref.type]
          groups.set(ref.type, { type: ref.type, label: info.plural, icon: info.icon, items: [] })
        }
        groups.get(ref.type)!.items.push(ref)
      }
      return Array.from(groups.values())
    }

    return {
      campaigns,
      entities,
      getEntity,
      getCampaign,
      getEntitiesByType: (type) => entities.filter((e) => e.type === type),
      getEntitiesByCampaign: (campaignId, type) => entities.filter((e) => e.campaignId === campaignId && (!type || e.type === type)),
      resolveRelation,
      getGroupedRelations,

      updateEntityMeta: (id, patch) => {
        setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: today() } : e)))
      },
      setEntityBlocks: (id, blocks) => {
        setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, blocks, updatedAt: today() } : e)))
      },
      updateCampaignMeta: (id, patch) => {
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: today() } : c)))
      },
      setCampaignBlocks: (id, blocks) => {
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, blocks, updatedAt: today() } : c)))
      },
      addRelation: (id, targetId) => {
        setEntities((prev) => prev.map((e) => (e.id === id && !e.relations?.includes(targetId) ? { ...e, relations: [...(e.relations ?? []), targetId], updatedAt: today() } : e)))
        setCampaigns((prev) => prev.map((c) => (c.id === id && !c.relations?.includes(targetId) ? { ...c, relations: [...(c.relations ?? []), targetId], updatedAt: today() } : c)))
      },
      removeRelation: (id, targetId) => {
        setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, relations: (e.relations ?? []).filter((r) => r !== targetId), updatedAt: today() } : e)))
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, relations: (c.relations ?? []).filter((r) => r !== targetId), updatedAt: today() } : c)))
      },
      createPage: (type, campaignId) => {
        const id = generateId(type)
        const info = typeLabels[type]
        const newEntity: Entity = {
          id,
          type,
          title: '',
          icon: info.icon,
          campaignId,
          status: 'public',
          summary: '',
          updatedAt: today(),
          blocks: [],
        }
        setEntities((prev) => [...prev, newEntity])
        return id
      },
      createCampaign: () => {
        const id = generateId('campanha')
        const newCampaign: Campaign = {
          id,
          title: '',
          subtitle: '',
          icon: '🎭',
          status: 'planejamento',
          summary: '',
          updatedAt: today(),
          blocks: [],
        }
        setCampaigns((prev) => [...prev, newCampaign])
        return id
      },
    }
  }, [campaigns, entities])

  return <UniverseContext.Provider value={value}>{children}</UniverseContext.Provider>
}

export function useUniverse(): UniverseContextValue {
  const ctx = useContext(UniverseContext)
  if (!ctx) throw new Error('useUniverse must be used within a UniverseProvider')
  return ctx
}
