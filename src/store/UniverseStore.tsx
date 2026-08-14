import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Block, Campaign, Entity, EntityType } from '../types'
import { typeLabels, typeToPath } from '../data/universe'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthProvider'
import { syncBlocks } from './blockSync'
import { campaignPatchToRowUpdate, entityPatchToRowUpdate, rowToBlock, rowToCampaign, rowToEntity, type BlockRow, type PageRow } from './mappers'

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
  loading: boolean
  workspaceName: string
  campaigns: Campaign[]
  entities: Entity[]

  getEntity: (id: string) => Entity | undefined
  getCampaign: (id: string) => Campaign | undefined
  getEntitiesByType: (type: EntityType) => Entity[]
  getEntitiesByCampaign: (campaignId: string, type?: EntityType) => Entity[]
  getArchivedPages: () => { entities: Entity[]; campaigns: Campaign[] }
  resolveRelation: (id: string) => RelationRef | null
  getGroupedRelations: (id: string) => RelationGroup[]

  updateEntityMeta: (id: string, patch: Partial<Entity>) => void
  setEntityBlocks: (id: string, blocks: Block[]) => void
  updateCampaignMeta: (id: string, patch: Partial<Campaign>) => void
  setCampaignBlocks: (id: string, blocks: Block[]) => void
  addRelation: (id: string, targetId: string) => void
  removeRelation: (id: string, targetId: string) => void
  createPage: (type: EntityType, campaignId?: string) => Promise<string>
  createCampaign: () => Promise<string>
  archivePage: (id: string) => void
  unarchivePage: (id: string) => void
}

const UniverseContext = createContext<UniverseContextValue | null>(null)

export function UniverseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceName, setWorkspaceName] = useState('Meu Universo')

  const workspaceIdRef = useRef<string | null>(null)
  // pageId -> (blockId -> fractional position). Blocks don't carry position in the frontend
  // model, so this is the only place that number lives — populated on load, kept in sync on write.
  const positionsRef = useRef<Map<string, Map<string, number>>>(new Map())

  useEffect(() => {
    if (!user) {
      setEntities([])
      setCampaigns([])
      workspaceIdRef.current = null
      positionsRef.current = new Map()
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    ;(async () => {
      const { data: ws, error: wsError } = await supabase.from('workspaces').select('id, name').limit(1).maybeSingle()
      if (wsError || !ws) {
        console.error('Não foi possível carregar o workspace:', wsError)
        if (!cancelled) setLoading(false)
        return
      }
      if (cancelled) return
      workspaceIdRef.current = ws.id
      setWorkspaceName(ws.name)

      const { data: pageRows, error: pagesError } = await supabase.from('pages').select('*').eq('workspace_id', ws.id)
      if (pagesError) console.error(pagesError)
      const pages = (pageRows ?? []) as PageRow[]
      const pageIds = pages.map((p) => p.id)

      const [{ data: blockRows }, { data: relationRows }] = pageIds.length
        ? await Promise.all([
            supabase.from('blocks').select('*').in('page_id', pageIds).order('position'),
            supabase.from('relations').select('*').in('source_page_id', pageIds),
          ])
        : [{ data: [] as BlockRow[] }, { data: [] as { source_page_id: string; target_page_id: string }[] }]

      if (cancelled) return

      const blocksByPage = new Map<string, Block[]>()
      const posMap = new Map<string, Map<string, number>>()
      for (const row of (blockRows ?? []) as BlockRow[]) {
        if (!blocksByPage.has(row.page_id)) {
          blocksByPage.set(row.page_id, [])
          posMap.set(row.page_id, new Map())
        }
        blocksByPage.get(row.page_id)!.push(rowToBlock(row))
        posMap.get(row.page_id)!.set(row.id, row.position)
      }
      positionsRef.current = posMap

      const relationsByPage = new Map<string, string[]>()
      for (const row of relationRows ?? []) {
        if (!relationsByPage.has(row.source_page_id)) relationsByPage.set(row.source_page_id, [])
        relationsByPage.get(row.source_page_id)!.push(row.target_page_id)
      }

      const newEntities: Entity[] = []
      const newCampaigns: Campaign[] = []
      for (const row of pages) {
        const blocks = blocksByPage.get(row.id) ?? []
        const relations = relationsByPage.get(row.id) ?? []
        if (row.type === 'campaign') newCampaigns.push(rowToCampaign(row, blocks, relations))
        else newEntities.push(rowToEntity(row, blocks, relations))
      }

      setEntities(newEntities)
      setCampaigns(newCampaigns)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id])

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

    function getPositions(pageId: string): Map<string, number> {
      if (!positionsRef.current.has(pageId)) positionsRef.current.set(pageId, new Map())
      return positionsRef.current.get(pageId)!
    }

    async function touchPage(id: string) {
      const { error } = await supabase.from('pages').update({ updated_at: new Date().toISOString() }).eq('id', id)
      if (error) console.error(error)
    }

    return {
      loading,
      workspaceName,
      campaigns,
      entities,
      getEntity,
      getCampaign,
      getEntitiesByType: (type) => entities.filter((e) => e.type === type && !e.archivedAt),
      getEntitiesByCampaign: (campaignId, type) => entities.filter((e) => e.campaignId === campaignId && !e.archivedAt && (!type || e.type === type)),
      getArchivedPages: () => ({
        entities: entities.filter((e) => e.archivedAt),
        campaigns: campaigns.filter((c) => c.archivedAt),
      }),
      resolveRelation,
      getGroupedRelations,

      updateEntityMeta: (id, patch) => {
        const current = getEntity(id)
        if (!current) return
        setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
        supabase
          .from('pages')
          .update(entityPatchToRowUpdate(current, patch))
          .eq('id', id)
          .then(({ error }) => error && console.error(error))
      },

      setEntityBlocks: (id, blocks) => {
        const current = getEntity(id)
        if (!current) return
        const oldBlocks = current.blocks
        setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, blocks } : e)))
        ;(async () => {
          await syncBlocks(supabase, id, oldBlocks, blocks, getPositions(id))
          await touchPage(id)
        })().catch(console.error)
      },

      updateCampaignMeta: (id, patch) => {
        const current = getCampaign(id)
        if (!current) return
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
        supabase
          .from('pages')
          .update(campaignPatchToRowUpdate(current, patch))
          .eq('id', id)
          .then(({ error }) => error && console.error(error))
      },

      setCampaignBlocks: (id, blocks) => {
        const current = getCampaign(id)
        if (!current) return
        const oldBlocks = current.blocks ?? []
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, blocks } : c)))
        ;(async () => {
          await syncBlocks(supabase, id, oldBlocks, blocks, getPositions(id))
          await touchPage(id)
        })().catch(console.error)
      },

      addRelation: (id, targetId) => {
        setEntities((prev) => prev.map((e) => (e.id === id && !e.relations?.includes(targetId) ? { ...e, relations: [...(e.relations ?? []), targetId] } : e)))
        setCampaigns((prev) => prev.map((c) => (c.id === id && !c.relations?.includes(targetId) ? { ...c, relations: [...(c.relations ?? []), targetId] } : c)))
        supabase
          .from('relations')
          .insert({ source_page_id: id, target_page_id: targetId })
          .then(({ error }) => error && console.error(error))
      },

      removeRelation: (id, targetId) => {
        setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, relations: (e.relations ?? []).filter((r) => r !== targetId) } : e)))
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, relations: (c.relations ?? []).filter((r) => r !== targetId) } : c)))
        supabase
          .from('relations')
          .delete()
          .eq('source_page_id', id)
          .eq('target_page_id', targetId)
          .then(({ error }) => error && console.error(error))
      },

      createPage: async (type, campaignId) => {
        const workspaceId = workspaceIdRef.current
        if (!workspaceId) throw new Error('Workspace ainda não carregado')
        const info = typeLabels[type]
        const { data, error } = await supabase
          .from('pages')
          .insert({
            workspace_id: workspaceId,
            type,
            campaign_id: campaignId ?? null,
            title: '',
            icon: info.icon,
            status: 'public',
            tags: [],
            summary: '',
            properties: {},
            created_by: user?.id,
          })
          .select()
          .single()
        if (error || !data) throw error ?? new Error('Falha ao criar página')
        setEntities((prev) => [...prev, rowToEntity(data as PageRow, [], [])])
        return data.id as string
      },

      createCampaign: async () => {
        const workspaceId = workspaceIdRef.current
        if (!workspaceId) throw new Error('Workspace ainda não carregado')
        const { data, error } = await supabase
          .from('pages')
          .insert({
            workspace_id: workspaceId,
            type: 'campaign',
            title: '',
            icon: '🎭',
            status: 'public',
            tags: [],
            summary: '',
            properties: { campaignStatus: 'planejamento', players: 0, sessions: 0, party: [] },
            created_by: user?.id,
          })
          .select()
          .single()
        if (error || !data) throw error ?? new Error('Falha ao criar campanha')
        setCampaigns((prev) => [...prev, rowToCampaign(data as PageRow, [], [])])
        return data.id as string
      },

      archivePage: (id) => {
        const now = new Date().toISOString()
        setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, archivedAt: now } : e)))
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, archivedAt: now } : c)))
        supabase
          .from('pages')
          .update({ archived_at: now })
          .eq('id', id)
          .then(({ error }) => error && console.error(error))
      },

      unarchivePage: (id) => {
        setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, archivedAt: undefined } : e)))
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, archivedAt: undefined } : c)))
        supabase
          .from('pages')
          .update({ archived_at: null })
          .eq('id', id)
          .then(({ error }) => error && console.error(error))
      },
    }
  }, [campaigns, entities, loading, workspaceName, user])

  return <UniverseContext.Provider value={value}>{children}</UniverseContext.Provider>
}

export function useUniverse(): UniverseContextValue {
  const ctx = useContext(UniverseContext)
  if (!ctx) throw new Error('useUniverse must be used within a UniverseProvider')
  return ctx
}
