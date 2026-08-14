import { useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useClickOutside } from '../hooks/useClickOutside'
import { useUniverse } from '../store/UniverseStore'

export function RelationPicker({ excludeIds, onPick }: { excludeIds: string[]; onPick: (id: string) => void }) {
  const { entities, campaigns } = useUniverse()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const allPages = useMemo(
    () => [
      ...campaigns.map((c) => ({ id: c.id, title: c.title, icon: c.icon })),
      ...entities.map((e) => ({ id: e.id, title: e.title, icon: e.icon })),
    ],
    [entities, campaigns],
  )

  const results = allPages
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 40)

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-ink-faint)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink-soft)]"
      >
        <Plus className="size-3.5" />
        Adicionar relação
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-72 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-raised)] p-2 shadow-[var(--shadow-float)]">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar uma página..."
            className="mb-1.5 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-base)] px-2.5 py-1.5 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-gold-dim)]"
          />
          <div className="max-h-56 overflow-y-auto">
            {results.length === 0 && <p className="px-2 py-3 text-xs text-[var(--color-ink-faint)]">Nada encontrado.</p>}
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPick(p.id)
                  setQuery('')
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-[var(--color-ink-soft)] transition hover:bg-[var(--color-overlay)]"
              >
                <span className="text-[13px]">{p.icon}</span>
                <span className="truncate">{p.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
