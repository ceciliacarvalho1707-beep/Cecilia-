import { Breadcrumbs } from '../components/layout/Breadcrumbs'

export function PlaceholderPage({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div>
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: title }]} />

      <div className="mb-7 flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h1 className="font-serif-display text-3xl font-semibold text-[var(--color-ink)]">{title}</h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] py-20 text-center">
        <span className="mb-3 text-2xl opacity-60">{icon}</span>
        <p className="max-w-sm text-sm text-[var(--color-ink-muted)]">{description}</p>
      </div>
    </div>
  )
}
