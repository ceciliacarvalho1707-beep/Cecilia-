import { makeBlockId } from './blocks'
import { EditableText } from './EditableText'
import { RelationPicker } from './RelationPicker'
import { RelationChip } from '../components/ui/RelationChip'
import { useUniverse } from '../store/UniverseStore'
import type { Block } from '../types'

interface BlockContentProps {
  block: Block
  ownerId: string
  onUpdate: (patch: Partial<Block>) => void
  onEnter: () => void
  onBackspaceEmpty: () => void
  registerRef: (el: HTMLDivElement | null) => void
}

export function BlockContent({ block, ownerId, onUpdate, onEnter, onBackspaceEmpty, registerRef }: BlockContentProps) {
  switch (block.type) {
    case 'heading2':
      return (
        <EditableText
          ref={registerRef}
          value={block.text}
          placeholder="Subtítulo grande"
          className="font-serif-display text-2xl font-semibold text-[var(--color-ink)]"
          onChange={(text) => onUpdate({ text })}
          onEnter={onEnter}
          onBackspaceEmpty={onBackspaceEmpty}
        />
      )
    case 'heading3':
      return (
        <EditableText
          ref={registerRef}
          value={block.text}
          placeholder="Subtítulo"
          className="font-serif-display text-lg font-semibold text-[var(--color-ink)]"
          onChange={(text) => onUpdate({ text })}
          onEnter={onEnter}
          onBackspaceEmpty={onBackspaceEmpty}
        />
      )
    case 'paragraph':
      return (
        <EditableText
          ref={registerRef}
          value={block.text}
          placeholder="Escreva alguma coisa..."
          className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]"
          onChange={(text) => onUpdate({ text })}
          onEnter={onEnter}
          onBackspaceEmpty={onBackspaceEmpty}
        />
      )
    case 'quote':
      return (
        <div className="border-l-2 border-[var(--color-gold-dim)] pl-4">
          <EditableText
            ref={registerRef}
            value={block.text}
            placeholder="Uma citação..."
            className="font-serif-display text-lg italic text-[var(--color-ink-soft)]"
            onChange={(text) => onUpdate({ text })}
            onEnter={onEnter}
            onBackspaceEmpty={onBackspaceEmpty}
          />
        </div>
      )
    case 'callout':
      return (
        <div className="flex items-start gap-2.5 rounded-lg bg-[var(--color-overlay)] px-4 py-3">
          <span className="text-base">{block.icon}</span>
          <EditableText
            ref={registerRef}
            value={block.text}
            placeholder="Uma informação em destaque..."
            className="flex-1 text-sm leading-relaxed text-[var(--color-ink-soft)]"
            onChange={(text) => onUpdate({ text })}
            onEnter={onEnter}
            onBackspaceEmpty={onBackspaceEmpty}
          />
        </div>
      )
    case 'divider':
      return <hr className="border-t border-[var(--color-border-soft)]" />
    case 'bulleted_list':
    case 'numbered_list':
      return (
        <div className="space-y-1.5">
          {block.items.map((item, i) => (
            <div key={item.id} className="flex items-start gap-2.5">
              <span className="mt-[3px] w-4 shrink-0 text-sm text-[var(--color-ink-faint)]">
                {block.type === 'numbered_list' ? `${i + 1}.` : '•'}
              </span>
              <EditableText
                ref={i === 0 ? registerRef : undefined}
                value={item.text}
                placeholder="Item da lista"
                className="flex-1 text-[15px] leading-relaxed text-[var(--color-ink-soft)]"
                onChange={(text) => {
                  const items = block.items.map((it, idx) => (idx === i ? { ...it, text } : it))
                  onUpdate({ items })
                }}
                onEnter={() => {
                  if (item.text === '' && i === block.items.length - 1) {
                    onUpdate({ items: block.items.slice(0, -1) })
                    onEnter()
                  } else {
                    const items = [...block.items]
                    items.splice(i + 1, 0, { id: makeBlockId(), text: '' })
                    onUpdate({ items })
                  }
                }}
                onBackspaceEmpty={() => {
                  if (block.items.length === 1) {
                    onBackspaceEmpty()
                  } else {
                    onUpdate({ items: block.items.filter((_, idx) => idx !== i) })
                  }
                }}
              />
            </div>
          ))}
        </div>
      )
    case 'image':
      return (
        <div className="space-y-2">
          {block.url ? (
            <img src={block.url} alt={block.caption || ''} className="max-h-96 w-full rounded-lg border border-[var(--color-border-soft)] object-cover" />
          ) : (
            <input
              autoFocus
              value={block.url}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="Cole a URL de uma imagem e pressione Enter..."
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-full rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-raised)] px-3 py-4 text-center text-sm text-[var(--color-ink-soft)] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-gold-dim)]"
            />
          )}
          {block.url && (
            <EditableText
              value={block.caption}
              placeholder="Legenda (opcional)"
              className="text-center text-xs text-[var(--color-ink-faint)]"
              onChange={(caption) => onUpdate({ caption })}
              onEnter={onEnter}
            />
          )}
        </div>
      )
    case 'page_link':
      return <PageLinkContent targetId={block.targetId} onPick={(targetId) => onUpdate({ targetId })} />
    case 'relation':
      return <RelationContent ownerId={ownerId} />
  }
}

function PageLinkContent({ targetId, onPick }: { targetId: string; onPick: (id: string) => void }) {
  const { resolveRelation } = useUniverse()
  const ref = resolveRelation(targetId)
  if (ref) return <RelationChip title={ref.title} icon={ref.icon} href={ref.href} />
  return <RelationPicker excludeIds={[]} onPick={onPick} />
}

function RelationContent({ ownerId }: { ownerId: string }) {
  const { getEntity, getCampaign, resolveRelation, addRelation, removeRelation } = useUniverse()
  const relations = getEntity(ownerId)?.relations ?? getCampaign(ownerId)?.relations ?? []

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">Relacionado a</p>
      <div className="flex flex-wrap items-center gap-2">
        {relations.map((id) => {
          const ref = resolveRelation(id)
          if (!ref) return null
          return (
            <span key={id} className="group relative">
              <RelationChip title={ref.title} icon={ref.icon} href={ref.href} />
              <button
                type="button"
                title="Remover relação"
                onClick={() => removeRelation(ownerId, id)}
                className="absolute -right-1.5 -top-1.5 hidden size-4 items-center justify-center rounded-full bg-[var(--color-status-secret)] text-[9px] text-white group-hover:flex"
              >
                ×
              </button>
            </span>
          )
        })}
        <RelationPicker excludeIds={[ownerId, ...relations]} onPick={(id) => addRelation(ownerId, id)} />
      </div>
    </div>
  )
}
