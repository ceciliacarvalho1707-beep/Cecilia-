import { useState, type ReactNode } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import type { SecretLevel } from '../types'

const ORDER: SecretLevel[] = ['public', 'master', 'secret']

const DOT_CLASS: Record<SecretLevel, string> = {
  public: 'bg-[var(--color-status-public)]',
  master: 'bg-[var(--color-status-master)]',
  secret: 'bg-[var(--color-status-secret)]',
}

const LEVEL_LABEL: Record<SecretLevel, string> = {
  public: 'Público — visível para todos',
  master: 'Mestre — clique para ciclar o nível',
  secret: 'Segredo — clique para ciclar o nível',
}

/** Small gutter control: click cycles a block's visibility level public → master → secret. */
export function SecretLevelDot({ level, onChange }: { level: SecretLevel; onChange: (level: SecretLevel) => void }) {
  return (
    <button
      type="button"
      title={LEVEL_LABEL[level]}
      onClick={() => onChange(ORDER[(ORDER.indexOf(level) + 1) % ORDER.length])}
      className="flex size-5 shrink-0 items-center justify-center rounded-full transition hover:bg-[var(--color-overlay)]"
    >
      <span className={`size-2 rounded-full ${DOT_CLASS[level]}`} />
    </button>
  )
}

/** Wraps a block's rendered content with the blur/reveal treatment when its level isn't public. */
export function GuardedContent({ level, children }: { level: SecretLevel; children: ReactNode }) {
  const guarded = level !== 'public'
  const [revealed, setRevealed] = useState(!guarded)

  if (!guarded) return <>{children}</>

  return (
    <div
      className={`relative rounded-md border px-3 py-2 ${
        level === 'secret' ? 'border-[var(--color-status-secret)]/25 bg-[var(--color-status-secret-bg)]' : 'border-[var(--color-status-master)]/20 bg-[var(--color-status-master-bg)]'
      }`}
    >
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="mb-1.5 flex items-center gap-1 text-[11px] text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink-soft)]"
      >
        {level === 'secret' && <Lock className="size-3" />}
        {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
        {revealed ? 'Ocultar' : 'Revelar'} · {level === 'secret' ? 'Segredo' : 'Mestre'}
      </button>
      <div className={revealed ? '' : 'pointer-events-none select-none blur-sm'}>{children}</div>
    </div>
  )
}
