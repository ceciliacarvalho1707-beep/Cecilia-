import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { BLOCK_MENU } from './blocks'
import type { BlockType } from '../types'
import { useClickOutside } from '../hooks/useClickOutside'

export function AddBlockMenu({ onPick, compact = false }: { onPick: (type: BlockType) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Adicionar bloco"
        className={
          compact
            ? 'flex size-5 items-center justify-center rounded text-[var(--color-ink-faint)] transition hover:bg-[var(--color-overlay)] hover:text-[var(--color-ink-soft)]'
            : 'flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-ink-faint)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink-soft)]'
        }
      >
        <Plus className="size-3.5" />
        {!compact && 'Adicionar bloco'}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 max-h-80 w-64 overflow-y-auto rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-raised)] p-1.5 shadow-[var(--shadow-float)]">
          {BLOCK_MENU.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => {
                onPick(item.type)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition hover:bg-[var(--color-overlay)]"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-overlay)] text-xs font-semibold text-[var(--color-ink-soft)]">
                {item.icon}
              </span>
              <span>
                <span className="block text-sm text-[var(--color-ink-soft)]">{item.label}</span>
                <span className="block text-[11px] text-[var(--color-ink-faint)]">{item.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
