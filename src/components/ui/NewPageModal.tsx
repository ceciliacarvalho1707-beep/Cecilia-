import { useEffect } from 'react'
import { X } from 'lucide-react'

const PAGE_TYPES = [
  { icon: '📄', label: 'Página em branco', desc: 'Comece do zero' },
  { icon: '🎭', label: 'Campanha', desc: 'Uma nova história para o universo' },
  { icon: '👹', label: 'Monstro', desc: 'Criatura ou ameaça' },
  { icon: '☠️', label: 'Antagonista', desc: 'Vilão ou força motriz' },
  { icon: '👤', label: 'NPC', desc: 'Personagem não jogável' },
  { icon: '🗺️', label: 'Local', desc: 'Lugar do universo' },
  { icon: '📜', label: 'Documento', desc: 'Carta, diário, relatório...' },
  { icon: '🔎', label: 'Pista', desc: 'Fragmento de investigação' },
  { icon: '🧪', label: 'Experimento', desc: 'Projeto ou protocolo' },
  { icon: '💡', label: 'Ideia', desc: 'Guardar para depois' },
]

export function NewPageModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
              disabled
              title="Disponível em uma próxima etapa"
              className="flex cursor-not-allowed items-start gap-3 rounded-lg px-3 py-2.5 text-left opacity-70 transition hover:bg-[var(--color-overlay)]"
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
          <p className="text-xs text-[var(--color-ink-faint)]">
            A criação de páginas será habilitada em uma próxima etapa — por enquanto, esta é apenas a experiência visual.
          </p>
        </div>
      </div>
    </div>
  )
}
