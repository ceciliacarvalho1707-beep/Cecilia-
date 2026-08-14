import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { PageSection } from '../components/ui/PageSection'
import { EntityCard } from '../components/ui/EntityCard'
import { SecretBadge } from '../components/ui/SecretBadge'
import { getCampaign, getEntitiesByCampaign } from '../data/universe'
import { NotFound } from './NotFound'

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Em andamento',
  planejamento: 'Em planejamento',
  concluída: 'Concluída',
}

export function CampaignDetail() {
  const { id } = useParams()
  const campaign = id ? getCampaign(id) : undefined

  if (!campaign) return <NotFound />

  const antagonists = getEntitiesByCampaign(campaign.id, 'antagonist')
  const monsters = getEntitiesByCampaign(campaign.id, 'monster')
  const npcs = getEntitiesByCampaign(campaign.id, 'npc')
  const locations = getEntitiesByCampaign(campaign.id, 'location')
  const documents = getEntitiesByCampaign(campaign.id, 'document')
  const clues = getEntitiesByCampaign(campaign.id, 'clue')
  const secrets = getEntitiesByCampaign(campaign.id).filter((e) => e.status === 'secret')

  return (
    <div className="space-y-9">
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Campanhas', href: '/campanhas' }, { label: campaign.title }]} />

      <header id="visao-geral" className="scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              campaign.status === 'ativa'
                ? 'bg-[var(--color-status-public-bg)] text-[var(--color-status-public)]'
                : campaign.status === 'planejamento'
                  ? 'bg-[var(--color-status-master-bg)] text-[var(--color-status-master)]'
                  : 'bg-[var(--color-overlay)] text-[var(--color-ink-muted)]'
            }`}
          >
            {STATUS_LABEL[campaign.status]}
          </span>
          <span className="text-xs text-[var(--color-ink-faint)]">{campaign.subtitle}</span>
        </div>

        <h1 className="font-serif-display text-4xl font-semibold text-[var(--color-ink)]">
          <span className="mr-2">{campaign.icon}</span>
          {campaign.title}
        </h1>

        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-soft)]">{campaign.summary}</p>

        <div className="mt-5 flex flex-wrap gap-6 text-sm text-[var(--color-ink-muted)]">
          <span>
            <strong className="text-[var(--color-ink)]">{campaign.sessions ?? 0}</strong> sessões
          </span>
          <span>
            <strong className="text-[var(--color-ink)]">{campaign.players ?? 0}</strong> jogadores
          </span>
          <span>
            <strong className="text-[var(--color-ink)]">{antagonists.length + monsters.length}</strong> ameaças
          </span>
        </div>
      </header>

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
    </div>
  )
}
