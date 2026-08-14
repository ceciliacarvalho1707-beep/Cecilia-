import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useUniverse } from '../../store/UniverseStore'
import { typeToPath } from '../../data/universe'
import type { EntityType } from '../../types'

const PAGE_TYPES: { icon: string; label: string; desc: string; type: EntityType | 'campaign' }[] = [
  { icon: '📄', label: 'Página em branco', desc: 'Comece do zero', type: 'page' },
  { icon: '🎭', label: 'Campanha', desc: 'Uma nova história para o universo', type: 'campaign' },
  { icon: '👹', label: 'Monstro', desc: 'Criatura ou ameaça', type: 'monster' },
  { icon: '☠️', label: 'Antagonista', desc: 'Vilão ou força motriz', type: 'antagonist' },
  { icon: '👤', label: 'NPC', desc: 'Personagem não jogável', type: 'npc' },
  { icon: '🗺️', label: 'Local', desc: 'Lugar do universo', type: 'location' },
  { icon: '📜', label: 'Documento', desc: 'Carta, diário, relatório...', type: 'document' },
  { icon: '🔎', label: 'Pista', desc: 'Fragmento de investigação', type: 'clue' },
  { icon: '🧪', label: 'Experimento', desc: 'Projeto ou protocolo', type: 'experiment' },
  { icon: '🏛️', label: 'Organização', desc: 'Facção, grupo ou culto', type: 'organization' },
  { icon: '💡', label: 'Ideia', desc: 'Guardar para depois', type: 'idea' },
]

export function NewPageModal({ onClose }: { onClose: () => void }) {
  const { createPage, createCampaign } = useUniverse()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handlePick(type: EntityType | 'campaign') {
    if (type === 'campaign') {
      const id = createCampaign()
      navigate(`/campanhas/${id}`, { state: { focusTitle: true } })
    } else {
      const id = createPage(type)
      navigate(`/${typeToPath(type)}/${id}`, { state: { focusTitle: true } })
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-raised)] shadow-[var(--shadow-float)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
          <div>
            <h2 className="font-serif-display text-xl font-semibold text-[var(--color-ink)]">Criar página</h2>
            <p className="text-xs text-[var(--color-ink-faint)]">Escolha um tipo para começar</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition hover:bg-[var(--color-overlay)] hover:text-[var(--color-ink)]"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="grid max-h-[55vh] grid-cols-2 gap-1.5 overflow-y-auto p-3">
          {PAGE_TYPES.map((t) => (
            <button
              key={t.label}
              onClick={() => handlePick(t.type)}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[var(--color-overlay)]"
            >
              <span className="text-lg">{t.icon}</span>
              <span>
                <span className="block text-sm font-medium text-[var(--color-ink-soft)]">{t.label}</span>
                <span className="block text-xs text-[var(--color-ink-faint)]">{t.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-[var(--color-border-soft)] px-5 py-3">
          <p className="text-xs text-[var(--color-ink-faint)]">A página abre pronta para você escrever — dá para editar tudo depois.</p>
        </div>
      </div>
    </div>
  )
}
