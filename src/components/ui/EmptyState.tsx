export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] py-16 text-center">
      <span className="mb-3 text-2xl opacity-60">🕯️</span>
      <p className="text-sm text-[var(--color-ink-muted)]">Nenhum registro em {label} ainda.</p>
      <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Use "＋ Nova página" para começar.</p>
    </div>
  )
}
