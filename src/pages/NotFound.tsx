import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="mb-4 text-3xl opacity-60">🕯️</span>
      <h1 className="font-serif-display text-2xl font-semibold text-[var(--color-ink)]">Esta página se perdeu na névoa</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-ink-muted)]">O registro que você procura não existe — ainda — neste universo.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-raised)] px-4 py-2 text-sm text-[var(--color-ink-soft)] transition hover:border-[var(--color-gold-dim)] hover:text-[var(--color-gold-soft)]"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
