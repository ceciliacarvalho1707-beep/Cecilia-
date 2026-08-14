import { BookOpen, Ghost, Lightbulb, Scroll, Skull, Sparkles } from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { typeToPath } from '../data/universe'
import { useUniverse } from '../store/UniverseStore'
import { formatDate } from '../components/ui/EntityCard'
import { Link } from 'react-router-dom'

export function Dashboard() {
  const { campaigns, entities, getCampaign } = useUniverse()
  const antagonistCount = entities.filter((e) => e.type === 'antagonist').length
  const monsterCount = entities.filter((e) => e.type === 'monster').length
  const documentCount = entities.filter((e) => e.type === 'document').length

  const recentlyUpdated = [...entities]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5)

  const recentIdeas = entities.filter((e) => e.type === 'idea').slice(0, 3)

  return (
    <div className="space-y-10">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-gold-dim)]">Bíblia do Universo</p>
        <h1 className="font-serif-display text-4xl font-semibold text-[var(--color-ink)] sm:text-[42px]">🎲 Meu Universo</h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
          Toda cidade tem seu silêncio, toda instituição seu subsolo. Aqui vivem as campanhas, os segredos e as coisas que ainda não têm nome.
        </p>
      </div>

      <section>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <StatCard icon={BookOpen} label="Campanhas" value={campaigns.length} detail="em desenvolvimento" href="/campanhas" />
          <StatCard icon={Skull} label="Antagonistas" value={antagonistCount} detail="registrados" href="/antagonistas" />
          <StatCard icon={Ghost} label="Criaturas" value={monsterCount} detail="catalogadas" href="/criaturas" />
          <StatCard icon={Scroll} label="Documentos" value={documentCount} detail="arquivados" href="/documentos" />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-3 flex items-center gap-2 font-serif-display text-lg font-semibold text-[var(--color-ink)]">
            <Sparkles className="size-4 text-[var(--color-gold-soft)]" />
            Atualizado recentemente
          </h2>
          <div className="divide-y divide-[var(--color-border-soft)] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-raised)]">
            {recentlyUpdated.map((e) => {
              const campaign = e.campaignId ? getCampaign(e.campaignId) : undefined
              return (
                <Link
                  key={e.id}
                  to={`/${typeToPath(e.type)}/${e.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--color-overlay)]/50"
                >
                  <span className="text-base">{e.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-ink-soft)]">{e.title || 'Sem título'}</p>
                    {campaign && <p className="truncate text-xs text-[var(--color-ink-faint)]">{campaign.title || 'Sem título'}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-ink-faint)]">{formatDate(e.updatedAt)}</span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-serif-display text-lg font-semibold text-[var(--color-ink)]">
            <Lightbulb className="size-4 text-[var(--color-gold-soft)]" />
            Ideias recentes
          </h2>
          <div className="space-y-2.5">
            {recentIdeas.map((idea) => (
              <Link
                key={idea.id}
                to={`/ideias/${idea.id}`}
                className="block rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-raised)] px-4 py-3 text-sm text-[var(--color-ink-soft)] transition hover:border-[var(--color-border-strong)]"
              >
                {idea.title}
              </Link>
            ))}
            <Link
              to="/ideias"
              className="block px-4 py-1.5 text-xs font-medium text-[var(--color-ink-faint)] transition hover:text-[var(--color-gold-soft)]"
            >
              Ver banco de ideias completo →
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
