import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { PageSection } from '../components/ui/PageSection'
import { EntityCard } from '../components/ui/EntityCard'
import { SecretBadge } from '../components/ui/SecretBadge'
import { RelationGroups } from '../components/ui/RelationGroups'
import { EditableText } from '../editor/EditableText'
import { BlockEditor } from '../editor/BlockEditor'
import { useDebouncedCommit } from '../hooks/useDebouncedCommit'
import { useUniverse } from '../store/UniverseStore'
import type { Block, Campaign } from '../types'
import { NotFound } from './NotFound'

const STATUS_ORDER: Campaign['status'][] = ['planejamento', 'ativa', 'concluída']
const STATUS_LABEL: Record<Campaign['status'], string> = {
  ativa: 'Em andamento',
  planejamento: 'Em planejamento',
  concluída: 'Concluída',
}
const STATUS_CLASS: Record<Campaign['status'], string> = {
  ativa: 'bg-[var(--color-status-public-bg)] text-[var(--color-status-public)]',
  planejamento: 'bg-[var(--color-status-master-bg)] text-[var(--color-status-master)]',
  concluída: 'bg-[var(--color-overlay)] text-[var(--color-ink-muted)]',
}

export function CampaignDetail() {
  const { id } = useParams()
  const { getCampaign, getEntitiesByCampaign, getEntity, getGroupedRelations } = useUniverse()
  const campaign = id ? getCampaign(id) : undefined

  if (!campaign) return <NotFound />

  const antagonists = getEntitiesByCampaign(campaign.id, 'antagonist')
  const monsters = getEntitiesByCampaign(campaign.id, 'monster')
  const npcs = getEntitiesByCampaign(campaign.id, 'npc')
  const locations = getEntitiesByCampaign(campaign.id, 'location')
  const documents = getEntitiesByCampaign(campaign.id, 'document')
  const clues = getEntitiesByCampaign(campaign.id, 'clue')
  const organizations = getEntitiesByCampaign(campaign.id, 'organization')
  const experiments = getEntitiesByCampaign(campaign.id, 'experiment')
  const secrets = getEntitiesByCampaign(campaign.id).filter((e) => e.status === 'secret')

  // Entities that reference this campaign without belonging to it — e.g. an antagonist whose
  // influence reaches into another campaign. Members shown in the sections above are excluded.
  const externalConnections = getGroupedRelations(campaign.id)
    .map((group) => ({ ...group, items: group.items.filter((item) => getEntity(item.id)?.campaignId !== campaign.id) }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="space-y-9">
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Campanhas', href: '/campanhas' }, { label: campaign.title || 'Sem título' }]} />

      <CampaignOverview key={campaign.id} campaign={campaign} threatCount={antagonists.length + monsters.length} />

      <PageSection id="personagens" icon="👥" title="Personagens">
        {campaign.party?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {campaign.party.map((p) => (
              <div key={p.name} className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-raised)] p-4">
                <p className="text-sm font-medium text-[var(--color-ink-soft)]">{p.name}</p>
                <p className="text-xs text-[var(--color-ink-faint)]">{p.role}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhum personagem jogador registrado ainda.</p>
        )}
      </PageSection>

      <PageSection id="ameacas" icon="👹" title="Ameaças">
        {antagonists.length + monsters.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {[...antagonists, ...monsters].map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhuma ameaça registrada ainda.</p>
        )}
      </PageSection>

      <PageSection id="npcs" icon="👤" title="NPCs">
        {npcs.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {npcs.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhum NPC registrado ainda.</p>
        )}
      </PageSection>

      <PageSection id="locais" icon="🗺️" title="Locais">
        {locations.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhum local registrado ainda.</p>
        )}
      </PageSection>

      <PageSection id="documentos" icon="📜" title="Documentos">
        {documents.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhum documento registrado ainda.</p>
        )}
      </PageSection>

      <PageSection id="pistas" icon="🔎" title="Pistas">
        {clues.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {clues.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhuma pista registrada ainda.</p>
        )}
      </PageSection>

      <PageSection id="organizacoes" icon="🏛️" title="Organizações">
        {organizations.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhuma organização registrada ainda.</p>
        )}
      </PageSection>

      <PageSection id="experimentos" icon="🧪" title="Experimentos">
        {experiments.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {experiments.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhum experimento registrado ainda.</p>
        )}
      </PageSection>

      <PageSection id="segredos" icon="🔒" title="Informações do mestre">
        {secrets.length > 0 ? (
          <div className="space-y-2.5">
            {secrets.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-status-secret)]/25 bg-[var(--color-status-secret-bg)] px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
                  <span>{e.icon}</span>
                  {e.title}
                </span>
                <SecretBadge level="secret" size="xs" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">Nenhum segredo registrado nesta campanha ainda.</p>
        )}
      </PageSection>

      <RelationGroups groups={externalConnections} title="🔗 Conexões externas" />
    </div>
  )
}

function CampaignOverview({ campaign, threatCount }: { campaign: Campaign; threatCount: number }) {
  const { updateCampaignMeta, setCampaignBlocks } = useUniverse()
  const [title, setTitle] = useState(campaign.title)
  const [blocks, setBlocks] = useState<Block[]>(campaign.blocks ?? [])

  useDebouncedCommit(title, (t) => updateCampaignMeta(campaign.id, { title: t || 'Sem título' }))
  useDebouncedCommit(blocks, (b) => setCampaignBlocks(campaign.id, b))

  return (
    <header id="visao-geral" className="scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => updateCampaignMeta(campaign.id, { status: STATUS_ORDER[(STATUS_ORDER.indexOf(campaign.status) + 1) % STATUS_ORDER.length] })}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${STATUS_CLASS[campaign.status]}`}
        >
          {STATUS_LABEL[campaign.status]}
        </button>
        <span className="text-xs text-[var(--color-ink-faint)]">{campaign.subtitle}</span>
      </div>

      <EditableText
        value={title}
        onChange={setTitle}
        placeholder="Sem título"
        className="font-serif-display text-4xl font-semibold text-[var(--color-ink)]"
      />

      <div className="mt-4">
        <BlockEditor ownerId={campaign.id} blocks={blocks} onChange={setBlocks} />
      </div>

      <div className="mt-5 flex flex-wrap gap-6 text-sm text-[var(--color-ink-muted)]">
        <span>
          <strong className="text-[var(--color-ink)]">{campaign.sessions ?? 0}</strong> sessões
        </span>
        <span>
          <strong className="text-[var(--color-ink)]">{campaign.players ?? 0}</strong> jogadores
        </span>
        <span>
          <strong className="text-[var(--color-ink)]">{threatCount}</strong> ameaças
        </span>
      </div>
    </header>
  )
}
