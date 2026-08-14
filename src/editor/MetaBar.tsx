import { useState } from 'react'
import { Archive, ArchiveRestore, Plus, X } from 'lucide-react'
import type { SecretLevel } from '../types'
import { useUniverse } from '../store/UniverseStore'

const LEVEL_ORDER: SecretLevel[] = ['public', 'master', 'secret']
const LEVEL_CONFIG: Record<SecretLevel, { label: string; text: string; bg: string }> = {
  public: { label: 'Público', text: 'text-[var(--color-status-public)]', bg: 'bg-[var(--color-status-public-bg)]' },
  master: { label: 'Mestre', text: 'text-[var(--color-status-master)]', bg: 'bg-[var(--color-status-master-bg)]' },
  secret: { label: 'Segredo', text: 'text-[var(--color-status-secret)]', bg: 'bg-[var(--color-status-secret-bg)]' },
}

interface MetaBarProps {
  typeLabel: string
  typeIcon: string
  status: SecretLevel
  onChangeStatus: (level: SecretLevel) => void
  campaignId?: string
  onChangeCampaign: (id: string | undefined) => void
  tags: string[]
  onChangeTags: (tags: string[]) => void
  archivedAt?: string
  onArchive: () => void
  onUnarchive: () => void
}

export function MetaBar({ typeLabel, typeIcon, status, onChangeStatus, campaignId, onChangeCampaign, tags, onChangeTags, archivedAt, onArchive, onUnarchive }: MetaBarProps) {
  const { campaigns } = useUniverse()
  const [addingTag, setAddingTag] = useState(false)
  const [tagDraft, setTagDraft] = useState('')

  const pillClass = 'rounded-full border border-[var(--color-border-soft)] px-2.5 py-1 text-[11px] text-[var(--color-ink-muted)]'

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className={pillClass}>
        {typeIcon} {typeLabel}
      </span>

      <button
        type="button"
        onClick={() => onChangeStatus(LEVEL_ORDER[(LEVEL_ORDER.indexOf(status) + 1) % LEVEL_ORDER.length])}
        title="Nível de acesso padrão da página — clique para alternar"
        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${LEVEL_CONFIG[status].bg} ${LEVEL_CONFIG[status].text}`}
      >
        ● {LEVEL_CONFIG[status].label}
      </button>

      <select
        value={campaignId ?? ''}
        onChange={(e) => onChangeCampaign(e.target.value || undefined)}
        className={`${pillClass} cursor-pointer bg-[var(--color-base)] outline-none`}
      >
        <option value="">Sem campanha</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title || 'Sem título'}
          </option>
        ))}
      </select>

      {tags.map((tag) => (
        <span key={tag} className={`${pillClass} group flex items-center gap-1`}>
          {tag}
          <button type="button" onClick={() => onChangeTags(tags.filter((t) => t !== tag))} className="text-[var(--color-ink-faint)] hover:text-[var(--color-status-secret)]">
            <X className="size-2.5" />
          </button>
        </span>
      ))}

      {addingTag ? (
        <input
          autoFocus
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onBlur={() => setAddingTag(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && tagDraft.trim()) {
              onChangeTags([...tags, tagDraft.trim()])
              setTagDraft('')
              setAddingTag(false)
            } else if (e.key === 'Escape') {
              setAddingTag(false)
            }
          }}
          placeholder="tag..."
          className="w-20 rounded-full border border-[var(--color-border)] bg-[var(--color-base)] px-2.5 py-1 text-[11px] text-[var(--color-ink)] outline-none focus:border-[var(--color-gold-dim)]"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingTag(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-ink-faint)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink-soft)]"
        >
          <Plus className="size-2.5" /> tag
        </button>
      )}

      <button
        type="button"
        onClick={archivedAt ? onUnarchive : onArchive}
        className="ml-auto flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] px-2.5 py-1 text-[11px] text-[var(--color-ink-faint)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink-soft)]"
      >
        {archivedAt ? (
          <>
            <ArchiveRestore className="size-3" /> Restaurar
          </>
        ) : (
          <>
            <Archive className="size-3" /> Arquivar
          </>
        )}
      </button>
    </div>
  )
}
