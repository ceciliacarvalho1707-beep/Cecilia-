import type { ReactNode } from 'react'

export function PageSection({
  id,
  icon,
  title,
  action,
  children,
}: {
  id: string
  icon: string
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-[var(--color-border-soft)] pt-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif-display text-xl font-semibold text-[var(--color-ink)]">
          <span>{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
