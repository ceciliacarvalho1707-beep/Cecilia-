import type { SecretLevel } from '../../types'

const CONFIG: Record<SecretLevel, { label: string; dot: string; text: string; bg: string; ring: string }> = {
  public: {
    label: 'Público',
    dot: 'bg-[var(--color-status-public)]',
    text: 'text-[var(--color-status-public)]',
    bg: 'bg-[var(--color-status-public-bg)]',
    ring: 'ring-[var(--color-status-public)]/25',
  },
  master: {
    label: 'Mestre',
    dot: 'bg-[var(--color-status-master)]',
    text: 'text-[var(--color-status-master)]',
    bg: 'bg-[var(--color-status-master-bg)]',
    ring: 'ring-[var(--color-status-master)]/25',
  },
  secret: {
    label: 'Segredo',
    dot: 'bg-[var(--color-status-secret)]',
    text: 'text-[var(--color-status-secret)]',
    bg: 'bg-[var(--color-status-secret-bg)]',
    ring: 'ring-[var(--color-status-secret)]/25',
  },
}

export function SecretBadge({ level, size = 'sm' }: { level: SecretLevel; size?: 'sm' | 'xs' }) {
  const c = CONFIG[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 ${c.bg} ${c.ring} ${
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]'
      } font-medium tracking-wide ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export function statusDotClass(level: SecretLevel): string {
  return CONFIG[level].dot
}
