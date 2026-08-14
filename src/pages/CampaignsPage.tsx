import { Link } from 'react-router-dom'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { campaigns } from '../data/universe'
import { formatDate } from '../components/ui/EntityCard'

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Em andamento',
  planejamento: 'Em planejamento',
  concluída: 'Concluída',
}

export function CampaignsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Campanhas' }]} />

      <div className="mb-7 flex items-center gap-3">
        <span className="text-2xl">📚</span>
        <div>
          <h1 className="font-serif-display text-3xl font-semibold text-[var(--color-ink)]">Campanhas</h1>
          <p className="text-sm text-[var(--color-ink-faint)]">{campaigns.length} campanhas no universo</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {campaigns.map((c) => (
          <Link
            key={c.id}
            to={`/campanhas/${c.id}`}
            className="group flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-panel)]"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">{c.icon}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  c.status === 'ativa'
                    ? 'bg-[var(--color-status-public-bg)] text-[var(--color-status-public)]'
                    : c.status === 'planejamento'
                      ? 'bg-[var(--color-status-master-bg)] text-[var(--color-status-master)]'
                      : 'bg-[var(--color-overlay)] text-[var(--color-ink-muted)]'
                }`}
              >
                {STATUS_LABEL[c.status]}
              </span>
            </div>
            <div>
              <h2 className="font-serif-display text-xl font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-gold-soft)]">
                {c.title}
              </h2>
              <p className="text-xs text-[var(--color-ink-faint)]">{c.subtitle}</p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">{c.summary}</p>
            <div className="mt-auto flex items-center gap-4 border-t border-[var(--color-border-soft)] pt-3 text-xs text-[var(--color-ink-faint)]">
              <span>{c.sessions ?? 0} sessões</span>
              <span>{c.players ?? 0} jogadores</span>
              <span className="ml-auto">Atualizado {formatDate(c.updatedAt)}</span>
            </div>
          </Link>
        ))}
      </div>

      <div id="futuras" className="mt-8 rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center">
        <p className="text-sm text-[var(--color-ink-muted)]">💭 Próximas campanhas ainda estão sendo arquitetadas.</p>
      </div>
    </div>
  )
}
