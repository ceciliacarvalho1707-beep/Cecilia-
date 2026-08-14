import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Table2 } from 'lucide-react'
import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { EntityCard, formatDate } from '../components/ui/EntityCard'
import { SecretBadge } from '../components/ui/SecretBadge'
import { getCampaign, getEntitiesByType } from '../data/universe'

export function CreaturesPage() {
  const [view, setView] = useState<'grid' | 'table'>('table')
  const creatures = getEntitiesByType('monster')

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Criaturas' }]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👹</span>
          <div>
            <h1 className="font-serif-display text-3xl font-semibold text-[var(--color-ink)]">Criaturas</h1>
            <p className="text-sm text-[var(--color-ink-faint)]">{creatures.length} registros · visualização de banco de dados</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-raised)] p-1">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === 'table' ? 'bg-[var(--color-overlay)] text-[var(--color-gold-soft)]' : 'text-[var(--color-ink-faint)]'
            }`}
          >
            <Table2 className="size-3.5" /> Tabela
          </button>
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === 'grid' ? 'bg-[var(--color-overlay)] text-[var(--color-gold-soft)]' : 'text-[var(--color-ink-faint)]'
            }`}
          >
            <LayoutGrid className="size-3.5" /> Grade
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {creatures.map((c) => (
            <EntityCard key={c.id} entity={c} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border-soft)]">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-soft)] bg-[var(--color-raised)] text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Elemento</th>
                <th className="px-4 py-3 font-medium">Campanha</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-soft)]">
              {creatures.map((c) => {
                const campaign = c.campaignId ? getCampaign(c.campaignId) : undefined
                return (
                  <tr key={c.id} className="transition hover:bg-[var(--color-overlay)]/40">
                    <td className="px-4 py-3">
                      <Link to={`/criaturas/${c.id}`} className="flex items-center gap-2 font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-gold-soft)]">
                        <span>{c.icon}</span>
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                      {c.element ? (
                        <span className="rounded-full border border-[var(--color-border-soft)] px-2 py-0.5 text-xs">{c.element}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-muted)]">
                      {campaign ? (
                        <Link to={`/campanhas/${campaign.id}`} className="hover:text-[var(--color-gold-soft)]">
                          {campaign.title}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">{c.status && <SecretBadge level={c.status} size="xs" />}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-faint)]">{formatDate(c.updatedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
