import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import type { Block } from '../../types'
import { SecretBadge } from './SecretBadge'

export function SecretBlock({ block }: { block: Block }) {
  const guarded = block.level !== 'public'
  const [revealed, setRevealed] = useState(!guarded)

  return (
    <section
      className={`rounded-lg border px-5 py-4 ${
        block.level === 'secret'
          ? 'border-[var(--color-status-secret)]/25 bg-[var(--color-status-secret-bg)]'
          : block.level === 'master'
            ? 'border-[var(--color-status-master)]/20 bg-[var(--color-status-master-bg)]'
            : 'border-[var(--color-border-soft)] bg-transparent'
      }`}
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-serif-display text-lg font-semibold text-[var(--color-ink)]">
          {block.level === 'secret' && !revealed ? <Lock className="mr-1.5 inline size-4 -translate-y-0.5 text-[var(--color-status-secret)]" /> : null}
          {block.heading}
        </h3>
        <div className="flex items-center gap-2">
          <SecretBadge level={block.level} size="xs" />
          {guarded && (
            <button
              onClick={() => setRevealed((r) => !r)}
              className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-ink-muted)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink-soft)]"
            >
              {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              {revealed ? 'Ocultar' : 'Revelar'}
            </button>
          )}
        </div>
      </header>
      <p
        className={`mt-2.5 text-[15px] leading-relaxed text-[var(--color-ink-soft)] transition duration-300 ${
          revealed ? '' : 'select-none blur-sm'
        }`}
      >
        {revealed ? block.content : 'Conteúdo oculto até ser revelado pelo mestre.'}
      </p>
    </section>
  )
}
